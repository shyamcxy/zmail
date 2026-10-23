---
name: hypermail-ui-engineering
description: Standards and guidelines for building HyperMail's high-craft, anti-slop, Apple/Linear-inspired user interface.
---

# HyperMail UI Engineering Skill: Anti-AI-Slop & Apple/Linear Design

## 1. Aesthetic Foundations

HyperMail is a precision tool for power users. The aesthetic target is **Apple macOS Sonoma/Sequoia native + Linear.app + Rauno Freiberg micro-interactions**.

### Rules for Anti-AI-Slop
1. **No Muddy Drop Shadows**:
   - ❌ `shadow-xl`, `shadow-2xl`, diffuse color shadows
   - ✅ Subtle 1px ambient border with tonal elevation:
     ```css
     /* Dark mode surface 1 */
     background-color: rgba(255, 255, 255, 0.03);
     border: 1px solid rgba(255, 255, 255, 0.08);
     ```
2. **Surface Tonality Hierarchy**:
   - `surface-0` (Canvas/Background): `#090A0C` (Dark) / `#FBFBFC` (Light)
   - `surface-1` (Sidebar & Inactive Panes): `#121316` (Dark) / `#F3F4F6` (Light)
   - `surface-2` (Active Row / Cards): `#1A1B20` (Dark) / `#FFFFFF` (Light)
   - `surface-hover`: `rgba(255, 255, 255, 0.05)` (Dark) / `rgba(0, 0, 0, 0.04)` (Light)
3. **Typography & Layout**:
   - Font: Inter or system `-apple-system, BlinkMacSystemFont`.
   - Optical sizes and numbers: Always use `font-mono tabular-nums` for dates, unread counts, and file sizes.
   - Contrast: Primary text `#EDEDED` (95% contrast), secondary text `#8A8F98` (60%), never use unreadable low-contrast gray.
4. **Motion & Spring Physics**:
   - Use Framer Motion or Motion-One with damped spring transitions.
   - Standard spring: `{ type: "spring", stiffness: 450, damping: 32 }`.
   - Hover transitions: `duration: 0.12s, ease: "easeOut"`.
   - No sluggish layout jumps or slow fade-ins.

## 2. Component Guidelines
- **List Virtualization**: Inbox list must be virtualized (`@tanstack/react-virtual`) to guarantee 60fps scrolling over 50,000+ emails.
- **HTML Email Sandbox**:
  - Always render email body inside `<iframe sandbox="allow-same-origin" srcDoc={cleanHtml} />`.
  - Disable script execution. Auto-rewrite or block tracking pixels unless user explicitly clicks "Load remote images".
- **Keyboard Navigation**:
  - `J` / `K`: Move down / up in email list.
  - `E` or `Y`: Archive.
  - `Delete` / `#`: Move to trash.
  - `Cmd + K`: Command palette.
  - `C`: Open compose.
