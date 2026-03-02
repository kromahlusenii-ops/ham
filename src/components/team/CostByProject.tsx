import type { ProjectSpend } from "@/lib/team-types";
import { formatCost, formatTokens } from "@/lib/model-pricing";

export default function CostByProject({
  projects,
}: {
  projects: ProjectSpend[];
}) {
  return (
    <section>
      <h2 className="mb-4 text-sm font-medium text-ink">Cost by Project</h2>
      <div className="overflow-x-auto rounded-lg border border-stone bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-stone text-xs text-gray">
              <th className="px-4 py-3 font-medium">Project</th>
              <th className="px-4 py-3 font-medium">Engineers</th>
              <th className="px-4 py-3 font-medium">Sessions</th>
              <th className="px-4 py-3 font-medium">Tokens</th>
              <th className="px-4 py-3 font-medium">Cost</th>
              <th className="px-4 py-3 font-medium">CO2e</th>
              <th className="px-4 py-3 font-medium">Top Model</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone">
            {projects.map((p) => (
              <tr key={p.projectName}>
                <td className="px-4 py-3 font-medium text-ink">{p.projectName}</td>
                <td className="px-4 py-3 font-mono text-ink">{p.engineers}</td>
                <td className="px-4 py-3 font-mono text-ink">{p.sessions}</td>
                <td className="px-4 py-3 font-mono text-ink">{formatTokens(p.tokens)}</td>
                <td className="px-4 py-3 font-mono text-ink">{formatCost(p.cost)}</td>
                <td className="px-4 py-3 font-mono text-ink">{p.co2eGrams.toFixed(1)}g</td>
                <td className="px-4 py-3 text-ink">{p.topModel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
