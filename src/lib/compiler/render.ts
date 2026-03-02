import type { NormalizedEntry, ConflictBlock, Target } from "./types";

/**
 * R7 — Target Rendering.
 * Produces formatted output per target tool.
 */
export function renderBundle(
  entries: NormalizedEntry[],
  conflicts: ConflictBlock[],
  target: Target
): string {
  switch (target) {
    case "claude":
      return renderClaude(entries, conflicts);
    case "cursor":
      return renderCursor(entries, conflicts);
    case "gemini":
      return renderGemini(entries, conflicts);
    case "aider":
      return renderAider(entries, conflicts);
    case "copilot":
      return renderCopilot(entries, conflicts);
    case "llama":
      return renderLlama(entries, conflicts);
    case "manus":
      return renderManus(entries, conflicts);
    case "universal":
    default:
      return renderUniversal(entries, conflicts);
  }
}

// ── Claude Format ────────────────────────────────────────────────────

function renderClaude(entries: NormalizedEntry[], conflicts: ConflictBlock[]): string {
  const lines: string[] = ["# Compiled Context (HAM)", ""];

  // Group by kind
  const constraints = entries.filter((e) => e.kind === "constraint");
  const directives = entries.filter((e) => e.kind === "directive");
  const knowledge = entries.filter((e) => e.kind === "knowledge");
  const preferences = entries.filter((e) => e.kind === "preference");

  if (constraints.length > 0) {
    lines.push("## Constraints", "");
    for (const e of constraints) {
      lines.push(`- ${formatValue(e)}`);
    }
    lines.push("");
  }

  if (knowledge.length > 0) {
    lines.push("## Context", "");
    for (const e of knowledge) {
      lines.push(`- ${formatValue(e)}`);
    }
    lines.push("");
  }

  if (directives.length > 0) {
    lines.push("## Directives", "");
    for (const e of directives) {
      lines.push(`- ${formatValue(e)}`);
    }
    lines.push("");
  }

  if (preferences.length > 0) {
    lines.push("## Preferences", "");
    for (const e of preferences) {
      lines.push(`- ${formatValue(e)}`);
    }
    lines.push("");
  }

  if (conflicts.length > 0) {
    lines.push(...renderConflictsSection(conflicts));
  }

  return lines.join("\n");
}

// ── Cursor Format ────────────────────────────────────────────────────

function renderCursor(entries: NormalizedEntry[], conflicts: ConflictBlock[]): string {
  const lines: string[] = ["# Rules (compiled by HAM)", ""];

  for (const entry of entries) {
    lines.push(`- ${formatValue(entry)}`);
  }

  if (conflicts.length > 0) {
    lines.push("", ...renderConflictsSection(conflicts));
  }

  return lines.join("\n");
}

// ── Gemini Format ────────────────────────────────────────────────────

function renderGemini(entries: NormalizedEntry[], conflicts: ConflictBlock[]): string {
  return renderClaude(entries, conflicts).replace("# Compiled Context (HAM)", "# Compiled Context (HAM for Gemini)");
}

// ── Aider Format ─────────────────────────────────────────────────────

function renderAider(entries: NormalizedEntry[], conflicts: ConflictBlock[]): string {
  const lines: string[] = ["# Compiled directives (HAM)", ""];

  const keyed = entries.filter((e) => e.key !== "unkeyed.directive");
  const unkeyed = entries.filter((e) => e.key === "unkeyed.directive");

  if (keyed.length > 0) {
    for (const entry of keyed) {
      lines.push(`${entry.key}: ${formatValue(entry)}`);
    }
    lines.push("");
  }

  if (unkeyed.length > 0) {
    lines.push("# Additional directives");
    for (const entry of unkeyed) {
      lines.push(`- ${formatValue(entry)}`);
    }
    lines.push("");
  }

  if (conflicts.length > 0) {
    lines.push(...renderConflictsSection(conflicts));
  }

  return lines.join("\n");
}

// ── Copilot Format ───────────────────────────────────────────────────

function renderCopilot(entries: NormalizedEntry[], conflicts: ConflictBlock[]): string {
  return renderClaude(entries, conflicts).replace("# Compiled Context (HAM)", "# Compiled Context (HAM for Copilot)");
}

// ── Llama Format ─────────────────────────────────────────────────────

function renderLlama(entries: NormalizedEntry[], conflicts: ConflictBlock[]): string {
  return renderClaude(entries, conflicts).replace("# Compiled Context (HAM)", "# Compiled Context (HAM for Llama)");
}

// ── Manus Format ─────────────────────────────────────────────────────

function renderManus(entries: NormalizedEntry[], conflicts: ConflictBlock[]): string {
  return renderClaude(entries, conflicts).replace("# Compiled Context (HAM)", "# Compiled Context (HAM for Manus)");
}

// ── Universal Format ─────────────────────────────────────────────────

function renderUniversal(entries: NormalizedEntry[], conflicts: ConflictBlock[]): string {
  const lines: string[] = ["# Compiled Context (HAM — Universal)", ""];

  const grouped = groupByScope(entries);

  for (const [scope, scopeEntries] of grouped) {
    const displayScope = scope || "/";
    lines.push(`## ${displayScope}`, "");
    for (const entry of scopeEntries) {
      const prefix = entry.strength === "hard" ? "[MUST] " : "";
      lines.push(`- ${prefix}${formatValue(entry)}  _(${entry.source})_`);
    }
    lines.push("");
  }

  if (conflicts.length > 0) {
    lines.push(...renderConflictsSection(conflicts));
  }

  return lines.join("\n");
}

// ── Shared Utilities ─────────────────────────────────────────────────

function formatValue(entry: NormalizedEntry): string {
  if (typeof entry.value === "boolean") {
    return entry.key;
  }
  return entry.value;
}

function groupByScope(entries: NormalizedEntry[]): Map<string, NormalizedEntry[]> {
  const map = new Map<string, NormalizedEntry[]>();
  for (const entry of entries) {
    const group = map.get(entry.scope) ?? [];
    group.push(entry);
    map.set(entry.scope, group);
  }
  return map;
}

function renderConflictsSection(conflicts: ConflictBlock[]): string[] {
  const lines: string[] = [];
  lines.push("---", "## Conflicts Detected", "");
  for (const c of conflicts) {
    lines.push(`### \`${c.key}\` (${c.kind})`);
    lines.push(`- **Winner**: \`${c.winner.value}\` _(${c.winner.source}, ${c.winner.rawRef})_`);
    lines.push(`- **Loser**: \`${c.loser.value}\` _(${c.loser.source}, ${c.loser.rawRef})_`);
    lines.push(`- **Suggestion**: ${c.suggestion}`);
    lines.push("");
  }
  return lines;
}
