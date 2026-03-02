"use client";

import { TrendingDown, Clock, Database, BarChart3 } from "lucide-react";
import type { BenchmarkComparison, EngineerBenchmark } from "@/lib/team-types";
import { projectMonthlySavings } from "@/lib/benchmark-stats";
import { Tip } from "@/components/ui/InfoTip";

function statusBadgeClass(status: string): string {
  switch (status) {
    case "Proven":
      return "bg-accent-light text-accent";
    case "Baseline in progress":
      return "bg-amber-50 text-amber-700";
    default:
      return "bg-silk text-gray";
  }
}

export default function BenchmarkSection({
  benchmark,
  engineerBenchmarks,
  activeEngineers,
}: {
  benchmark: BenchmarkComparison;
  engineerBenchmarks: EngineerBenchmark[];
  activeEngineers: number;
}) {
  const heroCards = [
    { label: "Avg Token Reduction", value: `${benchmark.avgTokenReduction}%`, icon: TrendingDown, tip: "Average percentage fewer tokens per task with HAM active vs baseline. Computed as (baseline avg - HAM avg) / baseline avg across all tracked tasks." },
    { label: "Avg Time Reduction", value: `${benchmark.avgTimeReduction}%`, icon: Clock, tip: "Average percentage faster task completion with HAM active vs baseline. Measures wall-clock time from task start to finish." },
    { label: "Avg Cache Improvement", value: `${benchmark.avgCacheImprovement}%`, icon: Database, tip: "Percentage increase in prompt cache hits with HAM. Higher cache usage means the model reuses prior context, reducing latency and cost." },
    { label: "Tasks Tracked", value: benchmark.totalTasks.toString(), icon: BarChart3, tip: "Total benchmark tasks recorded (baseline + HAM active). More tasks produce more statistically reliable comparisons." },
  ];

  const savings = projectMonthlySavings(benchmark, activeEngineers);

  return (
    <section>
      <h2 className="mb-4 text-sm font-medium text-ink">Benchmarking</h2>

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

      {/* Team comparison table */}
      {benchmark.rows.length > 0 && (
        <div className="mt-4 overflow-x-auto rounded-lg border border-stone bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone text-xs text-gray">
                <th className="px-4 py-3 font-medium">Metric</th>
                <th className="px-4 py-3 font-medium"><span className="inline-flex items-center gap-1">Baseline <Tip text="Average metric value across tasks run without HAM memory files loaded." /></span></th>
                <th className="px-4 py-3 font-medium"><span className="inline-flex items-center gap-1">HAM Active <Tip text="Average metric value across tasks run with HAM memory files loaded and routing context to the agent." /></span></th>
                <th className="px-4 py-3 font-medium"><span className="inline-flex items-center gap-1">Change <Tip text="Percentage difference between baseline and HAM active. Negative (green) means HAM reduced the metric. Positive on cache means more cache hits." /></span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone">
              {benchmark.rows.map((row) => (
                <tr key={row.metric}>
                  <td className="px-4 py-3 font-medium text-ink">{row.metric}</td>
                  <td className="px-4 py-3 font-mono text-ink">{row.baseline}</td>
                  <td className="px-4 py-3 font-mono text-ink">{row.hamActive}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`font-mono text-sm font-medium ${
                        row.change.startsWith("-") ? "text-accent" : "text-negative"
                      }`}
                    >
                      {row.change}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Per-engineer benchmark table */}
      <div className="mt-4 overflow-x-auto rounded-lg border border-stone bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-stone text-xs text-gray">
              <th className="px-4 py-3 font-medium">Engineer</th>
              <th className="px-4 py-3 font-medium">Baseline Tasks</th>
              <th className="px-4 py-3 font-medium">HAM Tasks</th>
              <th className="px-4 py-3 font-medium">Token Reduction</th>
              <th className="px-4 py-3 font-medium">Time Reduction</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone">
            {engineerBenchmarks.map((e) => (
              <tr key={e.engineerId}>
                <td className="px-4 py-3 font-medium text-ink">{e.displayName}</td>
                <td className="px-4 py-3 font-mono text-ink">{e.baselineTasks}</td>
                <td className="px-4 py-3 font-mono text-ink">{e.hamTasks}</td>
                <td className="px-4 py-3 font-mono text-ink">
                  {e.tokenReduction !== null ? `${e.tokenReduction}%` : "—"}
                </td>
                <td className="px-4 py-3 font-mono text-ink">
                  {e.timeReduction !== null ? `${e.timeReduction}%` : "—"}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${statusBadgeClass(e.status)}`}>
                    {e.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Monthly savings projection */}
      {benchmark.avgTokenReduction > 0 && (
        <div className="mt-4 rounded-lg border border-accent/20 bg-accent-light p-4">
          <p className="text-sm text-ink">
            Projected monthly savings with full HAM adoption:{" "}
            <span className="font-mono font-semibold">{savings}</span>/month
            across {activeEngineers} active engineers
          </p>
        </div>
      )}
    </section>
  );
}
