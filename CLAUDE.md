# Zmail — Claude / Coding Agent Quick Guide

See [AGENTS.md](./AGENTS.md) for the authoritative engineering standards, anti-slop design rules, and architecture boundaries.

## Key Project Rules
- **No AI-Slop UI**: Clean Apple/Linear aesthetic. 1px borders, subtle tonal elevation, zero diffuse drop-shadows, spring physics animations.
- **Local-first $0 budget**: All sync, storage, and AI processing must run on the user's Mac. No external cloud dependencies.
- **Contract-first**: Adhere strictly to types in `docs/contracts/`.

## Common Commands
- Frontend dev: `pnpm run dev`
- Tauri desktop dev: `pnpm tauri dev`
- Rust check: `cargo check` (inside `src-tauri/`)
- TypeScript check: `pnpm tsc --noEmit`
- Lint: `pnpm run lint`
