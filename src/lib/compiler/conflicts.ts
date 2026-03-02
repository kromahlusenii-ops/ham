import type { NormalizedEntry, ConflictBlock, Target } from "./types";

/**
 * R5 — Conflict Detection.
 * Triggers when same kind + same key + overlapping scope + different value.
 * Strict string equality for v1 (deliberately over-reports).
 */
export function detectConflicts(entries: NormalizedEntry[]): ConflictBlock[] {
  const conflicts: ConflictBlock[] = [];

  // Group entries by key (skip unkeyed directives)
  const byKey = new Map<string, NormalizedEntry[]>();
  for (const entry of entries) {
    if (entry.key === "unkeyed.directive") continue;
    const group = byKey.get(entry.key) ?? [];
    group.push(entry);
    byKey.set(entry.key, group);
  }

  for (const [key, group] of byKey) {
    if (group.length < 2) continue;

    // Compare all pairs for conflicting values
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const a = group[i];
        const b = group[j];

        // Same source doesn't conflict (already resolved in layering)
        if (a.source === b.source) continue;

        // Same value → no conflict
        const aVal = typeof a.value === "string" ? a.value.toLowerCase() : String(a.value);
        const bVal = typeof b.value === "string" ? b.value.toLowerCase() : String(b.value);
        if (aVal === bVal) continue;

        // Overlapping scope check (one is ancestor of the other, or same scope)
        if (!scopesOverlap(a.scope, b.scope)) continue;

        conflicts.push({
          key,
          kind: a.kind,
          scope: a.depth >= b.depth ? a.scope : b.scope,
          winner: { value: a.value, source: a.source, rawRef: a.rawRef },
          loser: { value: b.value, source: b.source, rawRef: b.rawRef },
          suggestion: `Reconcile "${key}" between ${a.source} and ${b.source}. Consider updating one source to match the other.`,
        });
      }
    }
  }

  return conflicts;
}

/** Check if two scopes overlap (one is ancestor of the other, or same). */
function scopesOverlap(scopeA: string, scopeB: string): boolean {
  if (scopeA === scopeB) return true;
  if (scopeA === "") return true; // root overlaps everything
  if (scopeB === "") return true;
  return scopeB.startsWith(scopeA + "/") || scopeA.startsWith(scopeB + "/");
}

/**
 * Resolve a conflict by setting winner/loser based on target precedence.
 * Uses a simplified heuristic: target-matching source wins.
 */
export function resolveConflict(
  conflict: ConflictBlock,
  target: Target
): ConflictBlock {
  const winnerMatchesTarget = conflict.winner.source === target;
  const loserMatchesTarget = conflict.loser.source === target;

  // If loser matches target better, swap
  if (loserMatchesTarget && !winnerMatchesTarget) {
    return {
      ...conflict,
      winner: conflict.loser,
      loser: conflict.winner,
      suggestion: `Using ${conflict.loser.source} value for "${conflict.key}" (matches target: ${target}). Consider syncing ${conflict.winner.source}.`,
    };
  }

  // HAM source gets priority if neither matches target
  if (!winnerMatchesTarget && !loserMatchesTarget) {
    if (conflict.loser.source === "ham") {
      return {
        ...conflict,
        winner: conflict.loser,
        loser: conflict.winner,
        suggestion: `Using HAM canonical value for "${conflict.key}". Consider updating ${conflict.winner.source} to match.`,
      };
    }
  }

  return conflict;
}
