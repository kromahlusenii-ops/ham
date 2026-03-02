import { FileText, Hash, Layers } from "lucide-react";
import type { MemoryFile } from "@/lib/types";

export default function ScanSummaryCards({ files }: { files: MemoryFile[] }) {
  const totalTokens = files.reduce((sum, f) => sum + f.token_count, 0);
  const fileTypes = new Set(files.map((f) => f.file_type));

  const formatNumber = (n: number): string => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toString();
  };

  const cards = [
    {
      label: "Memory Files",
      value: files.length.toString(),
      icon: FileText,
    },
    {
      label: "Total Tokens",
      value: formatNumber(totalTokens),
      icon: Hash,
    },
    {
      label: "File Types",
      value: fileTypes.size.toString(),
      icon: Layers,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
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
