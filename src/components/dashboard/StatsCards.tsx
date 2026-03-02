import { FolderGit2, FileText, Hash, Layers } from "lucide-react";
import type { OverviewStats } from "@/lib/types";

const formatNumber = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
};

export default function StatsCards({ stats }: { stats: OverviewStats }) {
  const fileTypeCount = Object.keys(stats.fileTypesBreakdown).length;

  const cards = [
    {
      label: "Connected Repos",
      value: stats.totalRepos.toString(),
      icon: FolderGit2,
    },
    {
      label: "Memory Files",
      value: formatNumber(stats.totalMemoryFiles),
      icon: FileText,
    },
    {
      label: "Total Tokens",
      value: formatNumber(stats.totalTokens),
      icon: Hash,
    },
    {
      label: "File Types",
      value: fileTypeCount.toString(),
      icon: Layers,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-lg border border-stone bg-white p-4"
        >
          <div className="flex items-center gap-2 text-gray">
            <card.icon className="h-4 w-4" />
            <span className="text-xs font-medium">{card.label}</span>
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-ink">
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
