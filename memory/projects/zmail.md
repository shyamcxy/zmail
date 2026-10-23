name: zmail
description: Ongoing Zmail project: architecture decisions, constraints, sync mechanics, and current milestone. Read for any implementation work on Zmail.
updated: 2026/10/15

[stated 2026/10/15] Project officially named Zmail (renamed from HyperMail to avoid copyright conflicts).
[stated 2026/10/15] Desktop-first architecture using Tauri v2 (Rust backend + React 19 / TypeScript frontend + Tailwind CSS).
[stated 2026/10/15] Multi-account support: Gmail REST API for Gmail accounts, IMAP IDLE + SMTP for custom domain job accounts.
[stated 2026/10/15] Permanent Gmail OAuth decision: Google Cloud OAuth client must be set to Publishing Status 'In Production' to prevent the 7-day token expiration trap without needing full Google app verification.
[stated 2026/10/15] Zero cloud infrastructure: dropped Google Cloud Pub/Sub webhooks in favor of local IMAP IDLE and local 30s incremental polling via historyId.
[stated 2026/10/15] Local database: SQLite with WAL mode, FTS5 full-text search, and sqlite-vec for 768-dim embeddings in one single zmail.db file.
[stated 2026/10/16] Local AI pipeline: primary engine is LU (Locally Uncensored) whose bundled `lu-llama-server` is llama.cpp on `127.0.0.1:8080` speaking the OpenAI-compatible API, running `Qwen3.5-9B-abliterated.Q4_K_M` plus `nomic-embed-text-v1.5`; Ollama on `:11434` remains the fallback. Zmail auto-discovers endpoint and loaded model id rather than hardcoding either.
[stated 2026/10/15] Gmail Integration: Strict Gmail REST API via OAuth2 (no IMAP for Gmail). User is replacing an existing Google Cloud test project with Zmail to generate credentials.
[stated 2026/10/15] Security boundary: untrusted HTML email bodies render inside an isolated, sandboxed iframe (allow-same-origin, no scripts, tracking pixels blocked by default).
[stated 2026/10/15] Current milestone: Frontend and Backend core complete (React 19 + Tailwind v4 + Tauri v2 + SQLite FTS5). Awaiting Google Cloud OAuth credentials to test live loopback sync.
