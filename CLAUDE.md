# HAM Landing Page

## Stack
- Next.js 16 (App Router, TypeScript, Turbopack)
- Tailwind CSS v4 (CSS-first `@theme` config)
- Framer Motion (scroll-reveal animations)
- Lucide React (icons)

## Rules
- All components use "use client" only when they need browser APIs or hooks
- Green/forest color palette — tokens defined in `globals.css` via `@theme inline`
- Copy and data live in `src/lib/constants.ts` — components import, never hardcode

## Context Routing

→ app: src/app/CLAUDE.md
→ components: src/components/CLAUDE.md
→ lib: src/lib/CLAUDE.md

## Agent Memory System

### Before Working
- Read this file for global context → follow Context Routing to load the relevant subdirectory CLAUDE.md
- If no Context Routing section, read target directory's CLAUDE.md before changes
- Check .memory/decisions.md before architectural changes
- Check .memory/patterns.md before implementing common functionality

### During Work
- Create CLAUDE.md in any new directory you create

### After Work
- Update relevant CLAUDE.md if conventions changed
- Log decisions to .memory/decisions.md (ADR format)
- Log patterns to .memory/patterns.md
- Uncertain inferences → .memory/inbox.md (never canonical files)

### Safety
- Never record secrets, API keys, or user data
- Never overwrite decisions — mark as [superseded]
- Never promote from inbox without user confirmation
