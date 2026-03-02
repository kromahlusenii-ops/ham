"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Leaf, Zap, TreePine, Smartphone } from "lucide-react";
import type { CarbonMetrics, CarbonByEngineer, CarbonByModel, DailySpend } from "@/lib/team-types";
import InfoTip, { Tip } from "../ui/InfoTip";

const MODEL_COLORS = {
  opus: "#dc2626",
  sonnet: "#3eb489",
  haiku: "#78716c",
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function CarbonSection({
  carbon,
  byEngineer,
  byModel,
  dailySpend,
}: {
  carbon: CarbonMetrics;
  byEngineer: CarbonByEngineer[];
  byModel: CarbonByModel[];
  dailySpend: DailySpend[];
}) {
  const [showMethodology, setShowMethodology] = useState(false);

  const metricCards = [
    { label: "Team CO2e", value: `${carbon.totalCo2eGrams >= 1000 ? `${(carbon.totalCo2eGrams / 1000).toFixed(1)}kg` : `${Math.round(carbon.totalCo2eGrams)}g`}`, icon: Leaf, tip: "Total estimated CO2 equivalent emissions from all AI sessions. Calculated from GPU energy consumption and US average grid carbon intensity (0.385 kgCO2/kWh)." },
    { label: "Energy Used", value: `${carbon.totalEnergyWh >= 1000 ? `${(carbon.totalEnergyWh / 1000).toFixed(1)}kWh` : `${Math.round(carbon.totalEnergyWh)}Wh`}`, icon: Zap, tip: "Total estimated energy consumed by GPU inference across all sessions. Uses per-model GPU power profiles (Opus: 8x700W, Sonnet: 4x400W, Haiku: 2x300W) with a PUE of 1.1." },
    { label: "CO2e Saved (HAM)", value: `${carbon.co2eSavedGrams >= 1000 ? `${(carbon.co2eSavedGrams / 1000).toFixed(1)}kg` : `${Math.round(carbon.co2eSavedGrams)}g`}`, icon: TreePine, tip: "Estimated CO2e avoided by using HAM. HAM sessions use ~50% fewer tokens on average, proportionally reducing energy and emissions." },
    { label: "Real-world Equiv", value: `${carbon.equivalentCharges} charges`, icon: Smartphone, tip: "Total CO2e expressed as equivalent smartphone charges. One full smartphone charge produces roughly 8.22g of CO2e." },
  ];

  return (
    <section>
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-sm font-medium text-ink">Carbon Intelligence</h2>
        <InfoTip
          open={showMethodology}
          onToggle={() => setShowMethodology(!showMethodology)}
          text="Energy estimates use per-model GPU power profiles with a PUE of 1.1. CO2e uses US average grid intensity (0.385 kgCO2/kWh). Actual emissions vary by datacenter location and time of day."
        />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {metricCards.map((card) => (
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

      {/* Daily CO2e chart — reusing daily spend data proportionally */}
      <div className="mt-4 rounded-lg border border-stone bg-white p-6">
        <p className="mb-3 text-xs font-medium text-gray">Daily CO2e by Model</p>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={dailySpend} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11, fill: "#78716c" }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={(v: number) => `${v}g`} tick={{ fontSize: 11, fill: "#78716c" }} axisLine={false} tickLine={false} width={40} />
            <Tooltip contentStyle={{ fontSize: 12, border: "1px solid #e7e5e4", borderRadius: 8, boxShadow: "none" }} />
            <Area type="monotone" dataKey="opus" stackId="1" stroke={MODEL_COLORS.opus} fill={MODEL_COLORS.opus} fillOpacity={0.15} strokeWidth={1.5} />
            <Area type="monotone" dataKey="sonnet" stackId="1" stroke={MODEL_COLORS.sonnet} fill={MODEL_COLORS.sonnet} fillOpacity={0.15} strokeWidth={1.5} />
            <Area type="monotone" dataKey="haiku" stackId="1" stroke={MODEL_COLORS.haiku} fill={MODEL_COLORS.haiku} fillOpacity={0.1} strokeWidth={1.5} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Carbon by engineer */}
      <div className="mt-4 overflow-x-auto rounded-lg border border-stone bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-stone text-xs text-gray">
              <th className="px-4 py-3 font-medium">Engineer</th>
              <th className="px-4 py-3 font-medium">CO2e (g)</th>
              <th className="px-4 py-3 font-medium">Energy (Wh)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone">
            {byEngineer.map((e) => (
              <tr key={e.engineerId}>
                <td className="px-4 py-3 font-medium text-ink">{e.displayName}</td>
                <td className="px-4 py-3 font-mono text-ink">{e.co2eGrams.toFixed(1)}</td>
                <td className="px-4 py-3 font-mono text-ink">{e.energyWh.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Carbon by model */}
      <div className="mt-4 overflow-x-auto rounded-lg border border-stone bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-stone text-xs text-gray">
              <th className="px-4 py-3 font-medium">Model</th>
              <th className="px-4 py-3 font-medium">CO2e (g)</th>
              <th className="px-4 py-3 font-medium">Energy (Wh)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone">
            {byModel.map((m) => (
              <tr key={m.model}>
                <td className="px-4 py-3 font-medium text-ink">{m.model}</td>
                <td className="px-4 py-3 font-mono text-ink">{m.co2eGrams.toFixed(1)}</td>
                <td className="px-4 py-3 font-mono text-ink">{m.energyWh.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Savings callout */}
      {carbon.co2eSavedGrams > 0 && (
        <div className="mt-4 rounded-lg border border-accent/20 bg-accent-light p-4">
          <p className="text-sm text-ink">
            If your team switched all Opus sessions to Sonnet, you could reduce CO2e by an estimated{" "}
            <span className="font-mono font-semibold">
              {byModel.find((m) => m.model === "Opus")?.co2eGrams.toFixed(0) ?? "0"}g
            </span>{" "}
            per period.
          </p>
        </div>
      )}
    </section>
  );
}
