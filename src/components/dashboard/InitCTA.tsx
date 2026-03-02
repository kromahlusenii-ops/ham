"use client";

import { Sparkles, AlertCircle } from "lucide-react";
import type { MemoryFile } from "@/lib/types";

export default function InitCTA({
  files,
  onInitClick,
}: {
  files: MemoryFile[];
  onInitClick: () => void;
}) {
  const hasNoFiles = files.length === 0;

  // Check if incomplete: has some files but missing core HAM files
  const hasClaudeMd = files.some((f) => f.path === "CLAUDE.md");
  const hasMemoryDir = files.some((f) => f.path.startsWith(".memory/"));
  const isIncomplete = files.length > 0 && (!hasClaudeMd || !hasMemoryDir);

  if (!hasNoFiles && !isIncomplete) return null;

  if (hasNoFiles) {
    return (
      <button
        onClick={onInitClick}
        className="flex w-full cursor-pointer items-center gap-4 rounded-lg border-2 border-dashed border-accent-muted bg-accent-muted/10 p-6 transition-colors hover:border-accent hover:bg-accent-muted/20"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-white">
          <Sparkles className="h-6 w-6" />
        </div>
        <div className="text-left">
          <h3 className="text-sm font-semibold text-ink">Initialize HAM</h3>
          <p className="mt-0.5 text-xs text-gray">
            Set up memory files so AI agents can understand your project.
            Creates CLAUDE.md and .memory/ directory.
          </p>
        </div>
      </button>
    );
  }

  // Incomplete banner
  return (
    <button
      onClick={onInitClick}
      className="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-accent-muted bg-accent-muted/10 px-4 py-3 transition-colors hover:bg-accent-muted/20"
    >
      <AlertCircle className="h-4 w-4 shrink-0 text-accent" />
      <span className="text-xs font-medium text-ink">
        Complete HAM setup — some memory files are missing
      </span>
    </button>
  );
}
