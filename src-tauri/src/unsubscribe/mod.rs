use regex::Regex;
use serde::{Deserialize, Serialize};
use crate::error::{AppError, AppResult};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UnsubscribeInfo {
    pub has_one_click: bool,
    pub https_url: Option<String>,
    pub mailto_url: Option<String>,
}

pub struct UnsubscribeService;

impl Default for UnsubscribeService {
    fn default() -> Self {
        Self::new()
    }
}

impl UnsubscribeService {
    pub fn new() -> Self {
        Self
    }

    /// Parse List-Unsubscribe and List-Unsubscribe-Post headers (RFC 2369 & RFC 8058)
    pub fn parse_headers(list_unsub: Option<&str>, list_unsub_post: Option<&str>) -> UnsubscribeInfo {
        let mut https_url = None;
        let mut mailto_url = None;

        if let Some(header) = list_unsub {
            // Matches <https://...>
            let https_re = Regex::new(r"<(https?://[^>]+)>").unwrap();
            if let Some(caps) = https_re.captures(header) {
                https_url = caps.get(1).map(|m| m.as_str().to_string());
            }

            // Matches <mailto:...>
            let mailto_re = Regex::new(r"<(mailto:[^>]+)>").unwrap();
            if let Some(caps) = mailto_re.captures(header) {
                mailto_url = caps.get(1).map(|m| m.as_str().to_string());
            }
        }

        let has_one_click = if let Some(post) = list_unsub_post {
            post.contains("List-Unsubscribe=One-Click") && https_url.is_some()
        } else {
            false
        };

        UnsubscribeInfo {
            has_one_click,
            https_url,
            mailto_url,
        }
    }

    /// Execute RFC 8058 one-click unsubscribe via local HTTP POST
    pub async fn execute_one_click(&self, url: &str) -> AppResult<bool> {
        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(10))
            .build()?;

        let response = client
            .post(url)
            .header("Content-Type", "application/x-www-form-urlencoded")
            .body("List-Unsubscribe=One-Click")
            .send()
            .await?;

        if response.status().is_success() {
            Ok(true)
        } else {
            Err(AppError::Network(format!(
                "Unsubscribe request failed with status: {}",
                response.status()
            )))
        }
    }
}
