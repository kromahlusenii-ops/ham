"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { DailySpend } from "@/lib/team-types";
import { Tip } from "@/components/ui/InfoTip";

const MODEL_COLORS = {
  opus: "#dc2626",
  sonnet: "#3eb489",
  haiku: "#78716c",
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function SpendTrend({ data }: { data: DailySpend[] }) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-sm font-medium text-ink">Spend Trend</h2>
        <Tip text="Daily API spend broken down by model tier (Opus, Sonnet, Haiku). Each area shows the cost contribution from that model. Costs are computed from per-model token pricing applied to input + output tokens." />
      </div>
      <div className="rounded-lg border border-stone bg-white p-6">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 11, fill: "#78716c" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v: number) => `$${v}`}
              tick={{ fontSize: 11, fill: "#78716c" }}
              axisLine={false}
              tickLine={false}
              width={48}
            />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                border: "1px solid #e7e5e4",
                borderRadius: 8,
                boxShadow: "none",
              }}
              formatter={(value: number | undefined, name: string | undefined) => [`$${(value ?? 0).toFixed(2)}`, (name ?? "").charAt(0).toUpperCase() + (name ?? "").slice(1)]}
              labelFormatter={(label) => String(label)}
            />
            <Area
              type="monotone"
              dataKey="opus"
              stackId="1"
              stroke={MODEL_COLORS.opus}
              fill={MODEL_COLORS.opus}
              fillOpacity={0.15}
              strokeWidth={1.5}
            />
            <Area
              type="monotone"
              dataKey="sonnet"
              stackId="1"
              stroke={MODEL_COLORS.sonnet}
              fill={MODEL_COLORS.sonnet}
              fillOpacity={0.15}
              strokeWidth={1.5}
            />
            <Area
              type="monotone"
              dataKey="haiku"
              stackId="1"
              stroke={MODEL_COLORS.haiku}
              fill={MODEL_COLORS.haiku}
              fillOpacity={0.1}
              strokeWidth={1.5}
            />
          </AreaChart>
        </ResponsiveContainer>
        <div className="mt-3 flex items-center justify-center gap-6">
          {Object.entries(MODEL_COLORS).map(([name, color]) => (
            <div key={name} className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-xs text-gray">{name.charAt(0).toUpperCase() + name.slice(1)}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
