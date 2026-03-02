import type { ConnectedRepo, MemoryFile, OverviewStats, RepoStats } from "./types";

export function computeOverviewStats(
  repos: ConnectedRepo[],
  allFiles: MemoryFile[],
): OverviewStats {
  const fileTypesBreakdown: Record<string, number> = {};

  for (const file of allFiles) {
    fileTypesBreakdown[file.file_type] =
      (fileTypesBreakdown[file.file_type] ?? 0) + 1;
  }

  return {
    totalRepos: repos.length,
    totalMemoryFiles: allFiles.length,
    totalTokens: allFiles.reduce((sum, f) => sum + f.token_count, 0),
    fileTypesBreakdown,
  };
}

export function computeRepoStats(
  repo: ConnectedRepo,
  files: MemoryFile[],
): RepoStats {
  const repoFiles = files.filter((f) => f.repo_id === repo.id);
  const fileTypes = [...new Set(repoFiles.map((f) => f.file_type))];

  let lastScannedAt: string | null = null;
  for (const f of repoFiles) {
    if (!lastScannedAt || f.last_scanned_at > lastScannedAt) {
      lastScannedAt = f.last_scanned_at;
    }
  }

  return {
    memoryFileCount: repoFiles.length,
    tokenCount: repoFiles.reduce((sum, f) => sum + f.token_count, 0),
    fileTypes,
    lastScannedAt,
    hamInitialized: repo.ham_initialized,
  };
}
