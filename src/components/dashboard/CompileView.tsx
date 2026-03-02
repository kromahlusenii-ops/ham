"use client";

import { useState, useMemo } from "react";
import {
  Copy,
  Check,
  AlertTriangle,
  FileText,
  ChevronDown,
  ChevronUp,
  Settings2,
  Sparkles,
} from "lucide-react";
import type { MemoryFile, MemoryFileType } from "@/lib/types";
import { MEMORY_FILE_TYPE_CONFIG } from "@/lib/constants";
import type { CompileReport, ConflictBlock, Target } from "@/lib/compiler/types";

interface CompileResult {
  bundle: string;
  report: CompileReport;
  cacheKey: string;
}

const TARGET_LABELS: Record<Target, string> = {
  claude: "Claude",
  cursor: "Cursor",
  gemini: "Gemini",
  aider: "Aider",
  copilot: "Copilot",
  llama: "Llama",
  manus: "Manus",
  universal: "Universal",
};

/** Map MemoryFileType → compiler Target (where there's a direct mapping) */
const TYPE_TO_TARGET: Partial<Record<MemoryFileType, Target>> = {
  claude: "claude",
  cursor: "cursor",
  gemini: "gemini",
  copilot: "copilot",
  llama: "llama",
  manus: "manus",
  ham: "universal",
  agents: "universal",
  windsurf: "cursor",
};

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

/** Derive unique directory scopes from memory files */
function getScopes(files: MemoryFile[]): string[] {
  const dirs = new Set<string>();
  for (const f of files) {
    const parts = f.path.split("/");
    // Walk up and collect every ancestor directory
    for (let i = 1; i < parts.length; i++) {
      dirs.add(parts.slice(0, i).join("/"));
    }
  }
  return Array.from(dirs).sort();
}

export default function CompileView({
  repoId,
  files,
}: {
  repoId: string;
  files: MemoryFile[];
}) {
  const [loading, setLoading] = useState(false);
  const [loadingTarget, setLoadingTarget] = useState<Target | null>(null);
  const [result, setResult] = useState<CompileResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [customPath, setCustomPath] = useState("");
  const [customBudget, setCustomBudget] = useState(2000);
  const [reportOpen, setReportOpen] = useState(false);

  // Detect which tools are present in the repo
  const detectedTools = useMemo(() => {
    const toolMap = new Map<Target, { count: number; tokens: number }>();
    for (const f of files) {
      const target = TYPE_TO_TARGET[f.file_type];
      if (!target) continue;
      const existing = toolMap.get(target) ?? { count: 0, tokens: 0 };
      existing.count++;
      existing.tokens += f.token_count;
      toolMap.set(target, existing);
    }
    // Sort by file count descending, then add Universal at the end
    const entries = Array.from(toolMap.entries())
      .filter(([t]) => t !== "universal")
      .sort((a, b) => b[1].count - a[1].count);
    // Always offer Universal
    entries.push(["universal", { count: files.length, tokens: files.reduce((s, f) => s + f.token_count, 0) }]);
    return entries;
  }, [files]);

  const scopes = useMemo(() => getScopes(files), [files]);

  async function handleCompile(target: Target, path?: string, budget?: number) {
    setLoading(true);
    setLoadingTarget(target);
    setError(null);
    setResult(null);
    setReportOpen(false);

    try {
      const res = await fetch(`/api/repos/${repoId}/compile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetPath: path ?? customPath ?? "",
          target,
          budget: budget ?? customBudget,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? `Compile failed (${res.status})`);
      }

      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Compile failed");
    } finally {
      setLoading(false);
      setLoadingTarget(null);
    }
  }

  async function handleCopy() {
    if (!result) return;
    await navigator.clipboard.writeText(result.bundle);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Empty state — no files to compile
  if (files.length === 0) {
    return (
      <div className="rounded-lg border border-stone bg-white p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-silk">
          <Sparkles className="h-6 w-6 text-gray" />
        </div>
        <h3 className="text-lg font-semibold text-ink">No config files found</h3>
        <p className="mt-2 text-sm text-gray max-w-md mx-auto">
          The compiler needs AI tool config files to work with. Run a scan first,
          or initialize HAM to create the foundation files.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Tool Cards — one click to compile */}
      <div>
        <p className="text-xs font-medium text-gray mb-3">
          Pick a target tool to compile for
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {detectedTools.map(([target, info]) => {
            const isLoading = loading && loadingTarget === target;
            const isActive = result && result.report.target === target && !loading;
            return (
              <button
                key={target}
                onClick={() => handleCompile(target)}
                disabled={loading}
                className={`group relative rounded-lg border p-4 text-left transition-all cursor-pointer ${
                  isActive
                    ? "border-accent bg-accent/5 ring-1 ring-accent/20"
                    : "border-stone bg-white hover:border-accent/40 hover:shadow-sm"
                } disabled:opacity-60`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-ink">
                    {TARGET_LABELS[target]}
                  </span>
                  {isLoading && (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-stone border-t-accent" />
                  )}
                  {isActive && (
                    <Check className="h-4 w-4 text-accent" />
                  )}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-gray">
                    {target === "universal" ? "All" : info.count} file{info.count !== 1 ? "s" : ""}
                  </span>
                  <span className="text-[10px] text-stone">
                    {formatTokens(info.tokens)} tokens
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Advanced Options — collapsed by default */}
      <div className="rounded-lg border border-stone bg-white overflow-hidden">
        <button
          onClick={() => setAdvancedOpen(!advancedOpen)}
          className="w-full flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-silk/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-gray" />
            <span className="text-xs font-medium text-gray">Advanced Options</span>
          </div>
          {advancedOpen ? (
            <ChevronUp className="h-4 w-4 text-stone" />
          ) : (
            <ChevronDown className="h-4 w-4 text-stone" />
          )}
        </button>

        {advancedOpen && (
          <div className="border-t border-stone px-4 py-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Target Path */}
              <div>
                <label className="block text-xs text-gray mb-1.5">
                  Scope to directory
                </label>
                <input
                  type="text"
                  value={customPath}
                  onChange={(e) => setCustomPath(e.target.value)}
                  placeholder="Leave empty for full repo (recommended)"
                  className="w-full rounded-md border border-stone px-3 py-2 text-sm text-ink placeholder:text-stone focus:border-accent focus:outline-none"
                />
                {scopes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {scopes.slice(0, 8).map((scope) => (
                      <button
                        key={scope}
                        onClick={() => setCustomPath(scope)}
                        className={`rounded-full border px-2.5 py-0.5 text-[11px] font-mono transition-colors cursor-pointer ${
                          customPath === scope
                            ? "border-accent bg-accent/10 text-accent"
                            : "border-stone text-gray hover:border-accent/40 hover:text-ink"
                        }`}
                      >
                        {scope}
                      </button>
                    ))}
                    {customPath && (
                      <button
                        onClick={() => setCustomPath("")}
                        className="rounded-full border border-stone px-2.5 py-0.5 text-[11px] text-gray hover:text-ink cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Budget */}
              <div>
                <label className="block text-xs text-gray mb-1.5">
                  Token budget: {formatTokens(customBudget)}
                </label>
                <input
                  type="range"
                  min={500}
                  max={5000}
                  step={100}
                  value={customBudget}
                  onChange={(e) => setCustomBudget(Number(e.target.value))}
                  className="w-full accent-accent"
                />
                <div className="flex justify-between text-[10px] text-stone mt-1">
                  <span>500</span>
                  <span>5,000</span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-stone leading-relaxed">
              Scope limits which config files are included — only files on the path from root to
              the target directory. Budget trims low-priority entries when the result exceeds the
              token limit. Hard constraints are always kept first.
            </p>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Bundle Output */}
      {result && (
        <div className="rounded-lg border border-stone bg-white overflow-hidden">
          <div className="border-b border-stone px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-medium text-ink">
                {TARGET_LABELS[result.report.target as Target]} Bundle
              </h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] font-medium text-accent">
                {formatTokens(result.report.tokenCount)} tokens
              </span>
              <BudgetBar used={result.report.budgetUsed} />
            </div>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent/90 transition-colors cursor-pointer"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy Bundle"}
            </button>
          </div>
          <pre className="p-4 text-xs text-ink font-mono overflow-x-auto max-h-80 overflow-y-auto whitespace-pre-wrap bg-silk/20">
            {result.bundle}
          </pre>
        </div>
      )}

      {/* Compile Report — collapsed */}
      {result && (
        <div className="rounded-lg border border-stone bg-white overflow-hidden">
          <button
            onClick={() => setReportOpen(!reportOpen)}
            className="w-full flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-silk/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray" />
              <span className="text-sm font-medium text-ink">Compile Report</span>
              {result.report.conflicts.length > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                  <AlertTriangle className="h-3 w-3" />
                  {result.report.conflicts.length} conflict{result.report.conflicts.length !== 1 ? "s" : ""}
                </span>
              )}
              <span className="text-[10px] text-stone">
                {result.report.sources.length} source{result.report.sources.length !== 1 ? "s" : ""} · {result.report.includedEntries} entries
              </span>
            </div>
            {reportOpen ? (
              <ChevronUp className="h-4 w-4 text-stone" />
            ) : (
              <ChevronDown className="h-4 w-4 text-stone" />
            )}
          </button>

          {reportOpen && (
            <div className="border-t border-stone p-4 space-y-5">
              {/* Sources */}
              <div>
                <h4 className="text-xs font-medium text-gray uppercase tracking-wider mb-3">
                  Sources
                </h4>
                <div className="space-y-2">
                  {result.report.sources.map((s) => {
                    const config = MEMORY_FILE_TYPE_CONFIG[s.source as MemoryFileType];
                    return (
                      <div key={s.source} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {config && (
                            <span
                              className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${config.color}`}
                            >
                              {config.label}
                            </span>
                          )}
                          <span className="text-xs text-gray">{s.entries} entries</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {s.files.map((f) => (
                            <span
                              key={f}
                              className="font-mono text-[10px] text-gray bg-silk rounded px-1 py-0.5"
                            >
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Conflicts */}
              {result.report.conflicts.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-gray uppercase tracking-wider mb-3">
                    Conflicts
                  </h4>
                  <div className="space-y-3">
                    {result.report.conflicts.map((c, i) => (
                      <ConflictCard key={i} conflict={c} />
                    ))}
                  </div>
                </div>
              )}

              {/* Token Breakdown */}
              <div>
                <h4 className="text-xs font-medium text-gray uppercase tracking-wider mb-3">
                  Token Breakdown
                </h4>
                <div className="space-y-2">
                  {result.report.sources.map((s) => {
                    const config = MEMORY_FILE_TYPE_CONFIG[s.source as MemoryFileType];
                    const pct =
                      result.report.includedEntries > 0
                        ? Math.round((s.entries / result.report.includedEntries) * 100)
                        : 0;
                    return (
                      <div key={s.source}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          {config && (
                            <span
                              className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${config.color}`}
                            >
                              {config.label}
                            </span>
                          )}
                          <span className="text-gray tabular-nums">
                            {s.entries} entries · {pct}%
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-silk overflow-hidden">
                          <div
                            className="h-full rounded-full bg-accent transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────

function BudgetBar({ used }: { used: number }) {
  const color =
    used > 90 ? "bg-red-500" : used > 70 ? "bg-amber-500" : "bg-accent";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 rounded-full bg-silk overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all`}
          style={{ width: `${Math.min(used, 100)}%` }}
        />
      </div>
      <span className="text-[10px] text-gray tabular-nums">{used}%</span>
    </div>
  );
}

function ConflictCard({ conflict }: { conflict: ConflictBlock }) {
  return (
    <div className="rounded-md border border-amber-200 bg-amber-50/50 p-3 text-xs">
      <div className="flex items-center gap-2 mb-2">
        <span className="font-mono font-medium text-ink">{conflict.key}</span>
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-700 font-medium">
          {conflict.kind}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div>
          <span className="text-[10px] text-gray block mb-0.5">
            Winner ({conflict.winner.source})
          </span>
          <code className="text-accent text-[11px]">
            {String(conflict.winner.value)}
          </code>
        </div>
        <div>
          <span className="text-[10px] text-gray block mb-0.5">
            Loser ({conflict.loser.source})
          </span>
          <code className="text-gray line-through text-[11px]">
            {String(conflict.loser.value)}
          </code>
        </div>
      </div>
      <p className="text-gray italic">{conflict.suggestion}</p>
    </div>
  );
}
