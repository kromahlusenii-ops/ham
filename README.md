


# HAM — Hierarchical Agent Memory
<p align="center">
  <img src="ham.png" alt="HAM" width="400">
</p>

**Fewer tokens. Greener AI.**

HAM is a memory system for AI coding agents that reduces token consumption by up to 50%. Instead of loading your entire project context on every request, HAM scopes memory to the directory you're actually working in.

Less tokens. Faster agents. Lower costs. Greener AI.

---

## The Problem

Every time your AI agent starts a session, it re-reads everything. Your full project structure. Conventions it already learned. Decisions you already made. Context that has nothing to do with the current task.

A single bloated CLAUDE.md can eat 47% of your context window before the agent writes a single line of code.

That's wasted tokens. Wasted money. Wasted energy.

## The Solution

HAM replaces one massive context file with small, scoped memory files at each directory level. Your agent reads only what it needs for the directory it's touching.

```
project-root/
├── CLAUDE.md                  # Global: stack, conventions (under 250 tokens)
├── src/
│   ├── CLAUDE.md              # Shared src patterns
│   ├── api/
│   │   └── CLAUDE.md          # API auth, rate limits, endpoint patterns
│   ├── components/
│   │   └── CLAUDE.md          # Component conventions, styling rules
│   └── db/
│       └── CLAUDE.md          # Schema context, query patterns
└── .memory/
    ├── decisions.md           # Architecture decisions with rationale
    └── patterns.md            # Implementation patterns
```

The agent reads 2-3 small files instead of one massive context dump. Your starting context drops from thousands of tokens to hundreds.

---

## Before & After

| | Before HAM | After HAM |
|---|---|---|
| **Context per prompt** | 4,000 - 12,000 tokens | 2,000 - 6,000 tokens |
| **50-prompt session** | 200K - 600K tokens | 100K - 300K tokens |
| **Context window used at start** | Up to 47% | Under 25% |
| **Token reduction** | — | **Up to 50%** |

---

## Why This Matters

### For Your Wallet
Fewer tokens = lower API bills. Teams running agents at scale see the savings immediately.

### For Your Speed
Smaller context = faster responses. Your agent spends less time processing irrelevant information and more time writing code.

### For The Planet
AI inference accounts for over 80% of AI electricity consumption. Every token generated requires compute, energy, and cooling. Reducing token waste isn't just efficient — it's a sustainability decision.

> Data centers are projected to consume 945 TWh of electricity by 2030 — more than Japan's total consumption. AI is the primary driver of this growth. — *International Energy Agency*

HAM makes your AI usage greener by eliminating the tokens that never needed to exist.

---

## Quick Start

### 1. Add a root CLAUDE.md

Keep it under 250 tokens. Only global conventions belong here.

```markdown
# Project Memory Protocol

## Stack
Next.js 14 (App Router), Supabase, Tailwind, TypeScript

## Rules
- Read THIS file first, then the CLAUDE.md in your target directory
- Check .memory/decisions.md for architecture tasks
- Never read more than 3 memory files per task
- Write to session-log.md before closing any task
```

### 2. Add directory-level CLAUDE.md files

Each file contains only what's needed to work in that directory. 20-50 lines max.

```markdown
# src/api — Agent Context

## Auth Pattern
All endpoints use Supabase RLS. No manual auth checks in route handlers.

## Response Format
Always return { data, error } shape. Never throw from API routes.

## Rate Limiting
Applied at middleware level. Do not add per-route rate limits.
```

### 3. Add .memory files

```markdown
# decisions.md

## Auth Strategy — 2026-02-18
**Context:** Needed auth that works with both SSR and client components.
**Decision:** Supabase Auth with RLS policies. No custom JWT.
**Rejected:** NextAuth (extra dependency), custom JWT (maintenance burden).
```

### 4. Let the agent maintain itself

HAM is self-reinforcing. The root CLAUDE.md instructs the agent to read before coding and write before closing. Context stays fresh without manual maintenance.

---

## How It Works

HAM follows three principles:

**Scope, don't dump.** Every piece of context lives in the most specific directory it applies to. Global conventions in root. API patterns in the API folder. Component rules in the components folder.

**Read small, read relevant.** The agent loads root context + the target directory's context. Two to three small files instead of the entire project.

**Self-maintaining memory.** Session logs and decision files update as the agent works. Stale context is the enemy — HAM keeps it fresh by design.

---

## Installation

```bash
# Clone into your Claude skills directory
git clone https://github.com/kromahlusenii-ops/ham.git ~/.claude/skills/ham
```

### Updating

```bash
cd ~/.claude/skills/ham && git pull
```

The dashboard auto-detects when source files are newer than the last build and rebuilds on next launch — no manual `npm run build` needed. If an update is available when you launch the dashboard, you'll see a notice in the terminal.

## Commands

| Command | What it does |
|---|---|
| **`go ham`** | Set up HAM in your project (auto-detects everything) |
| **`HAM savings`** | Show token/cost savings report with transparent calculations |
| **`HAM audit`** | Check health of your memory system |
| **`HAM dashboard`** | Launch the web dashboard to visualize token usage and savings |
| **`HAM sandwich`** | Same as above, but more fun to say |

## Dashboard

Say `HAM dashboard` (or `HAM sandwich`) to launch an interactive web dashboard at `http://localhost:7777` that visualizes your actual Claude Code session data.

The dashboard shows:

- **Token savings** — estimated tokens and cost saved by HAM, comparing HAM-on vs HAM-off sessions
- **Personalized insights** — AI-generated analysis of your usage patterns, cache efficiency, and coverage gaps
- **Daily trends** — charts of input tokens, cache reads, and cost over time
- **Directory breakdown** — which directories you work in most and their HAM adoption
- **Session history** — every session with model, duration, token counts, and HAM status
- **Context health** — which directories have `CLAUDE.md` files (green), which are stale (amber), and which are missing them (red)

Data is parsed directly from Claude Code's session JSONL files at `~/.claude/projects/` — no external services, no database.

### Manual launch

If you want to run the dashboard outside of Claude Code:

```bash
# From your project directory
node ~/.claude/skills/ham/dashboard/launch.js [--port 8080]
```

The launcher auto-installs dependencies and builds the frontend on first run. Default port is 7777.

---

## License

MIT

---

**Built by [@kromahlusenii-ops](https://github.com/kromahlusenii-ops)**

*Saving tokens. Saving money. Saving energy.*
