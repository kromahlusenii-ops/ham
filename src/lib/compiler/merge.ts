import type { NormalizedEntry, Target, ConflictBlock } from "./types";
import { detectConflicts, resolveConflict } from "./conflicts";

/**
 * Precedence matrix: target-specific source ordering.
 * Higher index = higher priority (last wins).
 */
const PRECEDENCE: Record<Target, string[]> = {
  cursor: ["copilot", "gemini", "aider", "llama", "manus", "claude", "ham", "cursor"],
  claude: ["copilot", "gemini", "aider", "llama", "manus", "cursor", "ham", "claude"],
  gemini: ["copilot", "cursor", "aider", "llama", "manus", "claude", "ham", "gemini"],
  aider: ["copilot", "cursor", "gemini", "llama", "manus", "claude", "ham", "aider"],
  copilot: ["cursor", "gemini", "aider", "llama", "manus", "claude", "ham", "copilot"],
  llama: ["copilot", "cursor", "gemini", "aider", "manus", "claude", "ham", "llama"],
  manus: ["copilot", "cursor", "gemini", "aider", "llama", "claude", "ham", "manus"],
  universal: ["copilot", "cursor", "gemini", "aider", "llama", "manus", "claude", "ham"],
};

const HAM_FIRST_ORDER = ["copilot", "cursor", "gemini", "aider", "llama", "manus", "claude", "ham"];

/**
 * R4 — Target-Specific Precedence.
 * Merge entries across sources, resolving conflicts by precedence.
 */
export function mergeAcrossSources(
  layeredEntries: NormalizedEntry[],
  target: Target,
  preset: "target-first" | "ham-first" | "advisory"
): { merged: NormalizedEntry[]; conflicts: ConflictBlock[] } {
  const precedenceOrder = preset === "ham-first"
    ? HAM_FIRST_ORDER
    : PRECEDENCE[target] ?? PRECEDENCE.universal;

  function getPriority(source: string): number {
    const idx = precedenceOrder.indexOf(source);
    return idx === -1 ? 0 : idx;
  }

  // Detect conflicts first
  const allConflicts = detectConflicts(layeredEntries);
  const resolvedConflicts = allConflicts.map((c) => resolveConflict(c, target));

  // Group keyed entries and resolve by precedence
  const keyedMap = new Map<string, NormalizedEntry>();
  const unkeyed: NormalizedEntry[] = [];

  // Sort by priority ascending (lowest first, highest wins)
  const sorted = [...layeredEntries].sort(
    (a, b) => getPriority(a.source) - getPriority(b.source)
  );

  for (const entry of sorted) {
    if (entry.key === "unkeyed.directive") {
      unkeyed.push(entry);
    } else {
      // Higher priority overwrites lower
      keyedMap.set(entry.key, entry);
    }
  }

  // In advisory mode, keep all entries (don't merge conflicts away)
  if (preset === "advisory") {
    return { merged: layeredEntries, conflicts: resolvedConflicts };
  }

  const merged = [...keyedMap.values(), ...unkeyed];

  return { merged, conflicts: resolvedConflicts };
}
