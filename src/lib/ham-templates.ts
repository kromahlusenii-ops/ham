export interface RepoContext {
  name: string;
  description: string | null;
}

export function generateRootClaudeMd(ctx: RepoContext): string {
  const desc = ctx.description ? `\n${ctx.description}\n` : "";
  return `# ${ctx.name}
${desc}
## Stack
<!-- Fill in your project's tech stack -->

## Rules
<!-- Add project-specific rules for AI agents -->

## Context Routing

<!-- Point agents to subdirectory CLAUDE.md files -->
<!-- Example: → src: src/CLAUDE.md -->

## Agent Memory System

### Before Working
- Read this file for global context
- Check .memory/decisions.md before architectural changes
- Check .memory/patterns.md before implementing common functionality

### After Work
- Update relevant CLAUDE.md if conventions changed
- Log decisions to .memory/decisions.md (ADR format)
- Log patterns to .memory/patterns.md
- Uncertain inferences → .memory/inbox.md (never canonical files)

### Safety
- Never record secrets, API keys, or user data
- Never overwrite decisions — mark as [superseded]
- Never promote from inbox without user confirmation
`;
}

export function generateDecisionsMd(): string {
  return `# Architecture Decision Records

## Template

### ADR-NNN: Title
- **Status**: proposed | accepted | superseded
- **Date**: YYYY-MM-DD
- **Context**: What prompted this decision?
- **Decision**: What was decided?
- **Consequences**: What are the trade-offs?

---

<!-- Add decisions below -->
`;
}

export function generatePatternsMd(): string {
  return `# Patterns & Conventions

## Template

### Pattern: Name
- **When**: When to apply this pattern
- **Do**: The recommended approach
- **Don't**: Common mistakes to avoid
- **Example**: Brief code or config example

---

<!-- Add patterns below -->
`;
}

export function generateInboxMd(): string {
  return `# Inbox — Unverified Observations

> Items here are uncertain inferences from AI agents.
> Do NOT promote to decisions.md or patterns.md without human confirmation.

---

<!-- Add observations below -->
`;
}

const INIT_FILES: Record<string, (ctx: RepoContext) => string> = {
  "CLAUDE.md": generateRootClaudeMd,
  ".memory/decisions.md": () => generateDecisionsMd(),
  ".memory/patterns.md": () => generatePatternsMd(),
  ".memory/inbox.md": () => generateInboxMd(),
};

export function getInitFiles(
  ctx: RepoContext,
  existingPaths: string[],
): Record<string, string> {
  const result: Record<string, string> = {};
  const existing = new Set(existingPaths);

  for (const [path, generator] of Object.entries(INIT_FILES)) {
    if (!existing.has(path)) {
      result[path] = generator(ctx);
    }
  }

  return result;
}
