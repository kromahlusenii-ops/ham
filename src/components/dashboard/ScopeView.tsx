"use client";

import { useMemo, useState } from "react";
import { FolderTree, Users, Layers } from "lucide-react";
import type { MemoryFile, MemoryFileType } from "@/lib/types";
import { MEMORY_FILE_TYPE_CONFIG } from "@/lib/constants";
import { buildCoverageMatrix, computeScopeChain } from "@/lib/scope-analysis";

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export default function ScopeView({ files }: { files: MemoryFile[] }) {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  const matrix = useMemo(() => buildCoverageMatrix(files), [files]);
  const scopeChain = useMemo(
    () => (selectedPath !== null ? computeScopeChain(files, selectedPath) : null),
    [files, selectedPath]
  );

  const maxDepth = Math.max(0, ...matrix.directories.map((d) => d.depth));

  const summaryCards = [
    { label: "Scope Depth", value: maxDepth.toString(), icon: Layers },
    { label: "Active Agents", value: matrix.activeAgents.length.toString(), icon: Users },
    { label: "Directories", value: matrix.directories.length.toString(), icon: FolderTree },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="rounded-lg border border-stone bg-white p-4">
            <div className="flex items-center gap-2 text-gray">
              <card.icon className="h-4 w-4" />
              <span className="text-xs font-medium">{card.label}</span>
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-ink">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Agent Coverage Matrix */}
      <div className="rounded-lg border border-stone bg-white overflow-hidden">
        <div className="border-b border-stone px-4 py-3">
          <h3 className="text-sm font-medium text-ink">Agent Coverage Matrix</h3>
          <p className="text-xs text-gray mt-0.5">Click a directory to simulate scope chain loading</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone bg-silk/50">
                <th className="px-4 py-2 text-left text-xs font-medium text-gray">Directory</th>
                {matrix.activeAgents.map((agent) => {
                  const config = MEMORY_FILE_TYPE_CONFIG[agent];
                  return (
                    <th key={agent} className="px-3 py-2 text-center">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${config.color}`}>
                        {config.label}
                      </span>
                    </th>
                  );
                })}
                <th className="px-3 py-2 text-right text-xs font-medium text-gray">Total</th>
              </tr>
            </thead>
            <tbody>
              {matrix.directories.map((dir) => {
                const displayPath = dir.path || "/";
                const isSelected = selectedPath === dir.path;
                return (
                  <tr
                    key={dir.path}
                    onClick={() => setSelectedPath(dir.path)}
                    className={`border-b border-stone/50 cursor-pointer transition-colors ${
                      isSelected ? "bg-accent/5" : "hover:bg-silk/30"
                    }`}
                  >
                    <td className="px-4 py-2 font-mono text-xs text-ink">
                      <span style={{ paddingLeft: `${dir.depth * 16}px` }}>
                        {displayPath}
                      </span>
                    </td>
                    {matrix.activeAgents.map((agent) => {
                      const entry = dir.agents[agent];
                      return (
                        <td key={agent} className="px-3 py-2 text-center text-xs tabular-nums">
                          {entry ? (
                            <span className="text-ink">{formatTokens(entry.tokenCount)}</span>
                          ) : (
                            <span className="text-stone">---</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 text-right text-xs font-medium text-ink tabular-nums">
                      {formatTokens(dir.totalTokens)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scope Chain Simulator */}
      {selectedPath !== null && scopeChain && (
        <div className="rounded-lg border border-stone bg-white overflow-hidden">
          <div className="border-b border-stone px-4 py-3">
            <h3 className="text-sm font-medium text-ink">
              Scope Chain — <span className="font-mono text-accent">{selectedPath || "/"}</span>
            </h3>
            <p className="text-xs text-gray mt-0.5">
              Files loaded when an agent works in this directory
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:divide-x md:divide-stone">
            {/* Left: Chain visualization */}
            <div className="p-4 space-y-0">
              {scopeChain.chain.map((link, i) => (
                <div key={link.path} className="relative">
                  {/* Connecting line */}
                  {i > 0 && (
                    <div className="absolute left-3 -top-2 h-2 w-px bg-stone" />
                  )}
                  <div className="flex items-start gap-3">
                    {/* Dot */}
                    <div className="mt-2.5 h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                    <div className="flex-1 rounded-md border border-stone/50 p-3 mb-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs text-ink">
                          {link.path || "/"}
                        </span>
                        <span className="text-[10px] text-gray tabular-nums">
                          {formatTokens(link.totalTokens)} tokens
                        </span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {(Object.entries(link.agents) as [MemoryFileType, { tokenCount: number }][]).map(
                          ([agent, data]) => {
                            const config = MEMORY_FILE_TYPE_CONFIG[agent];
                            return (
                              <span
                                key={agent}
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${config.color}`}
                              >
                                {config.label} · {formatTokens(data.tokenCount)}
                              </span>
                            );
                          }
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Connecting line below */}
                  {i < scopeChain.chain.length - 1 && (
                    <div className="absolute left-3 bottom-0 h-2 w-px bg-stone" />
                  )}
                </div>
              ))}
              {scopeChain.chain.length === 0 && (
                <p className="text-xs text-gray py-4 text-center">No memory files in this scope chain</p>
              )}
            </div>

            {/* Right: Summary panel */}
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md bg-silk/50 p-3">
                  <p className="text-xs text-gray">Total Tokens</p>
                  <p className="text-lg font-semibold text-ink">{formatTokens(scopeChain.totalTokens)}</p>
                </div>
                <div className="rounded-md bg-silk/50 p-3">
                  <p className="text-xs text-gray">Total Files</p>
                  <p className="text-lg font-semibold text-ink">{scopeChain.totalFiles}</p>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-medium text-gray mb-2">Per-Agent Breakdown</h4>
                <div className="space-y-2">
                  {(Object.entries(scopeChain.agentTotals) as [MemoryFileType, { tokenCount: number; fileCount: number }][]).map(
                    ([agent, data]) => {
                      const config = MEMORY_FILE_TYPE_CONFIG[agent];
                      const pct = scopeChain.totalTokens > 0
                        ? Math.round((data.tokenCount / scopeChain.totalTokens) * 100)
                        : 0;
                      return (
                        <div key={agent}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${config.color}`}>
                              {config.label}
                            </span>
                            <span className="text-gray tabular-nums">
                              {formatTokens(data.tokenCount)} · {data.fileCount} file{data.fileCount !== 1 ? "s" : ""} · {pct}%
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
                    }
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
