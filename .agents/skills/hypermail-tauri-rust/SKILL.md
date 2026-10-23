---
name: hypermail-tauri-rust
description: Guidelines for Tauri v2 commands, async state, error handling, and IPC contracts in HyperMail.
---

# HyperMail Tauri v2 & Rust Engineering Skill

## 1. Tauri Command Patterns

All commands exposed to the frontend must return a structured `Result<T, AppError>`. Never panic or unwrap in command handlers.

### Standard Error Handling
```rust
#[derive(Debug, thiserror::Error, serde::Serialize)]
#[serde(tag = "type", content = "message")]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(String),
    #[error("Authentication error: {0}")]
    Auth(String),
    #[error("Sync error: {0}")]
    Sync(String),
    #[error("AI error: {0}")]
    Ai(String),
    #[error("Not found: {0}")]
    NotFound(String),
}
```

## 2. Concurrency & Synchronization
- Use **Tokio** tasks for background sync loops.
- Store shared state in `tauri::State<AppState>` using `Arc<RwLock<T>>` or atomic flags.
- Long-running sync jobs must report incremental progress to the frontend via `app_handle.emit("sync_progress", payload)`.
- Support graceful cancellation using `tokio_util::sync::CancellationToken`.

## 3. macOS Keychain Integration
- Store OAuth refresh tokens and IMAP/SMTP passwords exclusively in macOS Keychain via the `security-framework` crate.
- Never write credentials to SQLite, config files, or log outputs.
