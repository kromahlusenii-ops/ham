"use client";

import type { EngineerSpend } from "@/lib/team-types";
import { formatCost, formatTokens } from "@/lib/model-pricing";

export default function EngineerDetail({
  engineer,
}: {
  engineer: EngineerSpend;
}) {
  return (
    <tr>
      <td colSpan={8} className="px-4 pb-4">
        <div className="rounded-lg border border-stone bg-snow p-4">
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-xs font-medium text-gray">Sessions</p>
              <p className="mt-1 font-mono text-sm text-ink">{engineer.sessions}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray">Total Tokens</p>
              <p className="mt-1 font-mono text-sm text-ink">{formatTokens(engineer.tokens)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray">Total Cost</p>
              <p className="mt-1 font-mono text-sm text-ink">{formatCost(engineer.cost)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray">CO2e</p>
              <p className="mt-1 font-mono text-sm text-ink">{engineer.co2eGrams.toFixed(1)}g</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray">Avg $/Session</p>
              <p className="mt-1 font-mono text-sm text-ink">{formatCost(engineer.avgCostPerSession)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray">Primary Model</p>
              <p className="mt-1 text-sm text-ink">{engineer.primaryModel}</p>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}
