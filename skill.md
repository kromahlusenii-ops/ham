---
name: hierarchical-agent-memory
description: Set up and maintain a hierarchical CLAUDE.md memory system that reduces agent token spend by scoping context to the directory level. Works across all platforms — web (Next.js, Nuxt, SvelteKit), iOS (Swift/SwiftUI), Android (Kotlin/Compose), Flutter, React Native, Python, Rust, Go. Use this skill whenever the user mentions agent memory, CLAUDE.md optimization, token spend reduction, context management for AI coding agents, setting up project memory, or wants to organize their codebase for better AI agent performance. Also trigger when users mention their agent keeps forgetting things, re-proposing rejected solutions, or burning tokens re-reading the same files every session — regardless of whether the project is web or mobile.
---

# Hierarchical Agent Memory

Zero-dependency, file-based memory system. Scopes agent context to the directory level instead of loading one massive root file on every request.

## System Architecture

Three layers:

**Layer 1 — Root CLAUDE.md** (always loaded, under 250 tokens)
Tech stack, hard rules, operating instructions. No implementation details.

**Layer 2 — Subdirectory CLAUDE.md files** (loaded per-directory, under 300 tokens each)
Scoped context per major directory. Agent reads root + target directory file only.

**Layer 3 — .memory/ directory** (referenced on demand)
- `decisions.md` — Confirmed Architecture Decision Records
- `patterns.md` — Confirmed reusable code patterns
- `inbox.md` — Quarantine for inferred items awaiting developer confirmation
- `sessions/YYYY-MM-DD.md` — Disposable session scratchpads

Never write inferred knowledge directly to `decisions.md` or `patterns.md`. All inferences go to `inbox.md` and stay there until the developer explicitly confirms them.

```
project-root/
├── CLAUDE.md                     # Layer 1: Global (~150-250 tokens)
├── .memory/
│   ├── decisions.md              # Confirmed ADRs
│   ├── patterns.md               # Confirmed patterns
│   ├── inbox.md                  # Inferred items awaiting confirmation
│   └── sessions/
│       └── YYYY-MM-DD.md         # Session scratchpads (disposable)
├── src/
│   ├── CLAUDE.md                 # Layer 2: Shared src conventions
│   ├── api/
│   │   └── CLAUDE.md             # API-specific context
│   ├── components/
│   │   └── CLAUDE.md             # UI component context
│   ├── lib/
│   │   └── CLAUDE.md             # Utilities & shared logic
│   └── db/
│       └── CLAUDE.md             # Database & schema context
└── ...
```

This is the web structure. For iOS, Android, Flutter, and React Native directory structures, read `references/platforms.md`.

## Setup Flow

### Step 1: Detect Platform and Maturity

Detect the platform first, then determine project maturity.

| Signal Files | Platform |
|---|---|
| `*.xcodeproj`, `*.xcworkspace`, `Package.swift` | iOS (Swift/SwiftUI) |
| `build.gradle`, `build.gradle.kts`, `settings.gradle` | Android (Kotlin) |
| `pubspec.yaml` | Flutter |
| `react-native.config.js`, `metro.config.js`, or `package.json` with `react-native` | React Native |
| `package.json` with `next`, `nuxt`, `svelte`, `remix`, or `astro` | Web (JS/TS Framework) |
| `package.json` with `express`, `fastify`, `hono`, or `koa` | Web (Node Backend) |
| `pyproject.toml`, `requirements.txt` with `django`, `flask`, or `fastapi` | Python Web |
| `Cargo.toml` | Rust |
| `go.mod` | Go |

If multiple signals exist (e.g., `package.json` + `ios/` + `android/`), treat as cross-platform.

Determine maturity by checking the platform's source directory (see `references/platforms.md` for source directory per platform):
- Source directory has multiple subdirectories with code → **Brownfield**
- Source directory has fewer than 3 subdirectories with code → **Early Stage**
- No source directory, or user says starting fresh → **Greenfield**

### Step 2: Run the Appropriate Setup Path

#### Path A: Greenfield (New Project)

1. Ask the user for their stack (framework, language, database, deployment target).
2. Generate root `CLAUDE.md` using the platform-specific template from `references/templates.md`. Populate with declared stack, default rules, and operating instructions.
3. Generate `.memory/decisions.md` — empty, structured with ADR format header and one example entry.
4. Generate `.memory/patterns.md` — empty, structured with pattern format header and one example entry.
5. Generate `.memory/inbox.md` — empty, with header: "Items here are inferred or unconfirmed. Promote to decisions.md or patterns.md when confirmed. Delete if incorrect."
6. Generate `.memory/sessions/` — empty directory with `.gitkeep`.
7. Do NOT create subdirectory CLAUDE.md files. Operating instructions tell the agent to create them as directories are created.

Tell the user the system grows with the project — the agent creates CLAUDE.md files in new directories automatically.

#### Path B: Early Stage (2-4 weeks in)

1. Scan: project config, directory structure, existing CLAUDE.md or agent config files. Identify stack, conventions, top 2-3 directories.
2. Generate root `CLAUDE.md` — lean, accurate stack, operating instructions.
3. Generate `.memory/inbox.md` — pre-populate with 3-5 inferred decisions. Tell user to review and promote.
4. Generate `.memory/decisions.md` — empty, structured. Only populated via inbox promotion.
5. Generate `.memory/patterns.md` — extract 2-3 high-confidence patterns (consistent across multiple files). Put uncertain patterns in inbox.
6. Generate subdirectory `CLAUDE.md` files for the 2-3 directories with meaningful code only.
7. If existing root `CLAUDE.md` exceeds ~400 tokens, decompose: move specifics to subdirectory files, trim root to stack + rules + operating instructions. Show user before/after.

#### Path C: Brownfield (Established Project)

1. Analyze the codebase. For platform-specific analysis checklists (what to look for in iOS, Android, Flutter, RN, web), read `references/platforms.md`.
2. Generate root `CLAUDE.md` — lean, accurate stack, operating instructions.
3. Generate `.memory/inbox.md` — populate with every inferred decision and pattern. Include for each: what was chosen, why (inferred), alternatives likely considered, confidence level (high/medium/low).
4. Generate `.memory/decisions.md` — empty, structured. Only populated via inbox promotion.
5. Generate `.memory/patterns.md` — populate only with high-confidence patterns (consistent across 3+ files). All others go in inbox.
6. Generate subdirectory `CLAUDE.md` files for every major directory with meaningful code.
7. If existing CLAUDE.md/agent config is bloated, decompose into the hierarchical system. Show before/after token comparison. Preserve all information.
8. Present all files and walk user through inbox review. Explain promotion process: confirm → move to canonical file, reject → delete, revise → edit then promote.

## Operating Instructions

Embed this block in the root `CLAUDE.md` of every project. This is the mechanism that makes the system self-maintaining.

```markdown
## Agent Memory System

### Before Working
1. Read this file first for global context.
2. Read the target directory's CLAUDE.md before making changes there.
3. If a task spans multiple directories, read each affected directory's CLAUDE.md (limit 3). If more than 3, read the closest shared parent CLAUDE.md plus root.
4. Check .memory/decisions.md before proposing architectural changes.
5. Check .memory/patterns.md before implementing common functionality.

### During Work
6. When creating a new directory under [source root], create a CLAUDE.md in it documenting:
   - Purpose of this directory
   - Conventions specific to this directory
   - Active integrations or dependencies
   - Patterns unique to this area

### After Work
7. If you changed conventions, patterns, or architecture: update memory. If nothing changed, don't.
8. Log new conventions/patterns to the relevant directory's CLAUDE.md.
9. Log architectural decisions to .memory/decisions.md using the ADR format.
10. Log reusable patterns to .memory/patterns.md.
11. Never delete or overwrite confirmed decisions. Mark as [superseded] and add a new entry.
12. If uncertain about an inference, write to .memory/inbox.md — never to canonical files.

### Memory Safety
- Never record API keys, secrets, user data, or customer information.
- Never record speculative debugging hypotheses outside session scratchpads.
- Never overwrite confirmed decisions — only supersede with new entries.
- Never promote items from inbox.md without explicit developer confirmation.
```

Replace `[source root]` with the platform's source directory:

| Platform | Source Root |
|---|---|
| Web | `src/` |
| iOS | `Features/` and `Core/` |
| Android | `features/` and `core/` |
| Flutter | `lib/features/` and `lib/core/` |
| React Native | `src/features/` and `src/core/` |

For cross-platform projects, also include `ios/` and `android/`.

## Memory Audit

When the user says "audit memory" or "check memory health," run these checks:

1. **Missing files:** Find directories under source root containing code but no CLAUDE.md.
2. **Oversized files:** Flag root CLAUDE.md over ~60 lines or subdirectory files over ~75 lines.
3. **Stale inbox:** If `.memory/inbox.md` has content, remind user to review and promote or delete.
4. **Bloated memory:** Flag `decisions.md` or `patterns.md` exceeding ~100 entries. Suggest archiving superseded decisions to `decisions-archive.md`.
5. **Orphaned references:** Check if subdirectory CLAUDE.md files reference patterns, integrations, or conventions that no longer exist.

Present as a checklist. Do not auto-fix — the developer decides.

## File Templates

Read `references/templates.md` for starter templates: root CLAUDE.md (per platform), subdirectory CLAUDE.md, decisions.md, patterns.md, inbox.md, and session scratchpad. Use these when generating files.

## Maintenance

### Token Budget
- Root `CLAUDE.md`: under 250 tokens (~60 lines). If growing, move content to subdirectory files or `.memory/`.
- Subdirectory `CLAUDE.md`: under 300 tokens (~75 lines). If growing, split the directory or reduce detail.
- `decisions.md`: archive superseded entries to `decisions-archive.md` past ~100 entries.
- `patterns.md`: keep code examples minimal — just enough to implement correctly.
- `inbox.md`: review weekly. Items older than a week should be confirmed or deleted.

Actual savings vary — agents still read source files. The consistent gain is reduced re-orientation and eliminated repeated architecture debates.

### Inbox Review
The inbox is the trust boundary. Review periodically:
- **Confirm:** Move to `decisions.md` or `patterns.md`, delete from inbox.
- **Reject:** Delete. Optionally note in directory CLAUDE.md to prevent re-inference.
- **Revise:** Edit to be accurate, then promote.

Empty inbox = healthy system. Growing inbox = the agent needs guidance.

### Team Safety
- Prefer append-only edits — add new entries, don't rewrite old ones.
- Mark superseded decisions rather than deleting (preserves history, avoids merge conflicts).
- Each developer uses their own session scratchpads in `.memory/sessions/`.
- On merge conflicts, prefer the version with more information.
