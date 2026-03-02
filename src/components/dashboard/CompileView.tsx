"use client";

import { useState } from "react";
import { Play, Copy, Check, AlertTriangle, FileText, Layers, Info, ChevronDown, ChevronUp } from "lucide-react";
import type { MemoryFile, MemoryFileType } from "@/lib/types";
import { MEMORY_FILE_TYPE_CONFIG } from "@/lib/constants";
import type { CompileReport, ConflictBlock, Target } from "@/lib/compiler/types";

interface CompileResult {
  bundle: string;
  report: CompileReport;
  cacheKey: string;
}

const TARGETS: { value: Target; label: string }[] = [
  { value: "claude", label: "Claude" },
  { value: "cursor", label: "Cursor" },
  { value: "gemini", label: "Gemini" },
  { value: "aider", label: "Aider" },
  { value: "copilot", label: "Copilot" },
  { value: "llama", label: "Llama" },
  { value: "manus", label: "Manus" },
  { value: "universal", label: "Universal" },
];

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export default function CompileView({
  repoId,
}: {
  repoId: string;
  files: MemoryFile[];
}) {
  const [targetPath, setTargetPath] = useState("");
  const [target, setTarget] = useState<Target>("claude");
  const [budget, setBudget] = useState(2000);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CompileResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [infoOpen, setInfoOpen] = useState(true);

  async function handleCompile() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/repos/${repoId}/compile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetPath, target, budget }),
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
    }
  }

  async function handleCopy() {
    if (!result) return;
    await navigator.clipboard.writeText(result.bundle);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Info Section */}
      <div className="rounded-lg border border-accent/20 bg-accent/5 overflow-hidden">
        <button
          onClick={() => setInfoOpen(!infoOpen)}
          className="w-full flex items-center justify-between px-4 py-3 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium text-ink">How the Compiler Works</span>
          </div>
          {infoOpen
            ? <ChevronUp className="h-4 w-4 text-gray" />
            : <ChevronDown className="h-4 w-4 text-gray" />
          }
        </button>
        {infoOpen && (
          <div className="border-t border-accent/10 px-4 py-4 space-y-4">
            <p className="text-sm text-gray">
              The compiler reads every AI tool config file in your repo, normalizes
              them into a common format, resolves conflicts, and produces a single
              optimized context bundle for your target tool.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <InfoStep
                number="1"
                title="Set target path"
                description="Enter the file you're working on. The compiler walks up the directory tree and collects only the config files in that path's ancestry."
              />
              <InfoStep
                number="2"
                title="Choose target tool"
                description="Pick the tool you're compiling for. That tool's own config files get priority when rules conflict across tools."
              />
              <InfoStep
                number="3"
                title="Set token budget"
                description="The compiler trims low-priority entries to stay under this limit. Hard constraints are kept first, preferences are trimmed first."
              />
            </div>
            <div className="rounded-md bg-white/60 border border-accent/10 p-3">
              <p className="text-xs font-medium text-ink mb-2">What you get back</p>
              <ul className="text-xs text-gray space-y-1">
                <li className="flex gap-2">
                  <span className="text-accent font-medium">Bundle</span>
                  Compiled context formatted for your target tool, ready to copy.
                </li>
                <li className="flex gap-2">
                  <span className="text-accent font-medium">Sources</span>
                  Which files contributed and how many entries came from each.
                </li>
                <li className="flex gap-2">
                  <span className="text-accent font-medium">Conflicts</span>
                  Where your tools disagree, which value won, and why.
                </li>
                <li className="flex gap-2">
                  <span className="text-accent font-medium">Tokens</span>
                  How much of your budget was used, broken down by source.
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Compile Controls */}
      <div className="rounded-lg border border-stone bg-white p-4">
        <h3 className="text-sm font-medium text-ink mb-4">Compile Context Bundle</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Target Path */}
          <div className="md:col-span-2">
            <label className="block text-xs text-gray mb-1">Target Path</label>
            <input
              type="text"
              value={targetPath}
              onChange={(e) => setTargetPath(e.target.value)}
              placeholder="e.g. src/api/handler.ts"
              className="w-full rounded-md border border-stone px-3 py-2 text-sm text-ink placeholder:text-stone focus:border-accent focus:outline-none"
            />
          </div>

          {/* Target Tool */}
          <div>
            <label className="block text-xs text-gray mb-1">Target Tool</label>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value as Target)}
              className="w-full rounded-md border border-stone px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
            >
              {TARGETS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Budget */}
          <div>
            <label className="block text-xs text-gray mb-1">
              Budget: {formatTokens(budget)} tokens
            </label>
            <input
              type="range"
              min={500}
              max={5000}
              step={100}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-full accent-accent"
            />
          </div>
        </div>

        <button
          onClick={handleCompile}
          disabled={loading}
          className="mt-4 inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-50 cursor-pointer transition-colors"
        >
          <Play className="h-4 w-4" />
          {loading ? "Compiling..." : "Compile"}
        </button>
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
              <h3 className="text-sm font-medium text-ink">Compiled Bundle</h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
                {formatTokens(result.report.tokenCount)} tokens
              </span>
              <BudgetBar used={result.report.budgetUsed} />
            </div>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray hover:text-ink hover:bg-silk transition-colors cursor-pointer"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <pre className="p-4 text-xs text-ink font-mono overflow-x-auto max-h-96 overflow-y-auto whitespace-pre-wrap bg-silk/30">
            {result.bundle}
          </pre>
        </div>
      )}

      {/* Compile Report */}
      {result && (
        <div className="space-y-4">
          {/* Sources */}
          <ReportSection title="Sources" icon={FileText}>
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
                        <span key={f} className="font-mono text-[10px] text-gray bg-silk rounded px-1 py-0.5">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </ReportSection>

          {/* Conflicts */}
          {result.report.conflicts.length > 0 && (
            <ReportSection
              title={`Conflicts (${result.report.conflicts.length})`}
              icon={AlertTriangle}
            >
              <div className="space-y-3">
                {result.report.conflicts.map((c, i) => (
                  <ConflictCard key={i} conflict={c} />
                ))}
              </div>
            </ReportSection>
          )}

          {/* Token Breakdown */}
          <ReportSection title="Token Breakdown" icon={Layers}>
            <div className="space-y-2">
              {result.report.sources.map((s) => {
                const config = MEMORY_FILE_TYPE_CONFIG[s.source as MemoryFileType];
                const pct =
                  result.report.tokenCount > 0
                    ? Math.round(
                        ((s.entries / result.report.includedEntries) * 100)
                      )
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
          </ReportSection>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────

function BudgetBar({ used }: { used: number }) {
  const color = used > 90 ? "bg-red-500" : used > 70 ? "bg-amber-500" : "bg-accent";
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

function ReportSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-stone bg-white overflow-hidden">
      <div className="border-b border-stone px-4 py-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-gray" />
        <h3 className="text-sm font-medium text-ink">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function InfoStep({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-md bg-white/60 border border-accent/10 p-3">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
          {number}
        </span>
        <span className="text-xs font-medium text-ink">{title}</span>
      </div>
      <p className="text-xs text-gray pl-7">{description}</p>
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
          <span className="text-[10px] text-gray block mb-0.5">Winner ({conflict.winner.source})</span>
          <code className="text-accent text-[11px]">{String(conflict.winner.value)}</code>
        </div>
        <div>
          <span className="text-[10px] text-gray block mb-0.5">Loser ({conflict.loser.source})</span>
          <code className="text-gray line-through text-[11px]">{String(conflict.loser.value)}</code>
        </div>
      </div>
      <p className="text-gray italic">{conflict.suggestion}</p>
    </div>
  );
}
