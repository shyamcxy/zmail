---
name: hypermail-verification
description: Quality verification gates, linting, build checks, and testing commands.
---

# HyperMail Verification Skill

An agent must run and report evidence for these checks before reporting a task complete:

## Verification Checklist
1. **Frontend Integrity**:
   ```bash
   pnpm tsc --noEmit
   pnpm run lint
   ```
2. **Backend Rust Integrity**:
   ```bash
   cargo check --manifest-path src-tauri/Cargo.toml
   cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings
   ```
3. **Acceptance Verification**:
   - Run unit/integration tests: `cargo test` and `pnpm test`.
   - Provide command output as evidence. Never declare "works" without proof.
