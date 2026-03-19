


# HAM — Hierarchical Agent Memory
<p align="center">
  <img src="ham.png" alt="HAM" width="400">
</p>

**Fewer tokens. Greener AI.**

HAM is a memory system for AI coding agents that reduces token consumption by up to 80%. Instead of loading your entire project context on every request, HAM scopes memory to the directory you're actually working in.

Less tokens. Faster agents. Lower costs. Greener AI.

> HAM ships with a file-based skill for [Claude Code](https://docs.anthropic.com/en/docs/claude-code) and a Codex skill package in [`ham/`](./ham).

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
| **Context per prompt** | 4,000 - 12,000 tokens | 800 - 2,400 tokens |
| **50-prompt session** | 200K - 600K tokens | 40K - 120K tokens |
| **Context window used at start** | Up to 47% | Under 10% |
| **Token reduction** | — | **Up to 80%** |

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

## Installation

### Claude Code

```bash
git clone https://github.com/kromahlusenii-ops/ham.git ~/.claude/skills/ham
```

This installs HAM globally — it's available in every project you open with Claude Code.

### Add to a specific project only

If you prefer to scope HAM to a single project instead of installing it globally:

```bash
cd your-project
mkdir -p .claude/skills
git clone https://github.com/kromahlusenii-ops/ham.git .claude/skills/ham
```

Project-level skills live in `.claude/skills/` and are only active in that project.

### Codex

The Codex skill lives in [`ham/`](./ham).

Copy or install that folder into your Codex skills directory as `ham`, then invoke it with:

```text
$ham
```

The Codex version uses the same file-based HAM model:

- `CLAUDE.md` for root and scoped context
- `.memory/` for decisions, patterns, inbox, and audits
- `.ham/` for versioning and baseline metrics

## Quick Start

Open Claude Code in your project directory and say:

```
go ham
```

That's it. HAM auto-detects your stack, scans your project structure, and generates scoped `CLAUDE.md` files across your codebase. No manual setup required.

After setup, say `HAM savings` to see your token and cost reduction.

### Updating

```bash
cd ~/.claude/skills/ham && git pull
```

---

## How It Works

HAM follows three principles:

**Scope, don't dump.** Every piece of context lives in the most specific directory it applies to. Global conventions in root. API patterns in the API folder. Component rules in the components folder.

**Read small, read relevant.** The agent loads root context + the target directory's context. Two to three small files instead of the entire project.

**Self-maintaining memory.** Decision files and pattern logs update as the agent works. The root CLAUDE.md instructs the agent to read before coding and write before closing — context stays fresh without manual maintenance.

For Codex, the included [`ham/`](./ham) skill mirrors the same workflow using local files rather than MCP-specific behavior.

## Commands

### Setup
| Command | What it does |
|---|---|
| **`go ham`** | Set up HAM in your project (auto-detects everything) |
| **`ham update`** | Update HAM to the latest version |
| **`ham status`** | Show HAM version and setup status |
| **`ham route`** | Add/update Context Routing in root CLAUDE.md |

### Analytics
| Command | What it does |
|---|---|
| **`ham dashboard`** | Launch the web dashboard at localhost:7777 |
| **`ham savings`** | Show token and cost savings report |
| **`ham carbon`** | Show energy and CO2e efficiency stats |
| **`ham insights`** | Generate insights and write actionable items to inbox |

### Benchmarking
| Command | What it does |
|---|---|
| **`ham benchmark`** | Compare baseline vs HAM task performance |
| **`ham baseline start`** | Begin 10-task baseline capture (no HAM memory loading) |
| **`ham baseline stop`** | End baseline early, keep partial data |
| **`ham metrics clear`** | Delete all benchmark data |

### Maintenance
| Command | What it does |
|---|---|
| **`ham audit`** | Check memory system health |
| **`ham commands`** | Show all available commands |

## Dashboard

Say `HAM dashboard` (or `HAM sandwich`) to launch an interactive web dashboard at `http://localhost:7777` that visualizes your actual Claude Code session data.

The dashboard shows:

- **Token savings** — estimated tokens and cost saved by HAM, comparing HAM-on vs HAM-off sessions
- **Task benchmarking** — baseline vs HAM performance comparison on the Overview tab
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

## Git

HAM automatically adds its generated files to `.gitignore` during setup.
All HAM files are local to your machine — they won't be pushed to your repo.
`ham remove` cleans up the `.gitignore` entries.

---

## HAM Pro

Scale to your whole team — HAM Pro adds multi-agent support for Cursor, Copilot, Windsurf, Gemini, and more.

[Learn more →](https://goham.dev)

---

## License

MIT

---

**Built by [@kromahlusenii-ops](https://github.com/kromahlusenii-ops)**

*Saving tokens. Saving money. Saving energy.*
