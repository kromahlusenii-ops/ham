import Link from "next/link";
import { Lock, FileText, Hash, AlertCircle } from "lucide-react";
import type { ConnectedRepo, MemoryFile } from "@/lib/types";
import { MEMORY_FILE_TYPE_CONFIG } from "@/lib/constants";

const formatNumber = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
};

export default function RepoCard({
  repo,
  files,
}: {
  repo: ConnectedRepo;
  files: MemoryFile[];
}) {
  const totalTokens = files.reduce((sum, f) => sum + f.token_count, 0);
  const fileTypes = [...new Set(files.map((f) => f.file_type))];

  return (
    <Link
      href={`/dashboard/repos/${repo.id}`}
      className="block rounded-lg border border-stone bg-white p-4 transition-colors hover:border-accent-muted"
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-sm font-medium text-ink">
              {repo.name}
            </h3>
            {repo.private && <Lock className="h-3 w-3 shrink-0 text-ash" />}
          </div>
          <p className="mt-0.5 text-xs text-gray">{repo.owner}</p>
        </div>
        {files.length > 0 ? (
          <span className="rounded-full bg-accent text-white px-2 py-0.5 text-xs font-medium">
            {files.length} {files.length === 1 ? "file" : "files"}
          </span>
        ) : (
          <span className="flex items-center gap-1 rounded-full bg-silk text-gray px-2 py-0.5 text-xs font-medium">
            <AlertCircle className="h-3 w-3" />
            Not initialized
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 border-t border-stone pt-3">
        <div>
          <div className="flex items-center gap-1 text-gray">
            <FileText className="h-3 w-3" />
            <span className="text-xs">Files</span>
          </div>
          <p className="mt-0.5 text-sm font-medium text-ink">
            {files.length}
          </p>
        </div>
        <div>
          <div className="flex items-center gap-1 text-gray">
            <Hash className="h-3 w-3" />
            <span className="text-xs">Tokens</span>
          </div>
          <p className="mt-0.5 text-sm font-medium text-ink">
            {formatNumber(totalTokens)}
          </p>
        </div>
        <div>
          <div className="flex items-center gap-1 text-gray">
            <span className="text-xs">Types</span>
          </div>
          <div className="mt-0.5 flex flex-wrap gap-1">
            {fileTypes.length > 0 ? (
              fileTypes.map((ft) => {
                const config = MEMORY_FILE_TYPE_CONFIG[ft];
                return (
                  <span
                    key={ft}
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${config.color}`}
                  >
                    {config.label}
                  </span>
                );
              })
            ) : (
              <span className="text-sm font-medium text-ash">—</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
