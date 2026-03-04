# HAM Skill ↔ HAM Pro Integration Plan

**Created:** 2026-03-04
**Status:** Proposed
**Context:** When HAM was removed from a project, the skill deleted AGENTS.md files that HAM Pro had created through its dashboard UI. The skill had no awareness of Pro or its files. This plan fixes the boundary between skill and Pro so they don't step on each other.

---

## Problem

1. **HAM Pro creates files the skill doesn't know about** — Pro's dashboard UI scaffolds AGENTS.md files for multi-agent support (Cursor, Copilot, Windsurf, Gemini, etc.). The skill's SKILL.md has zero mention of these files.
2. **No `ham remove` command** — users must manually ask the agent to delete HAM, which leads to guesswork about what to keep vs. delete.
3. **`go ham` overwrites Pro scaffolds** — the skill creates CLAUDE.md files from scratch without checking if Pro already generated them.
4. **No handshake between skill and Pro** — neither product knows the other is active.

---

## Ownership Boundaries

| Artifact | Owner | The other product should... |
|----------|-------|-----------------------------|
| `CLAUDE.md` files | **HAM Skill** | Pro: read for health checks, never write |
| `AGENTS.md` files | **HAM Pro** | Skill: never touch (create, modify, or delete) |
| `.memory/` directory | **HAM Skill** | Pro: ignore entirely |
| `.ham/version` | **HAM Skill** | Pro: ignore |
| `.ham/metrics/` | **HAM Skill** | Pro: ignore |
| `.ham/config.json` | **HAM Pro** | Skill: read only (for Pro detection) |
| Root CLAUDE.md memory sections | **HAM Skill** | Pro: read for health checks |
| Dashboard file scaffolding UI | **HAM Pro** | Skill: defer to Pro-created files |

---

## Tasks

### HAM Skill Changes

#### 1. Add Pro detection to HAM skill
**Priority:** High — all other skill changes depend on this

When any HAM skill command runs (`go ham`, `ham route`, `ham remove`, etc.), check for Pro signals:
- Does `.ham/config.json` exist with `enabledImporters` containing more than just `"claude"`?
- Do any `AGENTS.md` files exist in the project?
- Is there a `"pro": true` flag in config?

If Pro is detected, print: `HAM Pro detected — skill will only manage CLAUDE.md files`

#### 2. Document AGENTS.md in SKILL.md
**Priority:** High

Add a `## HAM Pro Compatibility` section to SKILL.md explaining:
- AGENTS.md files exist and are created by HAM Pro (not the skill)
- They are multi-agent context files (Cursor, Copilot, Windsurf, Gemini, etc.)
- The skill must NEVER create, modify, or delete AGENTS.md files
- Ownership boundary: skill owns CLAUDE.md, Pro owns AGENTS.md

#### 3. Make `go ham` respect existing Pro scaffolds
**Priority:** Medium — blocked by #1 and Pro task #2
**Blocked by:** Task #1 (Pro detection), Pro Task #2 (manifest)

When `go ham` runs and Pro is detected:
1. Check the manifest in `.ham/config.json` for Pro-created CLAUDE.md files
2. If a CLAUDE.md already exists from Pro, skip it or merge (don't overwrite)
3. Only create CLAUDE.md files for directories Pro hasn't already covered
4. Never touch AGENTS.md files
5. Print summary: `Skipped X directories already scaffolded by HAM Pro`

#### 4. Add `ham remove` command
**Priority:** Medium — blocked by #1 and #2
**Blocked by:** Task #1 (Pro detection), Task #2 (docs)

New command for safe removal with dry-run:
```
WILL DELETE (skill-owned):
  .memory/decisions.md, .memory/patterns.md, .memory/inbox.md, .memory/audit-log.md
  .ham/metrics/, .ham/version
  Agent Memory System + Context Routing sections in root CLAUDE.md
  15 subdirectory CLAUDE.md files

WILL KEEP (Pro-owned or user files):
  .ham/config.json
  app/AGENTS.md, lib/AGENTS.md, components/AGENTS.md, docs/AGENTS.md
  Root CLAUDE.md (Stack, Rules, Commands sections)
```

Ask user to confirm before executing. Add `"ham remove"` as a trigger phrase in SKILL.md frontmatter.

---

### HAM Pro Changes

#### 1. Add `pro: true` flag to config output
**Priority:** High

HAM Pro's scaffold/UI should write `"pro": true` to `.ham/config.json` when it creates files. This is the handshake signal the skill reads.

```json
{
  "pro": true,
  "hamVersion": "1.0.0",
  "enabledImporters": ["ham", "claude", "cursor", "gemini", "aider", "copilot", "llama", "manus"]
}
```

#### 2. Add scaffolded file manifest to config
**Priority:** High

Track which files Pro created so both skill and Pro know what exists:

```json
{
  "pro": true,
  "scaffolded": {
    "claude": ["app/CLAUDE.md", "lib/CLAUDE.md", "components/CLAUDE.md", "docs/CLAUDE.md"],
    "agents": ["app/AGENTS.md", "lib/AGENTS.md", "components/AGENTS.md", "docs/AGENTS.md"]
  }
}
```

This prevents the skill from overwriting Pro-created CLAUDE.md files and makes removal safe.

#### 3. Define ownership boundaries in Pro docs
**Priority:** Medium

Add documentation to HAM Pro's repo mirroring the ownership table above, so both teams reference the same contract.

---

## Dependency Chain

```
Parallel start:
  Skill #1 (Pro detection)
  Skill #2 (Document AGENTS.md)
  Pro #1 (pro flag)
  Pro #2 (manifest)

Then:
  Skill #1 + Pro #2  →  Skill #3 (go ham respects Pro)
  Skill #1 + Skill #2  →  Skill #4 (ham remove)
```

---

## Verification

After implementation, these scenarios should work correctly:

1. **Pro scaffolds first, then skill runs `go ham`** — skill detects Pro, skips Pro-created CLAUDE.md files, creates missing ones only, never touches AGENTS.md
2. **User runs `ham remove`** — skill shows dry-run, deletes only skill-owned files, preserves AGENTS.md and .ham/config.json
3. **Skill runs without Pro** — everything works as before, no behavioral change
4. **Pro runs without skill** — Pro manages all files independently, .ham/config.json has `"pro": true` ready for skill if installed later
