import type { NormalizedEntry } from "./types";

/** Priority ordering for budget compression (highest first). */
const KIND_PRIORITY: Record<string, number> = {
  constraint: 4,
  knowledge: 3,
  directive: 2,
  preference: 1,
};

const STRENGTH_BONUS: Record<string, number> = {
  hard: 1,
  soft: 0,
};

/** Estimate token count for a value. Uses byte-length / 4 (matches codebase pattern). */
function estimateTokens(value: string | boolean): number {
  const str = typeof value === "string" ? value : String(value);
  return Math.ceil(Buffer.byteLength(str, "utf-8") / 4);
}

/** Score an entry for priority sorting. Higher = kept first. */
function priorityScore(entry: NormalizedEntry): number {
  return (KIND_PRIORITY[entry.kind] ?? 0) + (STRENGTH_BONUS[entry.strength] ?? 0);
}

/**
 * R6 — Token Budget.
 * Deduplicates, then trims lowest-priority entries until under budget.
 */
export function compressToBudget(
  entries: NormalizedEntry[],
  budget: number
): {
  kept: NormalizedEntry[];
  dropped: NormalizedEntry[];
  tokenCount: number;
} {
  // Deduplicate: same key + same value across sources → keep highest priority
  const deduped = deduplicateEntries(entries);

  // Sort by priority descending (keep highest first)
  const sorted = [...deduped].sort((a, b) => priorityScore(b) - priorityScore(a));

  const kept: NormalizedEntry[] = [];
  const dropped: NormalizedEntry[] = [];
  let tokenCount = 0;

  for (const entry of sorted) {
    const entryTokens = estimateTokens(entry.value);
    if (tokenCount + entryTokens <= budget) {
      kept.push(entry);
      tokenCount += entryTokens;
    } else {
      dropped.push(entry);
    }
  }

  return { kept, dropped, tokenCount };
}

/** Remove duplicate facts: same key + same normalized value. Keep highest priority. */
function deduplicateEntries(entries: NormalizedEntry[]): NormalizedEntry[] {
  const seen = new Map<string, NormalizedEntry>();

  // Sort by priority descending so first occurrence is highest priority
  const sorted = [...entries].sort((a, b) => priorityScore(b) - priorityScore(a));

  for (const entry of sorted) {
    if (entry.key === "unkeyed.directive") {
      // Deduplicate unkeyed by exact value
      const dedupKey = `unkeyed:${typeof entry.value === "string" ? entry.value.toLowerCase() : entry.value}`;
      if (!seen.has(dedupKey)) {
        seen.set(dedupKey, entry);
      }
    } else {
      // Deduplicate keyed by key + normalized value
      const normalVal = typeof entry.value === "string" ? entry.value.toLowerCase() : String(entry.value);
      const dedupKey = `${entry.key}:${normalVal}`;
      if (!seen.has(dedupKey)) {
        seen.set(dedupKey, entry);
      }
    }
  }

  return Array.from(seen.values());
}
