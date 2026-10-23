---
name: hypermail-email-connectors
description: Standards for connecting to Gmail REST API and IMAP/SMTP providers without cloud infrastructure.
---

# HyperMail Email Connectors Skill

## 1. Gmail Connector (REST API)
- **Authentication**: Loopback redirect flow (`http://127.0.0.1:<port>`).
  - Google Cloud Project must have Publishing Status set to **In Production** to prevent the 7-day token expiration caveat.
  - Required Scopes: `https://www.googleapis.com/auth/gmail.modify`.
- **Synchronization**:
  - Initial sync: `users.messages.list` with batch size 100.
  - Store `historyId`.
  - Incremental sync: `users.history.list` starting at `last_history_id`.
  - Polling interval: Every 30 seconds when window is focused; every 2 minutes when minimized.

## 2. IMAP & SMTP Connector (Custom Domains)
- **Protocol**: `async-imap` over TLS (port 993) or STARTTLS (port 143).
- **Push Notifications**: Use IMAP `IDLE` command on dedicated persistent connections. Break IDLE on server notification, fetch new messages, and re-issue IDLE.
- **MIME Parsing**: Use `mail-parser` crate. Extract plain text, sanitized HTML, attachments, and `List-Unsubscribe` headers.
- **SMTP Sending**: Use `lettre` with authenticated STARTTLS / TLS.

## 3. Bulk Unsubscribe Engine
- Parse `List-Unsubscribe` and `List-Unsubscribe-Post`.
- When `List-Unsubscribe-Post: List-Unsubscribe=One-Click` is present, perform HTTP POST with body `List-Unsubscribe=One-Click` directly from the local client.
- Always require user confirmation before executing bulk unsubscribe actions.
