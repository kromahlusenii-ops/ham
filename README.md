<p align="center">
  <img src="ham.png" alt="HAM" width="400">
</p>

# HAM (Hierarchical Agent Memory)

**For builders who can't waste a single token. Go HAM.**

A Claude Code skill that sets up and maintains a scoped memory system for AI coding agents. Instead of one massive `CLAUDE.md` that loads on every request, this creates a tree of lightweight context files — each containing only what the agent needs for the directory it's working in.

## The Problem

Every agent session without scoped memory burns tokens on:
- Re-reading your project structure to get oriented
- Re-discovering conventions it already learned
- Re-proposing decisions you already made and rejected
- Loading context irrelevant to the current task

**Token impact:**

| Approach | Tokens per Request |
|---|---|
| No memory (agent discovers everything) | 5,000 – 15,000 |
| Single root CLAUDE.md | 2,000 – 4,000 |
| Hierarchical memory | 300 – 800 |

Over 50 prompts in a session, that's 100K–500K fewer tokens.

## How It Works

Three layers:

1. **Root `CLAUDE.md`** (~150-250 tokens) — Stack, hard rules, and operating instructions. No implementation details.
2. **Subdirectory `CLAUDE.md` files** — Scoped context per directory. The API folder knows about auth patterns and response formats. The components folder knows about styling conventions. Nothing else.
3. **`.memory/` directory** — Architecture Decision Records (`decisions.md`), reusable patterns (`patterns.md`), and disposable session scratchpads.

The key: the operating instructions in the root file tell the agent to **create new `CLAUDE.md` files as it creates new directories**, and to **update existing files when it introduces new patterns or decisions**. The system is self-maintaining.

## Installation

### Manual Installation

```bash
# Clone into your Claude skills directory
git clone https://github.com/kromahlusenii-ops/ham.git ~/.claude/skills/ham
```

### Claude.ai

Upload the skill folder through Settings → Skills.

## Usage

### Commands

| Command | What it does |
|---|---|
| **`go ham`** | Set up HAM in your project (auto-detects everything) |
| **`HAM savings`** | Show token/cost savings report with transparent calculations |
| **`HAM audit`** | Check health of your memory system |
| **`HAM dashboard`** | Launch the web dashboard to visualize token usage and savings |
| **`HAM sandwich`** | Same as above, but more fun to say |

### Quick Start

```
> go ham
```

That's it. HAM auto-detects your platform (Web, iOS, Android, Flutter, React Native, Python, Rust, Go) and project maturity, then generates the appropriate structure.

### See Your Savings

```
> HAM savings
```

Shows exactly how many tokens you're saving per prompt, with full transparency on how the numbers are calculated — no black-box estimates.

## What Gets Generated

The structure adapts to your platform. Here's the web version:

```
your-project/
├── CLAUDE.md                     # Lean root: stack + rules + operating instructions
├── .memory/
│   ├── decisions.md              # Confirmed Architecture Decision Records
│   ├── patterns.md               # Confirmed reusable code patterns
│   ├── inbox.md                  # Inferred items awaiting your review
│   ├── audit-log.md              # Audit history (auto-maintained)
│   └── sessions/
│       └── YYYY-MM-DD.md         # Session scratchpads (disposable)
├── src/
│   ├── api/
│   │   └── CLAUDE.md             # API-specific context only
│   ├── components/
│   │   └── CLAUDE.md             # UI conventions only
│   └── db/
│       └── CLAUDE.md             # Schema & query patterns only
└── ...
```

And an iOS project:

```
MyApp/
├── CLAUDE.md                     # Swift version, min iOS, architecture pattern
├── .memory/
│   ├── decisions.md              # "SwiftData over Core Data", "MVVM not TCA"
│   ├── patterns.md               # Navigation, async/await, Combine patterns
│   ├── inbox.md                  # Inferred items awaiting your review
│   └── audit-log.md              # Audit history (auto-maintained)
├── MyApp/
│   ├── Features/
│   │   ├── Auth/
│   │   │   └── CLAUDE.md         # Auth flow, Keychain, biometrics
│   │   └── Feed/
│   │       └── CLAUDE.md         # Pagination, caching strategy
│   ├── Core/
│   │   ├── Networking/
│   │   │   └── CLAUDE.md         # API client, token refresh, error types
│   │   └── Persistence/
│   │       └── CLAUDE.md         # SwiftData models, migrations
│   └── UI/
│       └── CLAUDE.md             # Design system, theming
└── ...
```

Supported platforms: **Web (Next.js, Nuxt, SvelteKit, etc.)**, **iOS (Swift/SwiftUI)**, **Android (Kotlin/Compose)**, **Flutter**, **React Native**, **Python**, **Rust**, **Go**, and any codebase organized into directories.

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

## Self-Maintaining

The operating instructions embedded in the root `CLAUDE.md` tell the agent to:

1. **Before working** — Read the target directory's `CLAUDE.md` and check `.memory/decisions.md` before proposing changes. For multi-directory tasks, read up to 3 affected directories' files.
2. **During work** — Create a `CLAUDE.md` in any new directory it creates
3. **After work** — Update the relevant files when conventions, patterns, or architecture change. If the agent isn't sure about something, it goes in `.memory/inbox.md` — never directly into canonical memory.
4. **Periodic health checks** — After 10 sessions or 14 days without an audit, the agent suggests one during startup. Non-blocking — you can skip it.

You don't maintain this system. The agent does. You just review the inbox periodically and confirm or reject inferred items.

### Inference Quarantine

The agent will often infer decisions from your codebase ("looks like you chose Supabase over Firebase"). Instead of writing these directly into `decisions.md` where they'd silently become authoritative, all inferences go to `.memory/inbox.md`. You review, confirm what's correct, and delete what's wrong. Nothing becomes canonical without your sign-off.

### Memory Audit

Say `HAM audit` or let the agent remind you. After 10 sessions or 14 days without an audit, the agent suggests one during startup checks. It's a suggestion, not a requirement — skip it if you're in the middle of something.

The audit checks for:
- Directories missing `CLAUDE.md` files
- Oversized root or subdirectory files
- Unreviewed items sitting in the inbox
- Bloated decisions or patterns files needing archival
- Orphaned references to removed code

Audit results are logged in `.memory/audit-log.md` (last 5 entries kept).

## Compatibility

- **Claude Code** — Native support. Claude Code reads `CLAUDE.md` files walking up from the working directory.
- **Cursor** — Compatible. Rename files to `.cursorrules` or configure Cursor to read `CLAUDE.md`.
- **GitHub Copilot** — Compatible via `.github/copilot-instructions.md` for the root file.
- **Any agent that reads markdown context files** — The pattern is tool-agnostic.

## License

MIT
