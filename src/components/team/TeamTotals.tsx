import { DollarSign, Hash, Users, TrendingUp, Leaf } from "lucide-react";
import type { TeamTotals as TeamTotalsType } from "@/lib/team-types";
import { formatCost, formatTokens } from "@/lib/model-pricing";

export default function TeamTotals({ totals }: { totals: TeamTotalsType }) {
  const cards = [
    {
      label: "Total Spend",
      value: formatCost(totals.totalSpend),
      icon: DollarSign,
    },
    {
      label: "Total Tokens",
      value: formatTokens(totals.totalTokens),
      icon: Hash,
    },
    {
      label: "Active Engineers",
      value: totals.activeEngineers.toString(),
      icon: Users,
    },
    {
      label: "Avg Cost / Engineer",
      value: formatCost(totals.avgCostPerEngineer),
      icon: TrendingUp,
    },
    {
      label: "CO2e Footprint",
      value: `${totals.totalCo2eGrams >= 1000 ? `${(totals.totalCo2eGrams / 1000).toFixed(1)}kg` : `${Math.round(totals.totalCo2eGrams)}g`}`,
      icon: Leaf,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-lg border border-stone bg-white p-4"
        >
          <div className="flex items-center gap-2 text-gray">
            <card.icon className="h-4 w-4" />
            <span className="text-xs font-medium">{card.label}</span>
          </div>
          <p className="mt-2 font-mono text-2xl font-semibold tracking-tight text-ink">
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
