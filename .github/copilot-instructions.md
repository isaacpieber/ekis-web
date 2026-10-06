# AI Agent Instructions: Ekis PWA (Next.js + Supabase)
## 1. Execution & Token Conservation ("No Yapping" Protocol)
* **Review Before Execution:** Whenever you receive a prompt or architectural plan, cross-reference it against the current codebase first. 
    - If the plan conflicts with existing files, breaks our Tailwind rules, or introduces security flaws, STOP. Output a strict 2-3 sentence warning and wait for user input.
    - If the plan is sound, do not explain it. Output exactly: "Plan verified." and proceed directly to code generation.
* **Zero Fluff:** Never output conversational filler (e.g., "Here is the updated code", "I have added...", "Let me know if you need anything else"). 
* **Direct Output:** Only output the exact file paths and the code blocks required for the implementation. 
## 2. Strict Design System & UI Rules
You are building a mobile-first, installable Progressive Web App (PWA) with a strict, unified Barbie-inspired theme.
* **Strict Semantic Colors:** NEVER use arbitrary Tailwind color scales (e.g., do NOT use `blue-500`, `gray-100`, `pink-400`). You MUST ONLY use the semantic theme variables defined in `globals.css` via Tailwind v4 `@theme`:
    - Backgrounds: `bg-background`, `bg-surface`
    - Text: `text-text-main`, `text-text-muted`, `text-primary`
    - Interactive: `bg-primary hover:bg-primary-hover`, `bg-surface-dark`
    - Borders: `border-surface-dark`
* **Spacing & Typography:** 
    - NEVER use arbitrary spacing values (e.g., `p-[15px]`, `w-[300px]`). Rely strictly on the default Tailwind spacing scale (`p-4`, `p-6`, `gap-4`, `mb-4`).
    - Ensure high contrast and readability for text elements.
* **Mobile-First & Touch (PWA):** 
    - ALL clickable elements (buttons, links, form inputs) must have a minimum touch target size of `min-h-[44px] min-w-[44px]`.
    - Use `rounded-xl` for cards, buttons, and inputs to maintain a modern, friendly geometry.
    - Form inputs must include `focus:ring-2 focus:ring-primary focus:outline-none`.
* **Accessibility (a11y):** Ensure proper semantic HTML elements (e.g., `<button>` vs `<a>`), include `aria-labels` on icon-only buttons, and maintain contrast ratios. The app language is Swedish (`lang="sv"`).
## 3. Architecture & Security Context
* **Framework:** Next.js (App Router), React, Tailwind CSS v4, Supabase (PostgreSQL with RLS).
* **Security:** Row Level Security (RLS) is strictly enforced.
* **Service Role Pattern:** The calendar subscription feed (`app/api/calendar/feed/[token]/route.ts`) uses the Supabase Service Role key (`SUPABASE_SERVICE_ROLE_KEY`) to bypass RLS only after validating the subscription token against a profile's `calendar_token`. Never leak the service role key to the client.