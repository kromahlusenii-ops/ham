import type { NormalizedEntry } from "./types";

/**
 * R3 — Depth-First Ordering.
 * For each source independently, order entries by directory depth (root = base, deeper = override).
 * Within the same source, deeper entries for the same key override shallower ones.
 */
export function layerEntries(entries: NormalizedEntry[]): NormalizedEntry[] {
  // Group by source
  const bySource = new Map<string, NormalizedEntry[]>();

  for (const entry of entries) {
    const group = bySource.get(entry.source) ?? [];
    group.push(entry);
    bySource.set(entry.source, group);
  }

  const result: NormalizedEntry[] = [];

  for (const [, sourceEntries] of bySource) {
    // Sort by depth ascending (root first, deeper later)
    const sorted = sourceEntries.sort((a, b) => a.depth - b.depth);

    // For keyed entries, deeper overrides shallower within same source
    const keyMap = new Map<string, NormalizedEntry>();
    const unkeyedEntries: NormalizedEntry[] = [];

    for (const entry of sorted) {
      if (entry.key === "unkeyed.directive") {
        unkeyedEntries.push(entry);
      } else {
        // Deeper entry overwrites shallower for the same key
        keyMap.set(entry.key, entry);
      }
    }

    result.push(...keyMap.values(), ...unkeyedEntries);
  }

  return result;
}
