name: preferences
description: How the user wants the AI to work, code style, UI design rules, and cost constraints. Read before writing any code or proposing UI designs.
updated: 2026/10/15

[stated 2026/10/15] Zero cloud infrastructure and zero monthly bill: everything must run locally on macOS hardware (local SQLite, local Ollama, no paid APIs).
[stated 2026/10/15] Strict "No AI-Slop UI" standard: zero muddy diffuse shadows (no shadow-xl/2xl), pure 1px ambient borders (border-white/[0.08] in dark mode), tonal surface elevations, Apple macOS/Linear aesthetic.
[stated 2026/10/15] Strict geometry rules: 8px (rounded-lg) for inputs/controls, 12px (rounded-xl) for dialogs/panels.
[stated 2026/10/15] Spring physics animation standard: use Framer Motion or Motion-One with damped springs (stiffness: 450, damping: 32), sub-150ms micro-interactions.
[stated 2026/10/15] High-contrast typography: optical kerning, font-mono tabular-nums for dates, counters, and file sizes.
[stated 2026/10/15] Keyboard-first navigation: core operations must support vim/superhuman shortcuts (J/K navigation, E to archive, Cmd+K palette).
[stated 2026/10/15] Anti-slop skill pack: uses Nutlope/hallmark (.agents/skills/hallmark/) 57-point slop test and micro-interactions reference to prevent generic AI design tropes.
[stated 2026/10/15] Contract-first engineering: verify interfaces in docs/contracts/ before implementing code.
