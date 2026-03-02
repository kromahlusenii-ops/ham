import type { ConnectedRepo, MemoryFile } from "@/lib/types";
import RepoCard from "./RepoCard";

export default function RepoGrid({
  repos,
  allFiles,
}: {
  repos: ConnectedRepo[];
  allFiles: MemoryFile[];
}) {
  return (
    <div>
      <h2 className="text-sm font-medium text-ink">Connected Repositories</h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {repos.map((repo) => (
          <RepoCard
            key={repo.id}
            repo={repo}
            files={allFiles.filter((f) => f.repo_id === repo.id)}
          />
        ))}
      </div>
    </div>
  );
}
