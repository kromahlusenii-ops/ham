import type { AdoptionMetrics } from "@/lib/team-types";
import { formatCost } from "@/lib/model-pricing";

export default function AdoptionSection({
  adoption,
}: {
  adoption: AdoptionMetrics;
}) {
  const rows = [
    { label: "HAM adoption rate", value: `${adoption.hamAdoptionRate}%` },
    { label: "Estimated savings", value: formatCost(adoption.estimatedSavings) },
    { label: "Benchmark completion", value: `${adoption.benchmarkCompletion}%` },
    {
      label: "Engineers not using HAM",
      value: adoption.engineersNotUsingHam.length > 0
        ? adoption.engineersNotUsingHam.join(", ")
        : "All engineers using HAM",
    },
  ];

  return (
    <section>
      <h2 className="mb-4 text-sm font-medium text-ink">Adoption</h2>
      <div className="overflow-x-auto rounded-lg border border-stone bg-white">
        <table className="w-full text-left text-sm">
          <tbody className="divide-y divide-stone">
            {rows.map((row) => (
              <tr key={row.label}>
                <td className="px-4 py-3 font-medium text-gray">{row.label}</td>
                <td className="px-4 py-3 font-mono text-ink">{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
