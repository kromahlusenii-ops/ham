"use client";

import { useState } from "react";
import { DollarSign, Cpu, MessageSquare, Layers, BarChart3, Leaf, TrendingDown, Check } from "lucide-react";
import { Tip } from "@/components/ui/InfoTip";
import TimeRangeSelector from "@/components/team/TimeRangeSelector";
import SpendTrend from "@/components/team/SpendTrend";
import ModelBreakdown from "@/components/team/ModelBreakdown";
import CarbonSection from "@/components/team/CarbonSection";
import BenchmarkSection from "@/components/team/BenchmarkSection";
import { formatCost, formatTokens } from "@/lib/model-pricing";
import { useRepoAnalytics } from "@/lib/hooks/use-repo-analytics";
import type { TimeRange } from "@/lib/team-types";

const PLANNED_METRICS = [
  {
    label: "Cost per Prompt",
    description: "Track average API cost for each message sent to the model",
    icon: MessageSquare,
  },
  {
    label: "Cost per Session",
    description: "Monitor spend for each coding conversation with the AI agent",
    icon: Layers,
  },
  {
    label: "Token Reduction",
    description: "Measure how much HAM reduces token consumption vs baseline",
    icon: TrendingDown,
  },
  {
    label: "Spend by Model",
    description: "See cost breakdown across Opus, Sonnet, and Haiku",
    icon: DollarSign,
  },
  {
    label: "Benchmarking",
    description: "Compare task speed, cost, and cache hits with and without HAM",
    icon: BarChart3,
  },
  {
    label: "CO2e Tracking",
    description: "Estimate carbon footprint and energy savings from HAM",
    icon: Leaf,
  },
];

export default function RepoAnalytics({ repoId, hamInitialized }: { repoId: string; hamInitialized?: boolean }) {
  const [days, setDays] = useState<TimeRange>(30);
  const { data, isLoading, error } = useRepoAnalytics(repoId, days);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-stone border-t-accent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg border border-stone bg-white p-8 text-center">
        <p className="text-sm text-gray">Failed to load analytics.</p>
      </div>
    );
  }

  // No real session data — show transparent onboarding state
  if (data.empty || !data.totals) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray">Analytics</h2>
          <TimeRangeSelector value={days} onChange={setDays} />
        </div>

        <div className="rounded-lg border border-stone bg-white p-8">
          {/* Clear headline */}
          <div className="mx-auto max-w-lg text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-silk">
              <BarChart3 className="h-6 w-6 text-gray" />
            </div>
            <h3 className="text-lg font-semibold text-ink">
              Analytics will appear here automatically
            </h3>
            <p className="mt-2 text-sm text-gray">
              As you use AI coding agents in this repo, HAM captures session data
              and populates your analytics. No manual setup needed beyond
              initialization.
            </p>
          </div>

          {/* How it works — 3 clear steps */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg border border-stone p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
                  1
                </span>
                <span className="text-xs font-semibold text-ink">Connect</span>
                <Check className="h-3.5 w-3.5 text-accent ml-auto" />
              </div>
              <p className="text-[11px] text-gray leading-relaxed">
                You&apos;ve already connected this repo. HAM scanned it and found
                your AI config files.
              </p>
            </div>

            <div className="rounded-lg border border-stone p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
                  2
                </span>
                <span className="text-xs font-semibold text-ink">Initialize</span>
                {hamInitialized && <Check className="h-3.5 w-3.5 text-accent ml-auto" />}
              </div>
              <p className="text-[11px] text-gray leading-relaxed">
                {hamInitialized
                  ? "HAM is initialized. Memory files and config are in place."
                  : <>Initialize HAM from the <span className="font-medium text-ink">Files</span> tab to add memory files and a config. This is what the compiler reads.</>
                }
              </p>
            </div>

            <div className="rounded-lg border border-stone p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${hamInitialized ? "bg-accent text-white" : "bg-stone text-gray"}`}>
                  3
                </span>
                <span className="text-xs font-semibold text-ink">Use your agent</span>
              </div>
              <p className="text-[11px] text-gray leading-relaxed">
                Start coding with Claude, Cursor, Copilot, or any supported agent.
                Session data flows into analytics automatically.
              </p>
            </div>
          </div>

          {/* What you'll see */}
          <div className="mt-8">
            <p className="mb-3 text-center text-xs font-medium uppercase tracking-wider text-ash">
              What fills in as you use your agents
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {PLANNED_METRICS.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-lg border border-dashed border-stone p-3"
                >
                  <div className="flex items-center gap-2 text-ash">
                    <metric.icon className="h-4 w-4" />
                    <span className="text-xs font-medium">{metric.label}</span>
                  </div>
                  <p className="mt-1 text-[11px] leading-snug text-ash">
                    {metric.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* CLI quick reference — simplified */}
          <div className="mt-8">
            <p className="text-center text-xs font-medium uppercase tracking-wider text-ash mb-3">
              Optional CLI commands
            </p>
            <div className="rounded-lg border border-stone bg-silk/50 p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
                {[
                  { cmd: "ham savings", desc: "View token and cost savings" },
                  { cmd: "ham benchmark", desc: "Compare with vs without HAM" },
                  { cmd: "ham insights", desc: "Generate actionable insights" },
                  { cmd: "ham audit", desc: "Check memory system health" },
                ].map((row) => (
                  <div key={row.cmd} className="flex items-baseline gap-3">
                    <code className="shrink-0 rounded bg-white px-1.5 py-0.5 font-mono text-[11px] text-ink">
                      {row.cmd}
                    </code>
                    <span className="text-[11px] text-gray">{row.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { totals, totalSessions = 0, totalMessages = 0, dailySpend = [], modelSpend = [], carbon, carbonByModel = [], benchmark } = data;

  const costPerSession = totalSessions > 0 ? totals.totalSpend / totalSessions : 0;
  const costPerMessage = totalMessages > 0 ? totals.totalSpend / totalMessages : 0;

  const heroCards = [
    {
      label: "Total Spend",
      value: formatCost(totals.totalSpend),
      icon: DollarSign,
      tip: `Sum of all API costs across ${totalSessions} sessions in the selected time range. Costs are computed from per-model token pricing (input + output tokens).`,
    },
    {
      label: "Total Tokens",
      value: formatTokens(totals.totalTokens),
      icon: Cpu,
      tip: "Total input + output tokens consumed across all sessions. Higher token counts increase cost and latency. HAM reduces tokens by providing scoped context.",
    },
    {
      label: "Cost / Session",
      value: formatCost(costPerSession),
      icon: Layers,
      tip: `Total spend divided by ${totalSessions} sessions. A session is one continuous coding conversation with the AI agent.`,
    },
    {
      label: "Cost / Prompt",
      value: formatCost(costPerMessage),
      icon: MessageSquare,
      tip: `Total spend divided by ${totalMessages} prompts. Each prompt is a single user message sent to the model within a session.`,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-gray">Analytics</h2>
        <TimeRangeSelector value={days} onChange={setDays} />
      </div>

      {/* Hero cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {heroCards.map((card) => (
          <div key={card.label} className="rounded-lg border border-stone bg-white p-4">
            <div className="flex items-center justify-between text-gray">
              <div className="flex items-center gap-2">
                <card.icon className="h-4 w-4" />
                <span className="text-xs font-medium">{card.label}</span>
              </div>
              <Tip text={card.tip} />
            </div>
            <p className="mt-2 font-mono text-2xl font-semibold tracking-tight text-ink">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {benchmark && (
        <BenchmarkSection
          benchmark={benchmark}
          engineerBenchmarks={[]}
          activeEngineers={totals.activeEngineers}
        />
      )}

      <SpendTrend data={dailySpend} />

      <ModelBreakdown models={modelSpend} />

      {carbon && (
        <CarbonSection
          carbon={carbon}
          byEngineer={[]}
          byModel={carbonByModel}
          dailySpend={dailySpend}
        />
      )}
    </div>
  );
}
