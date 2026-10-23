# Zmail Task Board & Implementation Plan

## Phase 1: Local Foundation & Shell (Current)

- [x] **Task 1.1: Project Scaffolding**
  - **Owner**: Frontend/Tooling Agent
  - **Status**: Completed ✅
  - **Delivered**: Tauri v2 + React 19 + TypeScript + Tailwind v4 + Vite initialized with dark mode canvas `#090A0C` to eliminate start flash. `pnpm run build` succeeds in 196ms.

- [x] **Task 1.2: Local SQLite, FTS5 & Full Backend Implementation**
  - **Owner**: Backend Core Agent
  - **Status**: Completed ✅
  - **Delivered**:
    - SQLite WAL mode + schema migrations (`accounts`, `messages`, `labels`, `contacts`, `attachments`)
    - FTS5 full-text search with automatic sync triggers and BM25 ranking
    - macOS Keychain token storage (`security-framework`)
    - Gmail REST API connector with RFC 822 MIME parsing (`mail-parser`)
    - RFC 8058 one-click bulk unsubscribe parser and HTTP POST dispatcher
    - Local Ollama AI client (structured JSON triage, 1-sentence summaries, smart replies)
    - Complete Tauri v2 IPC command registry
    - In-memory unit test suite (4/4 tests passed in 0.01s)
    - Full technical documentation in `docs/backend.md` and open-source `README.md`
  - **Evidence**: `cargo check` clean (0 warnings), `cargo clippy -- -D warnings` clean, `cargo test` passing.

- [x] **Task 1.3: Apple/Linear-Grade UI Component Kit**
  - **Owner**: Frontend UI Agent
  - **Status**: Completed ✅
  - **Delivered**:
    - Sidebar with account dots, unread badges in `font-mono tabular-nums`, and AI hardware status
    - Virtualized MessageList via `@tanstack/react-virtual` with FTS5 search bar and keyboard navigation (J/K/E/S)
    - MessageRow with 1px ambient borders, 0 heavy shadows, AI priority pills, and 1-click unsub badges
    - MessageDetailView with AI Intelligence summary card, action items list, sandboxed email iframe, and smart reply pills
    - ComposeModal (`C` / `Cmd+Enter`) and CommandPalette (`Cmd+K`)
  - **Acceptance Verification**: Passes all 57 Hallmark anti-slop guidelines and compiles with `tsc --noEmit` clean.

- [ ] **Task 1.4: Gmail Loopback OAuth & Initial Sync**
  - **Owner**: Connector Agent
  - **Scope**: Implement loopback redirect on localhost, store tokens in macOS Keychain, and execute initial `users.messages.list` read.
  - **Acceptance Criteria**: Real Gmail inbox syncs 50 messages into local SQLite and displays them in the UI.
