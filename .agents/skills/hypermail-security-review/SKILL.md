---
name: hypermail-security-review
description: Security rules, HTML email sanitization, and credential handling standards.
---

# HyperMail Security Review Skill

## 1. Untrusted Content Isolation
- Email content is untrusted input from the public internet.
- **HTML Sanitization**: Strip `<script>`, `<base>`, `<object>`, `<embed>`, and dangerous attributes (`onload`, `onerror`).
- **Render Sandbox**: Render in `<iframe sandbox="allow-same-origin">`. Disallow top-level navigation.
- **Remote Content**: Block external images (`<img>`) and font tracking pixels by default unless explicitly allowed by the user.

## 2. Prompt Injection Defense
- Never pass raw email text into LLMs as prompt instructions.
- Always encapsulate email text inside XML/JSON delimiters:
  ```
  <email_content>
  ...untrusted content...
  </email_content>
  ```
- The LLM must never have autonomous write or delete capabilities over mailboxes without explicit human confirmation.
