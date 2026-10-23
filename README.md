# 🚀 Zmail

<div align="center">

**A local-first, zero-cloud, AI-native email client engineered for macOS.**  
*Multi-account Gmail & custom domain sync • Sub-millisecond FTS5 search • Local Ollama LLM triage • $0/month bill.*

[![Tauri v2](https://img.shields.io/badge/Tauri-v2.12-24C8DB?logo=tauri&logoColor=white)](https://tauri.app)
[![Rust](https://img.shields.io/badge/Rust-2024_Edition-DEA584?logo=rust&logoColor=white)](https://www.rust-lang.org)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![SQLite FTS5](https://img.shields.io/badge/SQLite-FTS5_WAL-003B57?logo=sqlite&logoColor=white)](https://sqlite.org)
[![Ollama](https://img.shields.io/badge/Ollama-Local_AI-white?logo=ollama&logoColor=black)](https://ollama.ai)
[![License](https://img.shields.io/badge/License-MIT%20OR%20Apache--2.0-blue.svg)](LICENSE)
[![Zero Cloud Bill](https://img.shields.io/badge/Cloud_Bill-$0.00/mo-success)](#-prime-directive-0-cloud-bill)

</div>

---

## 🎯 The Philosophy

Most email clients today are bloated Electron apps that cost \$30/month, sell your telemetry, or require your emails to pass through third-party cloud servers. 

**Zmail is built differently:**
1. **$0 Forever**: Runs 100% on your local Mac. No servers, no SaaS subscriptions, no API bills.
2. **Local AI Brain**: Email categorization, thread summaries, smart replies, and spam scoring run on your own hardware via **Ollama** (`llama3.1:8b`).
3. **No AI-Slop UI**: Designed against strict Apple/Linear aesthetic standards. No muddy drop shadows, no generic purple gradients—just razor-sharp 1px ambient borders, tonal elevation, and physical spring animations.
4. **Native Speed**: Async Rust backend with SQLite in WAL mode and FTS5 full-text indexing. Sub-10ms queries across 50,000+ emails.

---

## 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                         Zmail Desktop App                          │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │                    Frontend (WebKit WebView)                   │   │
│   │         React 19 + TypeScript + Tailwind CSS + Framer Motion    │   │
│   │   [ Unified Inbox ]   [ TipTap Compose ]   [ AI Sidebar ]      │   │
│   └────────────────────────────────┬───────────────────────────────┘   │
│                                    │ Tauri v2 IPC Commands             │
│   ┌────────────────────────────────┴───────────────────────────────┐   │
│   │                    Backend (Rust Tokio Core)                   │   │
│   │  • Gmail REST Sync Engine (RFC 822 MIME parser)                │   │
│   │  • macOS Keychain Secret Storage (security-framework)          │   │
│   │  • Local Ollama HTTP Client (Structured JSON chat/embeddings)  │   │
│   │  • RFC 8058 One-Click Bulk Unsubscribe Dispatcher              │   │
│   │  • SMTP Dispatcher (lettre)                                    │   │
│   └────────────────────────────────┬───────────────────────────────┘   │
│                                    │                                   │
│   ┌────────────────────────────────┴───────────────────────────────┐   │
│   │              Data Layer (Single SQLite WAL Database)           │   │
│   │  • accounts  • messages  • labels  • contacts  • attachments   │   │
│   │  • messages_fts (FTS5 BM25 Ranked Full-Text Index)             │   │
│   └────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
                 │                                        │
                 ▼                                        ▼
    ┌─────────────────────────┐              ┌─────────────────────────┐
    │     Gmail REST API      │              │      Local Ollama       │
    │  (Direct Client-to-API) │              │  (http://localhost:11434│
    └─────────────────────────┘              └─────────────────────────┘
```

---

## ✨ Features

- **Multi-Account Unified Inbox**: Manage multiple Gmail accounts and custom domain work accounts in one unified or per-account stream.
- **Sub-10ms Full-Text Search**: Powered by SQLite FTS5 with BM25 ranking over message subject, sender, and full body text.
- **Local AI Triage & Summaries**: Derives priority (`critical`, `high`, `medium`, `low`), categories (`work`, `personal`, `newsletter`, `financial`, `notification`), 1-sentence summaries, and action items via local Ollama.
- **Smart Reply Generator**: Generates 3 contextual response options (professional, brief, friendly) in seconds without external API calls.
- **One-Click Bulk Unsubscribe**: Detects RFC 2369 & RFC 8058 headers and executes native HTTP POST `List-Unsubscribe=One-Click` directly from your machine.
- **Hardware-Backed Credential Security**: OAuth refresh tokens and passwords reside exclusively in the **macOS Keychain**.
- **Sandboxed Email Rendering**: Raw HTML email bodies are sanitized and rendered in an isolated sandbox with tracking pixels blocked by default.

---

## 🛠️ Prerequisites

- **macOS** with Apple Silicon (M1/M2/M3/M4) or Intel
- **Rust** 1.90+ (`rustc --version`)
- **Node.js** 20+ & **pnpm** (`pnpm --version`)
- **Ollama** installed locally (`brew install ollama`)

---

## 🚀 Quick Start

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/zmail/zmail.git
cd zmail

# Install frontend dependencies
pnpm install
```

### 2. Set Up Local Ollama AI Models
```bash
# Start Ollama service (if not running)
ollama serve

# Pull the primary brain and embedding models
ollama pull llama3.1:8b
ollama pull nomic-embed-text
```

### 3. Verify Backend Build & Tests
```bash
# Run backend test suite (in-memory SQLite, FTS5, header parsing)
cargo test --manifest-path src-tauri/Cargo.toml

# Run strict linter
cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings
```

### 4. Run in Development Mode
```bash
pnpm tauri dev
```

---

## 🔑 Permanent Gmail OAuth Setup (Zero Verification Needed)

To sync your Gmail accounts permanently without cloud infrastructure:

1. Open [Google Cloud Console](https://console.cloud.google.com/) (100% free, no credit card required).
2. Create a project: `Zmail-Personal`.
3. Enable the **Gmail API** in APIs & Services.
4. Configure the **OAuth Consent Screen**:
   - User Type: **External**.
   - Publishing Status: Click **Publish App** to set it to **"In Production"** *(Critical: This prevents Google's 7-day refresh token expiration rule!)*.
5. Create Credentials:
   - Type: **OAuth Client ID** -> Application Type: **Desktop App**.
   - Download the client credentials JSON.
6. Zmail uses a loopback listener (`http://127.0.0.1:<port>`) for one-time browser authentication. On your initial login, Google will display a *"Google hasn't verified this app"* warning screen—click **Advanced → Go to Zmail (unsafe)** once. Your refresh token is securely stored in your macOS Keychain and **never expires**.

---

## 📁 Repository Structure

```
.
├── src-tauri/               # Rust core backend (Tauri v2)
│   ├── src/
│   │   ├── auth/            # macOS Keychain & Gmail loopback OAuth
│   │   ├── db/              # SQLite WAL connection, migrations, FTS5 triggers
│   │   ├── sync/            # Gmail REST sync & SMTP dispatch
│   │   ├── unsubscribe/     # RFC 8058 one-click unsubscribe parser & executor
│   │   ├── ai/              # Local Ollama structured JSON integration
│   │   ├── commands/        # Tauri IPC command handlers
│   │   ├── models.rs        # Canonical data types
│   │   ├── error.rs         # Structured AppError enum
│   │   └── tests.rs         # Comprehensive unit test suite
│   └── Cargo.toml           # Rust dependencies & capabilities
├── docs/
│   ├── backend.md           # Deep-dive backend architectural documentation
│   └── contracts/types.ts   # Canonical TypeScript data contracts
├── memory/                  # CyrilXBT file-based cross-session agent memory
├── .agents/skills/          # Hallmark anti-slop & engineering skill pack
├── AGENTS.md                # Agent governance & engineering contracts
├── package.json             # Frontend dependencies
└── README.md                # This file
```

---

## 🧪 Testing & Quality Gates

Every pull request and modification must satisfy the Zmail Quality Gates:

```bash
# 1. Type integrity
cargo check --manifest-path src-tauri/Cargo.toml
pnpm tsc --noEmit

# 2. Strict lints
cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings

# 3. Unit test verification
cargo test --manifest-path src-tauri/Cargo.toml
```

---

## 📄 License

Dual-licensed under either:
- **MIT License** ([LICENSE-MIT](LICENSE-MIT))
- **Apache License, Version 2.0** ([LICENSE-APACHE](LICENSE-APACHE))

at your option.
