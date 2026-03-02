import { getUser, isSupabaseConfigured } from "@/lib/auth";
import { MOCK_CONNECTED_REPOS } from "@/lib/seed-data";
import { MOCK_MEMORY_FILES } from "@/lib/mock-scan-data";
import { computeOverviewStats } from "@/lib/dashboard-stats";
import type { ConnectedRepo, MemoryFile } from "@/lib/types";
import StatsCards from "@/components/dashboard/StatsCards";
import RepoGrid from "@/components/dashboard/RepoGrid";
import EmptyState from "@/components/dashboard/EmptyState";

async function getConnectedRepos(userId: string): Promise<ConnectedRepo[]> {
  if (!isSupabaseConfigured()) {
    return MOCK_CONNECTED_REPOS;
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const { data } = await supabase
    .from("connected_repos")
    .select("*")
    .eq("user_id", userId)
    .order("connected_at", { ascending: false });

  return (data as ConnectedRepo[]) ?? [];
}

async function getAllMemoryFiles(repos: ConnectedRepo[]): Promise<MemoryFile[]> {
  if (!isSupabaseConfigured()) {
    const allFiles: MemoryFile[] = [];
    for (const repo of repos) {
      const files = MOCK_MEMORY_FILES[repo.id] ?? [];
      allFiles.push(...files);
    }
    return allFiles;
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const repoIds = repos.map((r) => r.id);
  if (repoIds.length === 0) return [];

  const { data } = await supabase
    .from("memory_files")
    .select("*")
    .in("repo_id", repoIds)
    .order("path");

  return (data as MemoryFile[]) ?? [];
}

export default async function DashboardPage() {
  const user = await getUser();

  const username =
    user?.user_metadata?.user_name ??
    user?.user_metadata?.preferred_username ??
    "there";

  const repos = await getConnectedRepos(user!.id);
  const allFiles = await getAllMemoryFiles(repos);
  const stats = computeOverviewStats(repos, allFiles);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Welcome, {username}
        </h1>
        <p className="mt-1 text-sm text-gray">
          Your HAM Pro dashboard.
        </p>
      </div>

      <StatsCards stats={stats} />

      {repos.length > 0 ? (
        <RepoGrid repos={repos} allFiles={allFiles} />
      ) : (
        <EmptyState />
      )}
    </div>
  );
}
