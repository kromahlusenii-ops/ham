# Setup And Scopes

Use this reference when creating or updating file-based HAM memory.

## File Model

HAM in this repo shape uses:

- `CLAUDE.md` for root and scoped working context
- `.memory/decisions.md` for accepted architectural decisions
- `.memory/patterns.md` for reusable implementation patterns
- `.memory/inbox.md` for unconfirmed observations
- `.memory/audit-log.md` for audit summaries
- `.memory/baseline.json` for before/after savings comparison
- `.ham/version` and `.ham/metrics/state.json` for versioning and baseline mode

## Scope Selection

- Root `CLAUDE.md`: stack, global rules, shared workflows
- Scoped `CLAUDE.md`: subtree-specific purpose, conventions, integrations, patterns, gotchas
- Deeply nested `CLAUDE.md`: only when a nested area has distinct rules that would otherwise cause mistakes

Prefer fewer scoped files with high signal over a large number of thin files.

## Setup Sequence

1. Inspect the repo structure and main platform boundaries.
2. Read any existing `CLAUDE.md`, `.memory/*`, `.ham/*`, and `.gitignore` before editing.
3. Create or update the root `CLAUDE.md`.
4. Add scoped `CLAUDE.md` files only in major code areas with distinct guidance.
5. Seed `.memory/decisions.md` with durable architectural choices already visible in the repo.
6. Seed `.memory/patterns.md` with conventions likely to recur.
7. Put speculative findings in `.memory/inbox.md`.
8. Preserve user edits and merge instead of replacing.

## Scoped CLAUDE Heuristic

Create a scoped `CLAUDE.md` only if at least one of these is true:

- The directory has its own conventions or integration rules.
- A future agent is likely to make the wrong change there without local guidance.
- Keeping the detail in root `CLAUDE.md` would bloat the global context.

## Memory Quality Bar

Good HAM memory is:

- short enough to scan quickly
- specific enough to change implementation choices
- stable enough to survive multiple sessions
- scoped narrowly enough to avoid polluting unrelated work

Do not store:

- step-by-step task transcripts
- temporary debugging notes that will go stale immediately
- secrets, credentials, personal data, or copied large source files
- generic advice Codex already knows
