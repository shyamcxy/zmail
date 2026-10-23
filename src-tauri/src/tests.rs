#[cfg(test)]
mod tests {
    use rusqlite::Connection;
    use crate::db::schema;
    use crate::db::queries::DbService;
    use crate::models::{Account, EmailAddress, ProviderType};
    use crate::unsubscribe::UnsubscribeService;

    fn setup_test_db() -> Connection {
        let conn = Connection::open_in_memory().expect("Failed to open in-memory SQLite");
        schema::initialize_database(&conn).expect("Failed to initialize schema");
        conn
    }

    #[test]
    fn test_schema_and_pragmas() {
        let conn = setup_test_db();
        let fk_enabled: i32 = conn.query_row("PRAGMA foreign_keys", [], |r| r.get(0)).unwrap();
        assert_eq!(fk_enabled, 1, "Foreign keys must be enabled");
    }

    #[test]
    fn test_account_crud() {
        let conn = setup_test_db();
        let db = DbService::new(&conn);

        let test_account = Account {
            id: "acc-1".to_string(),
            email: "shyam@work.com".to_string(),
            display_name: "Shyam Work".to_string(),
            provider: ProviderType::Imap,
            accent_color: "#10b981".to_string(),
            sync_state: "idle".to_string(),
            last_synced_at: None,
        };

        db.insert_account(&test_account).expect("Insert account failed");
        let accounts = db.list_accounts().expect("List accounts failed");
        assert_eq!(accounts.len(), 1);
        assert_eq!(accounts[0].email, "shyam@work.com");
        assert_eq!(accounts[0].provider, ProviderType::Imap);

        let fetched = db.get_account("acc-1").expect("Get account failed");
        assert_eq!(fetched.display_name, "Shyam Work");

        db.delete_account("acc-1").expect("Delete account failed");
        let remaining = db.list_accounts().expect("List accounts failed");
        assert_eq!(remaining.len(), 0);
    }

    #[test]
    fn test_message_insert_and_fts5_search() {
        let conn = setup_test_db();
        let db = DbService::new(&conn);

        // Insert parent account first (FK constraint)
        let test_account = Account {
            id: "acc-gmail".to_string(),
            email: "shyam@gmail.com".to_string(),
            display_name: "Personal".to_string(),
            provider: ProviderType::Gmail,
            accent_color: "#6366f1".to_string(),
            sync_state: "idle".to_string(),
            last_synced_at: None,
        };
        db.insert_account(&test_account).unwrap();

        let to_addr = vec![EmailAddress {
            name: Some("Shyam".to_string()),
            address: "shyam@gmail.com".to_string(),
        }];

        // Insert message 1: Budget invoice
        db.insert_or_replace_message(
            "acc-gmail",
            "gmail-msg-101",
            "thread-1",
            Some("<msg101@company.com>"),
            None,
            "Urgent: Q3 Budget Report & Invoice",
            Some("Finance Team"),
            "billing@company.com",
            &to_addr,
            None,
            None,
            "Please review the attached invoice for Q3 expenses.",
            Some("Please review the attached invoice for Q3 expenses and approve by Friday."),
            None,
            "2026-10-15T10:00:00Z",
            4096,
            true,
            false,
            false,
            false,
            None,
            None,
            None,
        ).unwrap();

        // Insert message 2: Newsletter
        db.insert_or_replace_message(
            "acc-gmail",
            "gmail-msg-102",
            "thread-2",
            Some("<news@tech.com>"),
            None,
            "Tech Daily News",
            Some("TechCrunch"),
            "newsletter@tech.com",
            &to_addr,
            None,
            None,
            "Top stories of the day in artificial intelligence.",
            Some("Top stories of the day in artificial intelligence and robotics."),
            None,
            "2026-10-15T11:00:00Z",
            8192,
            false,
            false,
            false,
            true,
            Some("https://tech.com/unsub?id=123"),
            None,
            None,
        ).unwrap();

        // 1. Verify message listing
        let messages = db.list_messages(None, None, None, None, 10, 0).unwrap();
        assert_eq!(messages.len(), 2);

        // 2. Full-Text Search (FTS5) for "invoice"
        let search_results = db.search_messages_fts5("invoice", 10).unwrap();
        assert_eq!(search_results.len(), 1, "Should find 1 message matching 'invoice'");
        assert_eq!(search_results[0].subject, "Urgent: Q3 Budget Report & Invoice");

        // 3. Full-Text Search (FTS5) for "robotics" (present only in body_text)
        let search_robotics = db.search_messages_fts5("robotics", 10).unwrap();
        assert_eq!(search_robotics.len(), 1, "Should find 1 message matching 'robotics'");
        assert_eq!(search_robotics[0].subject, "Tech Daily News");

        // 4. Test flags
        db.set_message_read(&messages[0].id, true).unwrap();
        let unread = db.list_messages(None, None, Some(false), None, 10, 0).unwrap();
        assert_eq!(unread.len(), 1, "Only 1 message should remain unread");
    }

    #[test]
    fn test_unsubscribe_header_parsing() {
        // Test RFC 8058 One-Click header format
        let list_unsub = Some("<https://news.example.com/unsub/123>, <mailto:unsub@example.com?subject=unsub>");
        let list_unsub_post = Some("List-Unsubscribe=One-Click");

        let info = UnsubscribeService::parse_headers(list_unsub, list_unsub_post);
        assert!(info.has_one_click, "Must detect RFC 8058 One-Click");
        assert_eq!(info.https_url.as_deref(), Some("https://news.example.com/unsub/123"));
        assert_eq!(info.mailto_url.as_deref(), Some("mailto:unsub@example.com?subject=unsub"));

        // Test mailto-only fallback
        let mailto_only = Some("<mailto:unsubscribe@domain.com>");
        let info_mailto = UnsubscribeService::parse_headers(mailto_only, None);
        assert!(!info_mailto.has_one_click);
        assert_eq!(info_mailto.https_url, None);
        assert_eq!(info_mailto.mailto_url.as_deref(), Some("mailto:unsubscribe@domain.com"));
    }

    #[test]
    fn test_oauth_query_param_parsing() {
        let req = "GET /?code=4%2F0AQx_test_code_12345&scope=email%20profile HTTP/1.1\r\nHost: 127.0.0.1:8080\r\n\r\n";
        let code = crate::auth::gmail_oauth::extract_query_param(req, "code");
        assert_eq!(code.as_deref(), Some("4/0AQx_test_code_12345"));

        let err_req = "GET /?error=access_denied HTTP/1.1\r\nHost: 127.0.0.1:8080\r\n\r\n";
        let err = crate::auth::gmail_oauth::extract_query_param(err_req, "error");
        assert_eq!(err.as_deref(), Some("access_denied"));
    }
}
