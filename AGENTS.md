# Zmail Agent Governance & Development Contract

This document governs the engineering standards, architecture rules, and acceptance criteria for any AI agent or human contributor working on the Zmail codebase.

---

## 1. Persistent Memory System (Cross-Session Context)

Zmail uses the CyrilXBT file-based memory system located in `memory/`:
- `memory/profile.md`: Developer background and environment.
- `memory/preferences.md`: Explicit UI and architectural rules.
- `memory/topics/tools.md`: Machine toolchain and local services.
- `memory/projects/zmail.md`: Project constraints, decisions, and active milestones.

### Memory Rules Every Agent Must Follow:
1. **Silent Application**: Apply memory rules automatically without saying "Based on your memory" or "I remember that you...". Just deliver the right code and design directly.
2. **One Subject Per File**: Never duplicate facts across files. Updates replace old facts instead of piling up.
3. **Explicit Dates**: Keep `[stated YYYY/MM/DD]` timestamps intact.

---

## 2. Prime Directives

1. **Zero Cloud Infrastructure & Zero Bill**: The entire backend, synchronization engine, storage layer, and AI pipeline run locally on the user's macOS hardware. Never introduce cloud services, external databases, or paid APIs.
2. **Contract-First Development**: Before writing any implementation code, interfaces in `docs/contracts/` must be respected. Never arbitrarily change IPC payloads, database schemas, or TypeScript interfaces.
3. **No AI-Slop UI (Apple / Linear Aesthetic Standard)**:
   - **Zero heavy shadows**: Never use diffuse, muddy shadows (`shadow-xl`, `shadow-2xl`). Rely on subtle 1px ambient borders (`border-white/[0.08]` in dark mode, `border-black/[0.08]` in light mode) and surface tonality.
   - **Geometry**: Strictly enforce 8px (`rounded-lg`) for controls/rows, 12px (`rounded-xl`) for panels/dialogs. No random blob shapes.
   - **Animations**: Use spring physics (Framer Motion: `stiffness: 450, damping: 32`) or sub-150ms transitions. No sluggish linear transitions.
   - **Typography**: High contrast, optical kerning, tabular figures (`font-mono` / `tabular-nums`) for timestamps, sizes, and counters.
   - **Keyboard First**: Every core action must have a keyboard shortcut (`J`/`K` navigation, `E` archive, `Cmd+K` command bar).
   - **Hallmark Anti-Slop Enforcement**: Reference `.agents/skills/hallmark/SKILL.md` and its 57-point slop test to evaluate and reject AI design clichés.

---

## 3. Architecture Boundaries

- **Frontend**: Tauri v2 WebView (WebKit on macOS) running React 19 + TypeScript + Tailwind CSS + Lucide Icons.
- **Backend**: Rust 2024 edition managed via Tauri commands. Handles IMAP IDLE, Gmail REST sync, SQLite access, and macOS Keychain token storage.
- **Data Layer**: SQLite with WAL mode, FTS5 for full-text search, and `sqlite-vec` for 768-dim embeddings.
- **AI Processing**: Local Ollama instance (`http://localhost:11434`) using `llama3.1:8b` (all-in-one brain) and `nomic-embed-text` (embeddings). scikit-learn for microsecond Bayesian triage.
- **Security Boundary**: Raw HTML email bodies must render inside a heavily sandboxed `<iframe sandbox="allow-same-origin">` with a strict Content Security Policy (scripts disabled, tracking pixels blocked by default).

---

## 4. Quality Gates (Every PR / Task Must Pass)

| Gate | Requirement |
|---|---|
| **Scope Guard** | Only modify files explicitly listed in the task contract. No drive-by refactoring. |
| **Type Integrity** | `tsc --noEmit` must pass with zero errors. `cargo check` must pass with zero warnings. |
| **No Secrets** | OAuth credentials, refresh tokens, and app passwords must never be logged or hardcoded. |
| **Test Evidence** | Include reproducible test output or mock fixture verification for all changes. |
