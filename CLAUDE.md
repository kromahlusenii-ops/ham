# HAM — Hierarchical Agent Memory Skill

## What This Is
A Claude Code skill that sets up scoped CLAUDE.md files per directory to reduce token spend.

## Key Files
- `SKILL.md` — skill definition (triggers, setup logic, commands)
- `dashboard/` — local Vite dashboard for analytics (launched via `ham dashboard`)
- `scripts/` — update scripts
- `templates.md` — CLAUDE.md templates for common directory types
- `platforms.md` — platform compatibility notes
- `references/` — reference docs

## Rules
- This repo is skill-only — no landing page, no Next.js, no pro tier
- Pro tier / landing page lives in `kromahlusenii-ops/ham-pro`
- Keep the skill self-contained: no external dependencies beyond what `dashboard/` needs

## Agent Memory System

### Before Working
- Read this file for global context
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
