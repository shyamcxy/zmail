use rusqlite::Connection;
use crate::error::AppResult;

pub const SCHEMA_VERSION: i32 = 1;

pub fn initialize_database(conn: &Connection) -> AppResult<()> {
    // 1. Pragmas for high performance WAL mode and safety
    conn.execute_batch(
        "PRAGMA journal_mode = WAL;
         PRAGMA synchronous = NORMAL;
         PRAGMA foreign_keys = ON;
         PRAGMA busy_timeout = 5000;
         PRAGMA temp_store = MEMORY;"
    )?;

    // 2. Migration version tracking
    conn.execute(
        "CREATE TABLE IF NOT EXISTS _schema_migrations (
            version INTEGER PRIMARY KEY,
            applied_at TEXT NOT NULL
        )",
        [],
    )?;

    let mut stmt = conn.prepare("SELECT MAX(version) FROM _schema_migrations")?;
    let current_version: Option<i32> = stmt.query_row([], |row| row.get(0)).unwrap_or(None);

    if current_version.unwrap_or(0) < SCHEMA_VERSION {
        run_migrations(conn)?;
    }

    Ok(())
}

fn run_migrations(conn: &Connection) -> AppResult<()> {
    conn.execute_batch(
        "BEGIN TRANSACTION;

        -- Accounts Table
        CREATE TABLE IF NOT EXISTS accounts (
            id TEXT PRIMARY KEY,
            email TEXT NOT NULL UNIQUE,
            display_name TEXT NOT NULL,
            provider TEXT NOT NULL, -- 'gmail' | 'imap'
            accent_color TEXT NOT NULL DEFAULT '#6366f1',
            sync_state TEXT NOT NULL DEFAULT 'idle',
            last_synced_at TEXT,
            gmail_history_id TEXT,
            imap_host TEXT,
            imap_port INTEGER,
            smtp_host TEXT,
            smtp_port INTEGER,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        -- Messages Table
        CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
            provider_id TEXT NOT NULL,
            thread_id TEXT NOT NULL,
            message_id_header TEXT,
            in_reply_to TEXT,
            subject TEXT NOT NULL DEFAULT '',
            from_name TEXT,
            from_address TEXT NOT NULL,
            to_addresses TEXT NOT NULL, -- JSON array
            cc_addresses TEXT,         -- JSON array
            bcc_addresses TEXT,        -- JSON array
            snippet TEXT NOT NULL DEFAULT '',
            body_text TEXT,
            body_html TEXT,
            received_at TEXT NOT NULL,
            size_bytes INTEGER DEFAULT 0,
            has_attachments INTEGER NOT NULL DEFAULT 0,
            is_read INTEGER NOT NULL DEFAULT 0,
            is_starred INTEGER NOT NULL DEFAULT 0,
            is_archived INTEGER NOT NULL DEFAULT 0,
            is_trash INTEGER NOT NULL DEFAULT 0,
            
            -- AI Attributes
            ai_category TEXT,
            ai_priority TEXT,
            ai_summary TEXT,
            ai_action_items TEXT, -- JSON array
            spam_score REAL DEFAULT 0.0,
            
            -- Unsubscribe details
            unsub_one_click INTEGER NOT NULL DEFAULT 0,
            unsub_url TEXT,
            unsub_mailto TEXT,

            raw_headers TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            UNIQUE(account_id, provider_id)
        );

        -- Labels Table
        CREATE TABLE IF NOT EXISTS labels (
            id TEXT PRIMARY KEY,
            account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            color TEXT,
            is_system INTEGER NOT NULL DEFAULT 0,
            is_ai INTEGER NOT NULL DEFAULT 0,
            sort_order INTEGER NOT NULL DEFAULT 0,
            UNIQUE(account_id, name)
        );

        -- Message-to-Label Mapping
        CREATE TABLE IF NOT EXISTS message_labels (
            message_id TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
            label_id TEXT NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
            applied_at TEXT NOT NULL DEFAULT (datetime('now')),
            PRIMARY KEY (message_id, label_id)
        );

        -- Attachments Table
        CREATE TABLE IF NOT EXISTS attachments (
            id TEXT PRIMARY KEY,
            message_id TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
            filename TEXT NOT NULL,
            mime_type TEXT NOT NULL,
            size_bytes INTEGER NOT NULL,
            content_id TEXT,
            is_inline INTEGER NOT NULL DEFAULT 0,
            file_path TEXT
        );

        -- Contacts Table
        CREATE TABLE IF NOT EXISTS contacts (
            id TEXT PRIMARY KEY,
            email TEXT NOT NULL UNIQUE,
            name TEXT,
            avatar_url TEXT,
            frequency INTEGER NOT NULL DEFAULT 1,
            last_seen TEXT NOT NULL,
            domain TEXT NOT NULL
        );

        -- Indexes for 60fps Queries
        CREATE INDEX IF NOT EXISTS idx_messages_account_received ON messages(account_id, received_at DESC);
        CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(thread_id);
        CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(is_read) WHERE is_read = 0;
        CREATE INDEX IF NOT EXISTS idx_messages_category ON messages(ai_category);
        CREATE INDEX IF NOT EXISTS idx_message_labels_label ON message_labels(label_id);
        CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);

        -- Full-Text Search Virtual Table (FTS5)
        CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts USING fts5(
            subject,
            body_text,
            from_name,
            from_address,
            content=messages,
            content_rowid=rowid,
            tokenize='porter unicode61'
        );

        -- Triggers to keep FTS5 synchronized with messages table
        CREATE TRIGGER IF NOT EXISTS messages_ai AFTER INSERT ON messages BEGIN
            INSERT INTO messages_fts(rowid, subject, body_text, from_name, from_address)
            VALUES (new.rowid, new.subject, COALESCE(new.body_text, ''), COALESCE(new.from_name, ''), new.from_address);
        END;

        CREATE TRIGGER IF NOT EXISTS messages_ad AFTER DELETE ON messages BEGIN
            INSERT INTO messages_fts(messages_fts, rowid, subject, body_text, from_name, from_address)
            VALUES('delete', old.rowid, old.subject, COALESCE(old.body_text, ''), COALESCE(old.from_name, ''), old.from_address);
        END;

        CREATE TRIGGER IF NOT EXISTS messages_au AFTER UPDATE ON messages BEGIN
            INSERT INTO messages_fts(messages_fts, rowid, subject, body_text, from_name, from_address)
            VALUES('delete', old.rowid, old.subject, COALESCE(old.body_text, ''), COALESCE(old.from_name, ''), old.from_address);
            INSERT INTO messages_fts(rowid, subject, body_text, from_name, from_address)
            VALUES (new.rowid, new.subject, COALESCE(new.body_text, ''), COALESCE(new.from_name, ''), new.from_address);
        END;

        -- Record migration
        INSERT INTO _schema_migrations (version, applied_at)
        VALUES (1, datetime('now'));

        COMMIT;"
    )?;

    Ok(())
}
