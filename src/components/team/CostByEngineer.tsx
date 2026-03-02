"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { EngineerSpend } from "@/lib/team-types";
import { formatCost, formatTokens } from "@/lib/model-pricing";
import EngineerDetail from "./EngineerDetail";

export default function CostByEngineer({
  engineers,
}: {
  engineers: EngineerSpend[];
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const chartData = engineers.map((e) => ({
    name: e.displayName,
    cost: e.cost,
  }));

  return (
    <section>
      <h2 className="mb-4 text-sm font-medium text-ink">Cost by Engineer</h2>

      <div className="rounded-lg border border-stone bg-white p-6">
        <ResponsiveContainer width="100%" height={Math.max(engineers.length * 36, 120)}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 4, bottom: 0, left: 0 }}>
            <XAxis
              type="number"
              tickFormatter={(v: number) => `$${v}`}
              tick={{ fontSize: 11, fill: "#78716c" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11, fill: "#1c1917" }}
              axisLine={false}
              tickLine={false}
              width={100}
            />
            <Tooltip
              contentStyle={{ fontSize: 12, border: "1px solid #e7e5e4", borderRadius: 8, boxShadow: "none" }}
              formatter={(value: number | undefined) => [`$${(value ?? 0).toFixed(2)}`, "Cost"]}
            />
            <Bar dataKey="cost" fill="#3eb489" radius={[0, 4, 4, 0]} barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-stone bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-stone text-xs text-gray">
              <th className="px-4 py-3 font-medium">Engineer</th>
              <th className="px-4 py-3 font-medium">Sessions</th>
              <th className="px-4 py-3 font-medium">Tokens</th>
              <th className="px-4 py-3 font-medium">Cost</th>
              <th className="px-4 py-3 font-medium">CO2e</th>
              <th className="px-4 py-3 font-medium">Avg $/Session</th>
              <th className="px-4 py-3 font-medium">Model</th>
              <th className="px-4 py-3 font-medium">Flags</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone">
            {engineers.map((e) => (
              <>
                <tr
                  key={e.engineerId}
                  onClick={() => setExpanded(expanded === e.engineerId ? null : e.engineerId)}
                  className="cursor-pointer transition-colors hover:bg-silk/50"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {e.githubAvatarUrl ? (
                        <img src={e.githubAvatarUrl} alt={e.githubUsername} className="h-5 w-5 rounded-full" />
                      ) : (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-silk text-[10px] font-medium text-gray">
                          {e.displayName[0]?.toUpperCase()}
                        </div>
                      )}
                      <span className="font-medium text-ink">{e.displayName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-ink">{e.sessions}</td>
                  <td className="px-4 py-3 font-mono text-ink">{formatTokens(e.tokens)}</td>
                  <td className="px-4 py-3 font-mono text-ink">{formatCost(e.cost)}</td>
                  <td className="px-4 py-3 font-mono text-ink">{e.co2eGrams.toFixed(1)}g</td>
                  <td className="px-4 py-3 font-mono text-ink">{formatCost(e.avgCostPerSession)}</td>
                  <td className="px-4 py-3 text-ink">{e.primaryModel}</td>
                  <td className="px-4 py-3">
                    {e.flags.map((f) => (
                      <span
                        key={f}
                        className={`mr-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${
                          f.includes("Expensive")
                            ? "bg-negative-light text-negative"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {f}
                      </span>
                    ))}
                  </td>
                </tr>
                {expanded === e.engineerId && (
                  <EngineerDetail key={`detail-${e.engineerId}`} engineer={e} />
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
