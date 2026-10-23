use rusqlite::{params, Connection};
use crate::error::AppResult;
use crate::models::{Account, ActionItem, EmailAddress, Message, MessageDetail, ProviderType};

pub struct DbService<'a> {
    pub conn: &'a Connection,
}

impl<'a> DbService<'a> {
    pub fn new(conn: &'a Connection) -> Self {
        Self { conn }
    }

    // ==========================================
    // Accounts
    // ==========================================

    pub fn insert_account(&self, account: &Account) -> AppResult<()> {
        self.conn.execute(
            "INSERT INTO accounts (id, email, display_name, provider, accent_color, sync_state)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                account.id,
                account.email,
                account.display_name,
                account.provider.to_string(),
                account.accent_color,
                account.sync_state,
            ],
        )?;
        Ok(())
    }

    pub fn list_accounts(&self) -> AppResult<Vec<Account>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, email, display_name, provider, accent_color, sync_state, last_synced_at
             FROM accounts ORDER BY email ASC",
        )?;

        let accounts = stmt
            .query_map([], |row| {
                let provider_str: String = row.get(3)?;
                let provider = provider_str.parse::<ProviderType>().unwrap_or(ProviderType::Imap);
                Ok(Account {
                    id: row.get(0)?,
                    email: row.get(1)?,
                    display_name: row.get(2)?,
                    provider,
                    accent_color: row.get(4)?,
                    sync_state: row.get(5)?,
                    last_synced_at: row.get(6)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;

        Ok(accounts)
    }

    pub fn get_account(&self, id: &str) -> AppResult<Account> {
        let mut stmt = self.conn.prepare(
            "SELECT id, email, display_name, provider, accent_color, sync_state, last_synced_at
             FROM accounts WHERE id = ?1",
        )?;

        let account = stmt.query_row(params![id], |row| {
            let provider_str: String = row.get(3)?;
            let provider = provider_str.parse::<ProviderType>().unwrap_or(ProviderType::Imap);
            Ok(Account {
                id: row.get(0)?,
                email: row.get(1)?,
                display_name: row.get(2)?,
                provider,
                accent_color: row.get(4)?,
                sync_state: row.get(5)?,
                last_synced_at: row.get(6)?,
            })
        })?;

        Ok(account)
    }

    pub fn update_sync_state(&self, account_id: &str, state: &str, last_synced_at: Option<&str>) -> AppResult<()> {
        if let Some(ts) = last_synced_at {
            self.conn.execute(
                "UPDATE accounts SET sync_state = ?1, last_synced_at = ?2 WHERE id = ?3",
                params![state, ts, account_id],
            )?;
        } else {
            self.conn.execute(
                "UPDATE accounts SET sync_state = ?1 WHERE id = ?2",
                params![state, account_id],
            )?;
        }
        Ok(())
    }

    pub fn update_gmail_history_id(&self, account_id: &str, history_id: &str) -> AppResult<()> {
        self.conn.execute(
            "UPDATE accounts SET gmail_history_id = ?1 WHERE id = ?2",
            params![history_id, account_id],
        )?;
        Ok(())
    }

    pub fn get_gmail_history_id(&self, account_id: &str) -> AppResult<Option<String>> {
        let mut stmt = self.conn.prepare("SELECT gmail_history_id FROM accounts WHERE id = ?1")?;
        let res = stmt.query_row(params![account_id], |row| row.get(0)).unwrap_or(None);
        Ok(res)
    }

    pub fn delete_account(&self, account_id: &str) -> AppResult<()> {
        self.conn.execute("DELETE FROM accounts WHERE id = ?1", params![account_id])?;
        Ok(())
    }

    // ==========================================
    // Messages
    // ==========================================

    #[allow(clippy::too_many_arguments)]
    pub fn insert_or_replace_message(
        &self,
        account_id: &str,
        provider_id: &str,
        thread_id: &str,
        message_id_header: Option<&str>,
        in_reply_to: Option<&str>,
        subject: &str,
        from_name: Option<&str>,
        from_address: &str,
        to_addresses: &[EmailAddress],
        cc_addresses: Option<&[EmailAddress]>,
        bcc_addresses: Option<&[EmailAddress]>,
        snippet: &str,
        body_text: Option<&str>,
        body_html: Option<&str>,
        received_at: &str,
        size_bytes: i64,
        has_attachments: bool,
        is_read: bool,
        is_starred: bool,
        unsub_one_click: bool,
        unsub_url: Option<&str>,
        unsub_mailto: Option<&str>,
        raw_headers: Option<&str>,
    ) -> AppResult<String> {
        let msg_id = uuid::Uuid::new_v4().to_string();
        let to_json = serde_json::to_string(to_addresses)?;
        let cc_json = cc_addresses.map(serde_json::to_string).transpose()?;
        let bcc_json = bcc_addresses.map(serde_json::to_string).transpose()?;

        let from_lower = from_address.to_lowercase();
        let auto_category = if from_lower.contains("linkedin.com")
            || from_lower.contains("twitter.com")
            || from_lower.contains("x.com")
            || from_lower.contains("instagram.com")
            || from_lower.contains("facebook.com")
            || from_lower.contains("youtube.com")
            || from_lower.contains("discord.com")
            || from_lower.contains("reddit.com")
        {
            "social"
        } else if from_lower.contains("github.com")
            || from_lower.contains("slack")
            || from_lower.contains("vercel.com")
            || from_lower.contains("linear.app")
            || from_lower.contains("figma.com")
            || from_lower.contains("notion.so")
            || from_lower.contains("atlassian.com")
            || from_lower.contains("insforge.dev")
            || from_lower.contains("registerkaro.in")
            || from_lower.contains("mlh.io")
        {
            "company"
        } else if unsub_one_click
            || unsub_url.is_some()
            || from_lower.contains("newsletter")
            || from_lower.contains("whop.com")
            || from_lower.contains("mobbin.com")
            || from_lower.contains("heygen.com")
            || from_lower.contains("medium.com")
            || from_lower.contains("emails.")
        {
            "promotion"
        } else {
            "primary"
        };

        self.conn.execute(
            "INSERT INTO messages (
                id, account_id, provider_id, thread_id, message_id_header, in_reply_to,
                subject, from_name, from_address, to_addresses, cc_addresses, bcc_addresses,
                snippet, body_text, body_html, received_at, size_bytes, has_attachments,
                is_read, is_starred, unsub_one_click, unsub_url, unsub_mailto, raw_headers, ai_category
            ) VALUES (
                ?1, ?2, ?3, ?4, ?5, ?6,
                ?7, ?8, ?9, ?10, ?11, ?12,
                ?13, ?14, ?15, ?16, ?17, ?18,
                ?19, ?20, ?21, ?22, ?23, ?24, ?25
            ) ON CONFLICT(account_id, provider_id) DO UPDATE SET
                subject = excluded.subject,
                snippet = excluded.snippet,
                body_text = excluded.body_text,
                body_html = excluded.body_html,
                is_read = excluded.is_read,
                is_starred = excluded.is_starred",
            params![
                msg_id,
                account_id,
                provider_id,
                thread_id,
                message_id_header,
                in_reply_to,
                subject,
                from_name,
                from_address,
                to_json,
                cc_json,
                bcc_json,
                snippet,
                body_text,
                body_html,
                received_at,
                size_bytes,
                if has_attachments { 1 } else { 0 },
                if is_read { 1 } else { 0 },
                if is_starred { 1 } else { 0 },
                if unsub_one_click { 1 } else { 0 },
                unsub_url,
                unsub_mailto,
                raw_headers,
                auto_category,
            ],
        )?;

        Ok(msg_id)
    }

    pub fn list_messages(
        &self,
        account_id: Option<&str>,
        category: Option<&str>,
        is_read: Option<bool>,
        folder: Option<&str>,
        limit: u32,
        offset: u32,
    ) -> AppResult<Vec<Message>> {
        let base_condition = match folder {
            Some("trash") => "is_trash = 1",
            Some("archive") => "is_archived = 1 AND is_trash = 0",
            Some("starred") => "is_starred = 1 AND is_trash = 0",
            _ => "is_trash = 0 AND is_archived = 0",
        };

        let mut query = format!(
            "SELECT id, account_id, provider_id, thread_id, subject, from_name, from_address,
                    to_addresses, cc_addresses, bcc_addresses, snippet, received_at,
                    is_read, is_starred, is_archived, has_attachments,
                    ai_category, ai_priority, ai_summary, ai_action_items,
                    unsub_one_click, unsub_url
             FROM messages
             WHERE {}",
            base_condition
        );

        let mut param_values: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

        if let Some(acc_id) = account_id {
            query.push_str(" AND account_id = ?");
            param_values.push(Box::new(acc_id.to_string()));
        }

        if let Some(cat) = category {
            query.push_str(" AND ai_category = ?");
            param_values.push(Box::new(cat.to_string()));
        }

        if let Some(read) = is_read {
            query.push_str(" AND is_read = ?");
            param_values.push(Box::new(if read { 1 } else { 0 }));
        }

        query.push_str(" ORDER BY received_at DESC LIMIT ? OFFSET ?");
        param_values.push(Box::new(limit));
        param_values.push(Box::new(offset));

        let params_slice: Vec<&dyn rusqlite::ToSql> = param_values.iter().map(|b| b.as_ref()).collect();

        let mut stmt = self.conn.prepare(&query)?;
        let rows = stmt.query_map(params_slice.as_slice(), |row| {
            let from = EmailAddress {
                name: row.get(5)?,
                address: row.get(6)?,
            };

            let to_json: String = row.get(7)?;
            let to: Vec<EmailAddress> = serde_json::from_str(&to_json).unwrap_or_default();

            let cc_json: Option<String> = row.get(8)?;
            let cc = cc_json.and_then(|s| serde_json::from_str(&s).ok());

            let bcc_json: Option<String> = row.get(9)?;
            let bcc = bcc_json.and_then(|s| serde_json::from_str(&s).ok());

            let action_items_json: Option<String> = row.get(19)?;
            let action_items: Option<Vec<ActionItem>> = action_items_json.and_then(|s| serde_json::from_str(&s).ok());

            Ok(Message {
                id: row.get(0)?,
                account_id: row.get(1)?,
                provider_id: row.get(2)?,
                thread_id: row.get(3)?,
                subject: row.get(4)?,
                from,
                to,
                cc,
                bcc,
                snippet: row.get(10)?,
                received_at: row.get(11)?,
                is_read: row.get::<_, i32>(12)? == 1,
                is_starred: row.get::<_, i32>(13)? == 1,
                is_archived: row.get::<_, i32>(14)? == 1,
                has_attachments: row.get::<_, i32>(15)? == 1,
                attachments: None,
                ai_category: row.get(16)?,
                ai_priority: row.get(17)?,
                ai_summary: row.get(18)?,
                ai_action_items: action_items,
                unsub_one_click: row.get::<_, i32>(20)? == 1,
                unsub_url: row.get(21)?,
            })
        })?;

        let messages = rows.collect::<Result<Vec<_>, _>>()?;
        Ok(messages)
    }

    pub fn get_message_detail(&self, id: &str) -> AppResult<MessageDetail> {
        let mut stmt = self.conn.prepare(
            "SELECT id, account_id, provider_id, thread_id, subject, from_name, from_address,
                    to_addresses, cc_addresses, bcc_addresses, snippet, body_text, body_html, received_at,
                    is_read, is_starred, is_archived, has_attachments,
                    ai_category, ai_priority, ai_summary, ai_action_items,
                    unsub_one_click, unsub_url
             FROM messages
             WHERE id = ?1",
        )?;

        let detail = stmt.query_row(params![id], |row| {
            let from = EmailAddress {
                name: row.get(5)?,
                address: row.get(6)?,
            };

            let to_json: String = row.get(7)?;
            let to: Vec<EmailAddress> = serde_json::from_str(&to_json).unwrap_or_default();

            let cc_json: Option<String> = row.get(8)?;
            let cc = cc_json.and_then(|s| serde_json::from_str(&s).ok());

            let bcc_json: Option<String> = row.get(9)?;
            let bcc = bcc_json.and_then(|s| serde_json::from_str(&s).ok());

            let action_items_json: Option<String> = row.get(21)?;
            let action_items: Option<Vec<ActionItem>> = action_items_json.and_then(|s| serde_json::from_str(&s).ok());

            let message = Message {
                id: row.get(0)?,
                account_id: row.get(1)?,
                provider_id: row.get(2)?,
                thread_id: row.get(3)?,
                subject: row.get(4)?,
                from,
                to,
                cc,
                bcc,
                snippet: row.get(10)?,
                received_at: row.get(13)?,
                is_read: row.get::<_, i32>(14)? == 1,
                is_starred: row.get::<_, i32>(15)? == 1,
                is_archived: row.get::<_, i32>(16)? == 1,
                has_attachments: row.get::<_, i32>(17)? == 1,
                attachments: None,
                ai_category: row.get(18)?,
                ai_priority: row.get(19)?,
                ai_summary: row.get(20)?,
                ai_action_items: action_items,
                unsub_one_click: row.get::<_, i32>(22)? == 1,
                unsub_url: row.get(23)?,
            };

            Ok(MessageDetail {
                message,
                body_text: row.get(11)?,
                body_html: row.get(12)?,
                smart_replies: None,
            })
        })?;

        Ok(detail)
    }

    pub fn set_message_read(&self, id: &str, is_read: bool) -> AppResult<()> {
        self.conn.execute(
            "UPDATE messages SET is_read = ?1 WHERE id = ?2",
            params![if is_read { 1 } else { 0 }, id],
        )?;
        Ok(())
    }

    pub fn set_message_archived(&self, id: &str, is_archived: bool) -> AppResult<()> {
        self.conn.execute(
            "UPDATE messages SET is_archived = ?1 WHERE id = ?2",
            params![if is_archived { 1 } else { 0 }, id],
        )?;
        Ok(())
    }

    pub fn set_message_starred(&self, id: &str, is_starred: bool) -> AppResult<()> {
        self.conn.execute(
            "UPDATE messages SET is_starred = ?1 WHERE id = ?2",
            params![if is_starred { 1 } else { 0 }, id],
        )?;
        Ok(())
    }

    pub fn set_message_trash(&self, id: &str, is_trash: bool) -> AppResult<()> {
        self.conn.execute(
            "UPDATE messages SET is_trash = ?1 WHERE id = ?2",
            params![if is_trash { 1 } else { 0 }, id],
        )?;
        Ok(())
    }

    pub fn update_ai_metadata(
        &self,
        id: &str,
        category: Option<&str>,
        priority: Option<&str>,
        summary: Option<&str>,
        action_items: Option<&[ActionItem]>,
    ) -> AppResult<()> {
        let action_items_json = action_items.map(serde_json::to_string).transpose()?;
        self.conn.execute(
            "UPDATE messages SET
                ai_category = COALESCE(?1, ai_category),
                ai_priority = COALESCE(?2, ai_priority),
                ai_summary = COALESCE(?3, ai_summary),
                ai_action_items = COALESCE(?4, ai_action_items)
             WHERE id = ?5",
            params![category, priority, summary, action_items_json, id],
        )?;
        Ok(())
    }

    // ==========================================
    // Full-Text Search (FTS5)
    // ==========================================

    pub fn search_messages_fts5(&self, query_text: &str, limit: u32) -> AppResult<Vec<Message>> {
        let sanitized = query_text.replace('"', "\"\"");
        let fts_query = format!("\"{}\"*", sanitized);

        let mut stmt = self.conn.prepare(
            "SELECT m.id, m.account_id, m.provider_id, m.thread_id, m.subject, m.from_name, m.from_address,
                    m.to_addresses, m.cc_addresses, m.bcc_addresses, m.snippet, m.received_at,
                    m.is_read, m.is_starred, m.is_archived, m.has_attachments,
                    m.ai_category, m.ai_priority, m.ai_summary, m.ai_action_items,
                    m.unsub_one_click, m.unsub_url
             FROM messages m
             JOIN messages_fts fts ON m.rowid = fts.rowid
             WHERE messages_fts MATCH ?1 AND m.is_trash = 0
             ORDER BY bm25(messages_fts) ASC
             LIMIT ?2",
        )?;

        let rows = stmt.query_map(params![fts_query, limit], |row| {
            let from = EmailAddress {
                name: row.get(5)?,
                address: row.get(6)?,
            };

            let to_json: String = row.get(7)?;
            let to: Vec<EmailAddress> = serde_json::from_str(&to_json).unwrap_or_default();

            let cc_json: Option<String> = row.get(8)?;
            let cc = cc_json.and_then(|s| serde_json::from_str(&s).ok());

            let bcc_json: Option<String> = row.get(9)?;
            let bcc = bcc_json.and_then(|s| serde_json::from_str(&s).ok());

            let action_items_json: Option<String> = row.get(19)?;
            let action_items: Option<Vec<ActionItem>> = action_items_json.and_then(|s| serde_json::from_str(&s).ok());

            Ok(Message {
                id: row.get(0)?,
                account_id: row.get(1)?,
                provider_id: row.get(2)?,
                thread_id: row.get(3)?,
                subject: row.get(4)?,
                from,
                to,
                cc,
                bcc,
                snippet: row.get(10)?,
                received_at: row.get(11)?,
                is_read: row.get::<_, i32>(12)? == 1,
                is_starred: row.get::<_, i32>(13)? == 1,
                is_archived: row.get::<_, i32>(14)? == 1,
                has_attachments: row.get::<_, i32>(15)? == 1,
                attachments: None,
                ai_category: row.get(16)?,
                ai_priority: row.get(17)?,
                ai_summary: row.get(18)?,
                ai_action_items: action_items,
                unsub_one_click: row.get::<_, i32>(20)? == 1,
                unsub_url: row.get(21)?,
            })
        })?;

        let messages = rows.collect::<Result<Vec<_>, _>>()?;
        Ok(messages)
    }
}
