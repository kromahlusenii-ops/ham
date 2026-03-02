import { createHash } from "crypto";
import type {
  ContextFile,
  Target,
  CompileConfig,
  CompileResult,
  CompileReport,
  Source,
} from "./types";
import { createDefaultConfig } from "./config";
import { discoverForPath } from "./discovery";
import { parseFile } from "./importers";
import { layerEntries } from "./layering";
import { mergeAcrossSources } from "./merge";
import { compressToBudget } from "./compress";
import { renderBundle } from "./render";

/**
 * Main pipeline orchestrator.
 * Executes 7 stages: DISCOVER → PARSE → LAYER → MERGE → RESOLVE → COMPRESS → RENDER
 */
export function compile(
  files: ContextFile[],
  targetPath: string,
  target: Target,
  config?: Partial<CompileConfig>
): CompileResult {
  const cfg = createDefaultConfig(config);

  // 1. DISCOVER — filter files to target path ancestry
  const discovered = discoverForPath(files, targetPath);

  // Filter by enabled importers
  const filtered = discovered.filter((f) =>
    cfg.enabledImporters.includes(f.source)
  );

  // 2. PARSE — run importers on each file
  const allEntries = filtered.flatMap((f) => parseFile(f));

  // 3. LAYER — depth-first ordering within each source
  const layered = layerEntries(allEntries);

  // 4+5. MERGE + RESOLVE — cross-source precedence + conflict detection
  const { merged, conflicts } = mergeAcrossSources(
    layered,
    target,
    cfg.precedencePreset
  );

  // 6. COMPRESS — enforce token budget
  const { kept, tokenCount } = compressToBudget(merged, cfg.defaultBudget);

  // 7. RENDER — produce target-specific output
  const bundle = renderBundle(kept, conflicts, target);

  // Build source summary
  const sourceMap = new Map<Source, { entries: number; files: Set<string> }>();
  for (const entry of kept) {
    const existing = sourceMap.get(entry.source) ?? { entries: 0, files: new Set<string>() };
    existing.entries++;
    const filePath = entry.rawRef.split(":")[0];
    existing.files.add(filePath);
    sourceMap.set(entry.source, existing);
  }

  const report: CompileReport = {
    target,
    targetPath,
    conflicts,
    includedEntries: kept.length,
    tokenCount,
    budgetUsed: cfg.defaultBudget > 0 ? Math.round((tokenCount / cfg.defaultBudget) * 100) : 0,
    sources: Array.from(sourceMap.entries()).map(([source, data]) => ({
      source,
      entries: data.entries,
      files: Array.from(data.files),
    })),
  };

  // Deterministic cache key from inputs
  const cacheKey = createHash("sha256")
    .update(
      JSON.stringify({
        files: filtered.map((f) => f.path).sort(),
        targetPath,
        target,
        budget: cfg.defaultBudget,
      })
    )
    .digest("hex")
    .slice(0, 16);

  return { bundle, report, cacheKey };
}
