"use client";

import type { ModelSpend } from "@/lib/team-types";
import { formatCost, formatTokens } from "@/lib/model-pricing";
import { Tip } from "@/components/ui/InfoTip";

function statusBadgeClass(status: ModelSpend["status"]): string {
  switch (status) {
    case "Expensive":
      return "bg-negative-light text-negative";
    case "Efficient":
      return "bg-accent-light text-accent";
    case "Budget":
      return "bg-silk text-gray";
  }
}

export default function ModelBreakdown({
  models,
}: {
  models: ModelSpend[];
}) {
  // Calculate potential savings from switching Opus to Sonnet
  const opusModel = models.find((m) => m.model === "Opus");
  const sonnetModel = models.find((m) => m.model === "Sonnet");
  const potentialSavings =
    opusModel && sonnetModel
      ? opusModel.cost - (opusModel.tokens / (sonnetModel.tokens || 1)) * sonnetModel.cost
      : 0;

  return (
    <section>
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-sm font-medium text-ink">Model Breakdown</h2>
        <Tip text="Cost and usage split by Claude model. Opus is the most capable but most expensive. Sonnet balances cost and quality. Haiku is the fastest and cheapest. Status reflects relative cost tier." />
      </div>
      <div className="overflow-x-auto rounded-lg border border-stone bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-stone text-xs text-gray">
              <th className="px-4 py-3 font-medium">Model</th>
              <th className="px-4 py-3 font-medium">Sessions</th>
              <th className="px-4 py-3 font-medium"><span className="inline-flex items-center gap-1">Tokens <Tip text="Total input + output tokens processed by this model." /></span></th>
              <th className="px-4 py-3 font-medium"><span className="inline-flex items-center gap-1">Cost <Tip text="Total API cost for this model, computed from per-model token pricing." /></span></th>
              <th className="px-4 py-3 font-medium"><span className="inline-flex items-center gap-1">% of Spend <Tip text="This model's share of total spend across all models." /></span></th>
              <th className="px-4 py-3 font-medium"><span className="inline-flex items-center gap-1">Status <Tip text="Expensive: highest cost tier (Opus). Efficient: balanced cost/quality (Sonnet). Budget: lowest cost (Haiku)." /></span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone">
            {models.map((m) => (
              <tr key={m.model}>
                <td className="px-4 py-3 font-medium text-ink">{m.model}</td>
                <td className="px-4 py-3 font-mono text-ink">{m.sessions}</td>
                <td className="px-4 py-3 font-mono text-ink">{formatTokens(m.tokens)}</td>
                <td className="px-4 py-3 font-mono text-ink">{formatCost(m.cost)}</td>
                <td className="px-4 py-3 font-mono text-ink">{m.percentOfSpend}%</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${statusBadgeClass(m.status)}`}
                  >
                    {m.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {opusModel && opusModel.sessions > 0 && potentialSavings > 0 && (
        <div className="mt-4 rounded-lg border border-accent/20 bg-accent-light p-4">
          <p className="text-sm text-ink">
            Switching {opusModel.sessions} Opus sessions to Sonnet would save ~
            <span className="font-mono font-semibold">{formatCost(potentialSavings)}</span>/month
          </p>
        </div>
      )}
    </section>
  );
}
