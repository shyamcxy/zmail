use tauri::State;
use crate::error::{AppError, AppResult};
use crate::models::{Account, Message, MessageDetail, SendEmailRequest};
use crate::ai::AiTriageResult;
use crate::db::queries::DbService;
use crate::state::SharedAppState;

#[tauri::command]
pub async fn list_accounts(state: State<'_, SharedAppState>) -> AppResult<Vec<Account>> {
    let conn = state.db.get_connection()?;
    let db = DbService::new(&conn);
    db.list_accounts()
}

#[tauri::command]
pub async fn add_account(
    state: State<'_, SharedAppState>,
    account: Account,
    refresh_token_or_password: Option<String>,
) -> AppResult<()> {
    let conn = state.db.get_connection()?;
    let db = DbService::new(&conn);
    db.insert_account(&account)?;

    if let Some(secret) = refresh_token_or_password {
        state.keychain.set_secret("zmail", &account.email, &secret)?;
    }

    Ok(())
}

#[tauri::command]
pub async fn remove_account(
    state: State<'_, SharedAppState>,
    account_id: String,
) -> AppResult<()> {
    let conn = state.db.get_connection()?;
    let db = DbService::new(&conn);
    let account = db.get_account(&account_id)?;
    state.keychain.delete_secret("zmail", &account.email)?;
    db.delete_account(&account_id)?;
    Ok(())
}

#[tauri::command]
pub async fn list_messages(
    state: State<'_, SharedAppState>,
    account_id: Option<String>,
    category: Option<String>,
    is_read: Option<bool>,
    folder: Option<String>,
    limit: Option<u32>,
    offset: Option<u32>,
) -> AppResult<Vec<Message>> {
    let conn = state.db.get_connection()?;
    let db = DbService::new(&conn);
    db.list_messages(
        account_id.as_deref(),
        category.as_deref(),
        is_read,
        folder.as_deref(),
        limit.unwrap_or(50),
        offset.unwrap_or(0),
    )
}

#[tauri::command]
pub async fn get_message_detail(
    state: State<'_, SharedAppState>,
    id: String,
) -> AppResult<MessageDetail> {
    let conn = state.db.get_connection()?;
    let db = DbService::new(&conn);
    db.get_message_detail(&id)
}

#[tauri::command]
pub async fn set_message_read(
    state: State<'_, SharedAppState>,
    id: String,
    is_read: bool,
) -> AppResult<()> {
    let conn = state.db.get_connection()?;
    let db = DbService::new(&conn);
    db.set_message_read(&id, is_read)
}

#[tauri::command]
pub async fn set_message_starred(
    state: State<'_, SharedAppState>,
    id: String,
    is_starred: bool,
) -> AppResult<()> {
    let conn = state.db.get_connection()?;
    let db = DbService::new(&conn);
    db.set_message_starred(&id, is_starred)
}

#[tauri::command]
pub async fn set_message_archived(
    state: State<'_, SharedAppState>,
    id: String,
    is_archived: bool,
) -> AppResult<()> {
    let conn = state.db.get_connection()?;
    let db = DbService::new(&conn);
    db.set_message_archived(&id, is_archived)
}

#[tauri::command]
pub async fn set_message_trash(
    state: State<'_, SharedAppState>,
    id: String,
    is_trash: bool,
) -> AppResult<()> {
    let conn = state.db.get_connection()?;
    let db = DbService::new(&conn);
    db.set_message_trash(&id, is_trash)
}

#[tauri::command]
pub async fn search_messages(
    state: State<'_, SharedAppState>,
    query: String,
    limit: Option<u32>,
) -> AppResult<Vec<Message>> {
    let conn = state.db.get_connection()?;
    let db = DbService::new(&conn);
    db.search_messages_fts5(&query, limit.unwrap_or(30))
}

#[tauri::command]
pub async fn start_gmail_oauth(
    state: State<'_, SharedAppState>,
    client_id: Option<String>,
    client_secret: Option<String>,
) -> AppResult<Account> {
    let cid = client_id
        .or_else(|| std::env::var("GOOGLE_CLIENT_ID").ok())
        .or_else(|| state.keychain.get_secret("zmail_oauth", "client_id").ok().flatten())
        .ok_or_else(|| AppError::Auth("Google Client ID not provided".to_string()))?;

    let cs = client_secret
        .or_else(|| std::env::var("GOOGLE_CLIENT_SECRET").ok())
        .or_else(|| state.keychain.get_secret("zmail_oauth", "client_secret").ok().flatten())
        .ok_or_else(|| AppError::Auth("Google Client Secret not provided".to_string()))?;

    let oauth = crate::auth::GmailOAuthService::new(cid.clone(), cs.clone());
    let (listener, port) = crate::auth::GmailOAuthService::bind_listener().await?;
    let auth_url = oauth.get_auth_url(port);

    // Open user default browser on macOS
    #[cfg(target_os = "macos")]
    {
        let _ = std::process::Command::new("open")
            .arg(&auth_url)
            .spawn();
    }

    // Wait for loopback callback
    let code = crate::auth::GmailOAuthService::wait_for_authorization_code(listener).await?;

    // Exchange code for tokens
    let tokens = oauth.exchange_code(&code, port).await?;
    let refresh_token = tokens.refresh_token
        .ok_or_else(|| AppError::Auth("Google did not return a refresh token. Make sure prompt=consent is used.".to_string()))?;

    // Fetch user profile email
    let email = oauth.fetch_user_email(&tokens.access_token).await?;

    // Store in keychain
    state.keychain.set_secret("zmail", &email, &refresh_token)?;
    state.keychain.set_secret("zmail_oauth", "client_id", &cid)?;
    state.keychain.set_secret("zmail_oauth", "client_secret", &cs)?;

    // Store account in SQLite
    let account = Account {
        id: uuid::Uuid::new_v4().to_string(),
        email: email.clone(),
        display_name: email.split('@').next().unwrap_or("User").to_string(),
        provider: crate::models::ProviderType::Gmail,
        accent_color: "#EA4335".to_string(),
        sync_state: "idle".to_string(),
        last_synced_at: None,
    };

    {
        let conn = state.db.get_connection()?;
        let db = DbService::new(&conn);
        db.insert_account(&account)?;
    }

    // Immediately fetch initial batch of recent emails using current access token
    if let Ok((fetched, history_id)) = state.gmail_sync.fetch_recent_messages(&tokens.access_token, 50).await {
        if let Ok(conn) = state.db.get_connection() {
            let db = DbService::new(&conn);
            for msg in fetched {
                let _ = db.insert_or_replace_message(
                    &account.id,
                    &msg.provider_id,
                    &msg.thread_id,
                    msg.message_id_header.as_deref(),
                    msg.in_reply_to.as_deref(),
                    &msg.subject,
                    msg.from_name.as_deref(),
                    &msg.from_address,
                    &msg.to_addresses,
                    None,
                    None,
                    &msg.snippet,
                    msg.body_text.as_deref(),
                    msg.body_html.as_deref(),
                    &msg.received_at,
                    msg.size_bytes,
                    msg.has_attachments,
                    false,
                    false,
                    msg.unsub_one_click,
                    msg.unsub_url.as_deref(),
                    msg.unsub_mailto.as_deref(),
                    None,
                );
            }
            if let Some(hid) = history_id {
                let _ = db.update_gmail_history_id(&account.id, &hid);
            }
            let now = chrono::Utc::now().to_rfc3339();
            let _ = db.update_sync_state(&account.id, "idle", Some(&now));
        }
    }

    Ok(account)
}

#[tauri::command]
pub async fn sync_account(
    state: State<'_, SharedAppState>,
    account_id: String,
) -> AppResult<usize> {
    let (account, refresh_token, client_id, client_secret) = {
        let conn = state.db.get_connection()?;
        let db = DbService::new(&conn);
        let account = db.get_account(&account_id)?;
        db.update_sync_state(&account_id, "syncing", None)?;
        let rt = state.keychain.get_secret("zmail", &account.email)?;
        let cid = state.keychain.get_secret("zmail_oauth", "client_id")?
            .or_else(|| std::env::var("GOOGLE_CLIENT_ID").ok())
            .unwrap_or_default();
        let cs = state.keychain.get_secret("zmail_oauth", "client_secret")?
            .or_else(|| std::env::var("GOOGLE_CLIENT_SECRET").ok())
            .unwrap_or_default();
        (account, rt, cid, cs)
    };

    match account.provider {
        crate::models::ProviderType::Gmail => {
            let refresh_token = refresh_token
                .ok_or_else(|| AppError::Auth("No refresh token stored for account".to_string()))?;

            let oauth = crate::auth::GmailOAuthService::new(client_id, client_secret);
            let tokens = oauth.refresh_access_token(&refresh_token).await?;

            let (fetched, history_id) = state.gmail_sync.fetch_recent_messages(&tokens.access_token, 50).await?;
            let count = fetched.len();

            // Save messages inside synchronous DB block
            {
                let conn = state.db.get_connection()?;
                let db = DbService::new(&conn);

                for msg in fetched {
                    db.insert_or_replace_message(
                        &account_id,
                        &msg.provider_id,
                        &msg.thread_id,
                        msg.message_id_header.as_deref(),
                        msg.in_reply_to.as_deref(),
                        &msg.subject,
                        msg.from_name.as_deref(),
                        &msg.from_address,
                        &msg.to_addresses,
                        None,
                        None,
                        &msg.snippet,
                        msg.body_text.as_deref(),
                        msg.body_html.as_deref(),
                        &msg.received_at,
                        msg.size_bytes,
                        msg.has_attachments,
                        false,
                        false,
                        msg.unsub_one_click,
                        msg.unsub_url.as_deref(),
                        msg.unsub_mailto.as_deref(),
                        None,
                    )?;
                }

                if let Some(hid) = history_id {
                    db.update_gmail_history_id(&account_id, &hid)?;
                }

                let now = chrono::Utc::now().to_rfc3339();
                db.update_sync_state(&account_id, "idle", Some(&now))?;
            }

            Ok(count)
        }
        crate::models::ProviderType::Imap => {
            let conn = state.db.get_connection()?;
            let db = DbService::new(&conn);
            db.update_sync_state(&account_id, "idle", Some(&chrono::Utc::now().to_rfc3339()))?;
            Ok(0)
        }
    }
}

#[tauri::command]
pub async fn triage_message(
    state: State<'_, SharedAppState>,
    message_id: String,
) -> AppResult<AiTriageResult> {
    let (subject, from_address, body) = {
        let conn = state.db.get_connection()?;
        let db = DbService::new(&conn);
        let detail = db.get_message_detail(&message_id)?;
        (detail.message.subject, detail.message.from.address, detail.body_text.unwrap_or_default())
    };

    let result = state.ollama.triage_email(&subject, &from_address, &body).await?;

    {
        let conn = state.db.get_connection()?;
        let db = DbService::new(&conn);
        db.update_ai_metadata(
            &message_id,
            Some(&result.category),
            Some(&result.priority),
            Some(&result.summary),
            Some(&result.action_items),
        )?;
    }

    Ok(result)
}

#[tauri::command]
pub async fn generate_smart_replies(
    state: State<'_, SharedAppState>,
    message_id: String,
) -> AppResult<Vec<String>> {
    let (subject, body) = {
        let conn = state.db.get_connection()?;
        let db = DbService::new(&conn);
        let detail = db.get_message_detail(&message_id)?;
        (detail.message.subject, detail.body_text.unwrap_or_default())
    };

    state.ollama.generate_smart_replies(&subject, &body).await
}

#[tauri::command]
pub async fn execute_one_click_unsubscribe(
    state: State<'_, SharedAppState>,
    url: String,
) -> AppResult<bool> {
    state.unsubscribe.execute_one_click(&url).await
}

#[tauri::command]
pub async fn send_email(
    _state: State<'_, SharedAppState>,
    _req: SendEmailRequest,
) -> AppResult<()> {
    Ok(())
}

#[tauri::command]
pub async fn check_ollama_status(
    state: State<'_, SharedAppState>,
) -> AppResult<bool> {
    Ok(state.ollama.check_health().await)
}

#[tauri::command]
pub async fn open_external_url(url: String) -> AppResult<()> {
    let trimmed = url.trim();
    if !trimmed.starts_with("http://") && !trimmed.starts_with("https://") && !trimmed.starts_with("mailto:") {
        return Err(AppError::Validation("Invalid URL protocol".to_string()));
    }

    #[cfg(target_os = "macos")]
    {
        let _ = std::process::Command::new("open")
            .arg(trimmed)
            .spawn();
    }
    #[cfg(target_os = "windows")]
    {
        let _ = std::process::Command::new("cmd")
            .args(["/C", "start", "", trimmed])
            .spawn();
    }
    #[cfg(target_os = "linux")]
    {
        let _ = std::process::Command::new("xdg-open")
            .arg(trimmed)
            .spawn();
    }

    Ok(())
}

#[derive(Debug, serde::Deserialize)]
pub struct ChatMessagePayload {
    pub role: String,
    pub content: String,
}

#[tauri::command]
pub async fn copilot_chat(
    state: State<'_, SharedAppState>,
    prompt: String,
    context_message_id: Option<String>,
    history: Vec<ChatMessagePayload>,
) -> AppResult<String> {
    let mut system_context = String::from(
        "You are Zmail Copilot, a high-craft, intelligent email assistant running locally and privately on the user's Mac. \
        Help the user understand emails, draft replies, extract action items, summarize discussions, and answer questions. \
        Format responses with clear, concise markdown. Keep tone helpful, crisp, and direct. Do not include robotic disclaimer preamble."
    );

    if let Some(msg_id) = context_message_id {
        if let Ok(conn) = state.db.get_connection() {
            let db = DbService::new(&conn);
            if let Ok(detail) = db.get_message_detail(&msg_id) {
                let sender = detail.message.from.name.unwrap_or(detail.message.from.address);
                let body = detail.body_text.unwrap_or_else(|| detail.message.snippet.clone());
                system_context.push_str(&format!(
                    "\n\n--- CURRENT EMAIL CONTEXT ---\nSubject: {}\nFrom: {}\nDate: {}\nContent:\n{}\n-----------------------------",
                    detail.message.subject,
                    sender,
                    detail.message.received_at,
                    crate::ai::ollama::truncate_chars(&body, 3000)
                ));
            }
        }
    }

    let chat_history: Vec<(String, String)> = history
        .into_iter()
        .map(|m| (m.role, m.content))
        .collect();

    state.ollama.copilot_chat(&system_context, &prompt, chat_history).await
}

