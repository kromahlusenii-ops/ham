# Templates

Use these starter shapes when creating HAM files. Keep them short and adapt them to the actual repo.

## Root CLAUDE.md

```markdown
# Project: [Name]

## Stack
- Framework: [framework]
- Language: [language]
- Database: [database]
- Testing: [test stack]

## Critical Rules
- [global rule]
- [global rule]

## Agent Memory System

### Before Working
- Read this file for global context, then read the target directory's CLAUDE.md before changes
- If this file has a ## Context Routing section, use it to find the right scoped CLAUDE.md
- Check .memory/decisions.md before architectural changes
- Check .memory/patterns.md before implementing common functionality

### During Work
- Create CLAUDE.md in any new directory that needs distinct guidance

### After Work
- Update relevant CLAUDE.md if conventions changed
- Log decisions to .memory/decisions.md
- Log patterns to .memory/patterns.md
- Put uncertain inferences in .memory/inbox.md

### Safety
- Never record secrets, API keys, or user data
- Never overwrite decisions; mark them superseded
- Never promote from inbox without user confirmation
```

## Scoped CLAUDE.md

```markdown
# [Directory] Context

## Purpose
[One sentence]

## Conventions
- [local rule]

## Active Integrations
- [integration]: [note]

## Key Patterns
- [pattern]: [note]

## Gotchas
- [non-obvious warning]
```

## decisions.md

```markdown
### [Decision Title]
- **Status**: accepted
- **Date**: YYYY-MM-DD
- **Context**: [why the choice mattered]
- **Decision**: [chosen approach]
- **Alternatives**: [other options considered]
```

## patterns.md

```markdown
### [Pattern Title]
- **When**: [when to apply it]
- **Do**: [recommended implementation]
- **Don't**: [what to avoid]
```

## inbox.md

```markdown
# Inbox

Use this file for uncertain observations that still need review.

- [YYYY-MM-DD] [observation]
```
