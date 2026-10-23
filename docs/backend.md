# Zmail Backend Architecture & Technical Reference

Zmail's backend is a high-performance, asynchronous Rust service embedded inside a **Tauri v2** desktop shell. It manages concurrent account synchronization, local SQLite storage with full-text search (FTS5), macOS Keychain token security, local Ollama LLM integration, and RFC 8058 one-click unsubscribe execution—all on the user's local hardware with zero cloud dependencies.

---

## 1. Module Overview

```
src-tauri/src/
├── lib.rs              # Application entry point, setup hook, IPC handler registration
├── main.rs             # Desktop executable binary wrapper
├── state.rs            # Thread-safe global AppState shared across all Tauri commands
├── models.rs           # Canonical Rust structs corresponding to docs/contracts/types.ts
├── error.rs            # Unified AppError enum with serde serialization for Tauri IPC
├── db/
│   ├── mod.rs          # DatabaseManager lifecycle and connection provider
│   ├── schema.rs       # PRAGMA configuration, schema migrations, FTS5 sync triggers
│   └── queries.rs      # High-performance DbService queries (CRUD, pagination, FTS5)
├── auth/
│   ├── mod.rs          # Authentication subsystem exports
│   ├── keychain.rs     # macOS Keychain integration via security-framework crate
│   └── gmail_oauth.rs  # Loopback HTTP listener for desktop OAuth2 code exchange
├── sync/
│   ├── mod.rs          # Sync subsystem exports
│   ├── gmail.rs        # Gmail REST API client with RFC 822 MIME parsing (mail-parser)
│   └── smtp.rs         # SMTP email dispatch via lettre crate
├── unsubscribe/
│   └── mod.rs          # RFC 2369 & RFC 8058 one-click unsubscribe parser and executor
├── ai/
│   ├── mod.rs          # Local AI subsystem exports
│   └── ollama.rs       # Local Ollama client (structured JSON triage, summaries, embeddings)
└── commands/
    └── mod.rs          # Tauri IPC command handlers exposed to the React frontend
```

---

## 2. Storage & Full-Text Search (SQLite FTS5)

### Connection Pragmas
Every database connection is initialized with WAL mode and strict integrity constraints:
```sql
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA foreign_keys = ON;
PRAGMA busy_timeout = 5000;
PRAGMA temp_store = MEMORY;
```

### Full-Text Search Triggers
FTS5 full-text search indexing is kept 100% in sync with the `messages` table via SQLite triggers (`AFTER INSERT`, `AFTER UPDATE`, `AFTER DELETE`):
```sql
CREATE VIRTUAL TABLE messages_fts USING fts5(
    subject,
    body_text,
    from_name,
    from_address,
    content=messages,
    content_rowid=rowid,
    tokenize='porter unicode61'
);
```

Queries use the built-in BM25 ranking algorithm:
```sql
SELECT m.* FROM messages m
JOIN messages_fts fts ON m.rowid = fts.rowid
WHERE messages_fts MATCH ?1 AND m.is_trash = 0
ORDER BY bm25(messages_fts) ASC
LIMIT ?2;
```

---

## 3. macOS Keychain Credential Security

Tokens and credentials are never stored in plaintext SQLite databases or configuration files. Zmail communicates directly with the macOS Keychain via Apple's Security Framework:
- **Service Name**: `hypermail` (account refresh tokens / app passwords), `hypermail_oauth` (OAuth client credentials).
- **Encryption**: Hardware-backed, AES-256 encrypted system keychain.

---

## 4. Gmail REST Synchronization & MIME Parsing

Rather than using IMAP with overly broad scopes, Zmail synchronizes with the Gmail REST API:
- **Scope**: `https://www.googleapis.com/auth/gmail.modify`
- **Initial Sync**: `users.messages.list` (fetching message IDs), followed by `users.messages.get?format=raw`.
- **Parsing**: Raw RFC 822 MIME streams are parsed using the `mail-parser` crate:
  - Extracts UTF-8 plain text bodies and sanitized HTML.
  - Extracts attachment metadata and inline content IDs.
  - Parses `List-Unsubscribe` (RFC 2369) and `List-Unsubscribe-Post` (RFC 8058).
- **Thread Safety**: Network I/O is completely detached from database locks; messages are fetched over async HTTP and then committed to SQLite within a single synchronous transaction.

---

## 5. Local AI Pipeline (LU / llama.cpp or Ollama)

Zmail talks to any **local** inference server. It never calls a cloud API.

### Endpoint discovery
`OllamaClient` resolves its endpoint once per process and caches it (`OnceLock`):
1. `ZMAIL_AI_BASE_URL` if set (pins the endpoint, disabling discovery)
2. `http://127.0.0.1:8080` — LU / `llama-server` / llama.cpp / LM Studio
3. `http://127.0.0.1:11434` — stock Ollama

Liveness is probed against `/v1/models`, `/api/tags`, then `/health`, so both API shapes are recognised.

### Model discovery
Unless `ZMAIL_AI_MODEL` is set, Zmail reads the first non-embedding model id from `/v1/models`.
This matters: `llama-server` rejects requests whose `model` field doesn't match a loaded alias.
Falls back to `qwen3.5-9b` if discovery fails.

### Request formats
Every LLM call tries the OpenAI-compatible shape first, then Ollama's native shape:
- `POST /v1/chat/completions` with `response_format: {"type":"json_object"}` — LU / llama.cpp / LM Studio
- `POST /api/chat` with `format: "json"` — Ollama
- Embeddings: `POST /v1/embeddings` (`{"model", "input"}` → `data[0].embedding`) first, then Ollama's `POST /api/embeddings` (`{"model", "prompt"}` → `embedding`)

### Models & prompt handling
- **Chat**: `Qwen3.5-9B-abliterated.Q4_K_M` via LU (`n_ctx 4096`). Ollama path defaults to `llama3.1:8b`.
- **Embeddings**: `nomic-embed-text-v1.5` (768-dim), name configurable via `ZMAIL_EMBEDDING_MODEL`.
- **Structured JSON Output**: strict schema for triage (`category`, `priority`, `summary`, `action_items`, `is_spam`) and `{"replies": [...]}` for smart replies.
- **Prompt Injection Defense**: Email content is truncated (3000 chars triage / 2000 replies) on a char boundary and wrapped in `<email_data>` delimiters, treated strictly as untrusted input data.
- **Timeouts**: 1.5s for probes (runs at startup), 180s for inference — a 9B Q4 model needs headroom on prompt ingestion.
- **Graceful degradation**: if the server is unreachable, malformed, or returns non-JSON, `heuristic_triage` runs pure-Rust keyword rules and smart replies fall back to static strings. The app never hard-fails when AI is offline.

### Starting LU's server
```bash
/Applications/LU.app/Contents/MacOS/lu-llama-server \
  -m "$HOME/Library/Application Support/Locally Uncensored/models/Qwen3.5-9B-abliterated.Q4_K_M.gguf" \
  --host 127.0.0.1 --port 8080 -c 4096 -a qwen3.5-9b
```

---

## 6. Tauri IPC API Reference

| Command | Input Arguments | Return Type | Description |
|---|---|---|---|
| `list_accounts` | `None` | `AppResult<Vec<Account>>` | Lists all configured email accounts. |
| `add_account` | `account: Account`, `refresh_token_or_password: Option<String>` | `AppResult<()>` | Adds a new account and securely stores secret in Keychain. |
| `remove_account` | `account_id: String` | `AppResult<()>` | Removes account and purges credentials from Keychain. |
| `list_messages` | `account_id: Option<String>`, `category: Option<String>`, `is_read: Option<bool>`, `limit: Option<u32>`, `offset: Option<u32>` | `AppResult<Vec<Message>>` | Paginated message feed with optional filtering. |
| `get_message_detail`| `id: String` | `AppResult<MessageDetail>` | Retrieves complete message including body text and HTML. |
| `set_message_read` | `id: String`, `is_read: bool` | `AppResult<()>` | Marks a message as read or unread. |
| `set_message_starred`| `id: String`, `is_starred: bool` | `AppResult<()>` | Stars or unstars a message. |
| `set_message_archived`| `id: String`, `is_archived: bool` | `AppResult<()>` | Archives or unarchives a message. |
| `set_message_trash` | `id: String`, `is_trash: bool` | `AppResult<()>` | Moves a message to trash or restores it. |
| `search_messages` | `query: String`, `limit: Option<u32>` | `AppResult<Vec<Message>>` | Executes an FTS5 full-text search with BM25 ranking. |
| `sync_account` | `account_id: String` | `AppResult<usize>` | Triggers incremental sync and returns count of imported messages. |
| `triage_message` | `message_id: String` | `AppResult<AiTriageResult>` | Uses local Ollama to derive category, priority, summary, and action items. |
| `generate_smart_replies`| `message_id: String` | `AppResult<Vec<String>>` | Derives 3 contextual smart replies via local LLM. |
| `execute_one_click_unsubscribe` | `url: String` | `AppResult<bool>` | Executes RFC 8058 one-click unsubscribe via local HTTP POST. |
| `check_ollama_status`| `None` | `AppResult<bool>` | Checks if local Ollama runtime is reachable. |

---

## 7. Running Backend Tests & Lints

```bash
# Run unit and integration tests (in-memory SQLite, FTS5, header parsing)
cargo test --manifest-path src-tauri/Cargo.toml

# Run clippy with strict zero-warning enforcement
cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings
```
