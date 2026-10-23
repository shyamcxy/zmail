use reqwest::header::{HeaderMap, HeaderValue, AUTHORIZATION};
use serde::Deserialize;
use mail_parser::MessageParser;
use crate::error::{AppError, AppResult};
use crate::models::EmailAddress;
use crate::unsubscribe::UnsubscribeService;

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
struct GmailMessageListResponse {
    messages: Option<Vec<GmailMessageIdItem>>,
    #[serde(rename = "nextPageToken")]
    next_page_token: Option<String>,
    #[serde(rename = "resultSizeEstimate")]
    result_size_estimate: Option<u64>,
}

#[derive(Debug, Deserialize)]
struct GmailMessageIdItem {
    id: String,
    #[serde(rename = "threadId")]
    thread_id: String,
}

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
struct GmailRawMessageResponse {
    id: String,
    #[serde(rename = "threadId")]
    thread_id: String,
    raw: String, // Base64URL-encoded RFC 2822 email
    #[serde(rename = "historyId")]
    history_id: Option<String>,
}

#[derive(Debug, Clone)]
pub struct FetchedGmailMessage {
    pub provider_id: String,
    pub thread_id: String,
    pub message_id_header: Option<String>,
    pub in_reply_to: Option<String>,
    pub subject: String,
    pub from_name: Option<String>,
    pub from_address: String,
    pub to_addresses: Vec<EmailAddress>,
    pub snippet: String,
    pub body_text: Option<String>,
    pub body_html: Option<String>,
    pub received_at: String,
    pub size_bytes: i64,
    pub has_attachments: bool,
    pub unsub_one_click: bool,
    pub unsub_url: Option<String>,
    pub unsub_mailto: Option<String>,
}

pub struct GmailSyncEngine {
    client: reqwest::Client,
}

impl Default for GmailSyncEngine {
    fn default() -> Self {
        Self::new()
    }
}

impl GmailSyncEngine {
    pub fn new() -> Self {
        Self {
            client: reqwest::Client::new(),
        }
    }

    fn auth_headers(&self, access_token: &str) -> AppResult<HeaderMap> {
        let mut headers = HeaderMap::new();
        let auth_val = HeaderValue::from_str(&format!("Bearer {}", access_token))
            .map_err(|e| AppError::Auth(format!("Invalid auth token: {}", e)))?;
        headers.insert(AUTHORIZATION, auth_val);
        Ok(headers)
    }

    /// Fetch and parse recent messages over HTTP (completely detached from DB to ensure thread safety)
    pub async fn fetch_recent_messages(
        &self,
        access_token: &str,
        max_messages: u32,
    ) -> AppResult<(Vec<FetchedGmailMessage>, Option<String>)> {
        let headers = self.auth_headers(access_token)?;

        let list_url = format!(
            "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults={}&q=in:inbox",
            max_messages
        );

        let res = self.client.get(&list_url).headers(headers.clone()).send().await?;
        if !res.status().is_success() {
            let err = res.text().await.unwrap_or_default();
            return Err(AppError::Sync(format!("Failed to list Gmail messages: {}", err)));
        }

        let list_data: GmailMessageListResponse = res.json().await?;
        let items = match list_data.messages {
            Some(msgs) => msgs,
            None => return Ok((Vec::new(), None)),
        };

        let mut fetched_messages = Vec::new();
        let mut latest_history_id: Option<String> = None;

        for item in items {
            // Small pacing interval to respect Google API per-user query limits
            tokio::time::sleep(std::time::Duration::from_millis(60)).await;

            let msg_url = format!(
                "https://gmail.googleapis.com/gmail/v1/users/me/messages/{}?format=raw",
                item.id
            );

            let mut msg_res = self.client.get(&msg_url).headers(headers.clone()).send().await?;
            if msg_res.status().as_u16() == 429 {
                // Rate limit backoff
                tokio::time::sleep(std::time::Duration::from_millis(1500)).await;
                msg_res = self.client.get(&msg_url).headers(headers.clone()).send().await?;
            }

            if !msg_res.status().is_success() {
                continue;
            }

            let raw_msg: GmailRawMessageResponse = match msg_res.json().await {
                Ok(data) => data,
                Err(_) => continue,
            };

            if let Some(hid) = &raw_msg.history_id {
                latest_history_id = Some(hid.clone());
            }

            let standard_b64 = raw_msg.raw.replace('-', "+").replace('_', "/");
            let raw_bytes = match base64_decode(&standard_b64) {
                Some(b) => b,
                None => continue,
            };

            if let Some(parsed) = MessageParser::default().parse(&raw_bytes) {
                let subject = parsed.subject().unwrap_or("No Subject").to_string();
                
                let from_name = parsed.from().and_then(|f| f.first()).and_then(|a| a.name()).map(String::from);
                let from_address = parsed.from().and_then(|f| f.first()).and_then(|a| a.address()).unwrap_or("").to_string();
                
                let mut to_list = Vec::new();
                if let Some(to_group) = parsed.to() {
                    for addr in to_group.iter() {
                        if let Some(a) = addr.address() {
                            to_list.push(EmailAddress {
                                name: addr.name().map(String::from),
                                address: a.to_string(),
                            });
                        }
                    }
                }

                let body_text = parsed.body_text(0).map(|s| s.to_string());
                let body_html = parsed.body_html(0).map(|s| s.to_string());
                let snippet = body_text.as_ref().map(|t| {
                    let s: String = t.chars().take(150).collect();
                    s.replace('\n', " ").trim().to_string()
                }).unwrap_or_default();

                let received_at = parsed.date().map(|d| d.to_rfc3339()).unwrap_or_else(|| {
                    chrono::Utc::now().to_rfc3339()
                });

                let list_unsub_header = parsed.header("List-Unsubscribe").and_then(|h| h.as_text());
                let list_unsub_post_header = parsed.header("List-Unsubscribe-Post").and_then(|h| h.as_text());
                let unsub_info = UnsubscribeService::parse_headers(list_unsub_header, list_unsub_post_header);

                let has_attachments = parsed.attachments().count() > 0;

                fetched_messages.push(FetchedGmailMessage {
                    provider_id: item.id,
                    thread_id: item.thread_id,
                    message_id_header: parsed.message_id().map(String::from),
                    in_reply_to: parsed.in_reply_to().as_text().map(String::from),
                    subject,
                    from_name,
                    from_address,
                    to_addresses: to_list,
                    snippet,
                    body_text,
                    body_html,
                    received_at,
                    size_bytes: raw_bytes.len() as i64,
                    has_attachments,
                    unsub_one_click: unsub_info.has_one_click,
                    unsub_url: unsub_info.https_url,
                    unsub_mailto: unsub_info.mailto_url,
                });
            }
        }

        Ok((fetched_messages, latest_history_id))
    }
}

fn base64_decode(input: &str) -> Option<Vec<u8>> {
    use base64::prelude::*;
    let mut padded = input.to_string();
    while !padded.len().is_multiple_of(4) {
        padded.push('=');
    }
    BASE64_STANDARD.decode(padded.as_bytes()).ok()
}
