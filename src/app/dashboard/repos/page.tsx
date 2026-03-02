import { getUser, getGhToken, isSupabaseConfigured } from "@/lib/auth";
import { MOCK_CONNECTED_REPOS } from "@/lib/seed-data";
import { fetchUserRepos } from "@/lib/github";
import type { ConnectedRepo } from "@/lib/types";
import GithubRepoList from "@/components/dashboard/GithubRepoList";

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

export default async function ReposPage() {
  const user = await getUser();

  // Fetch connected repos and GitHub repos in parallel (eliminates client-side waterfall)
  const token = await getGhToken();
  const [connectedRepos, githubRepos] = await Promise.all([
    getConnectedRepos(user!.id),
    token ? fetchUserRepos(token).catch(() => []) : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Repositories
        </h1>
        <p className="mt-1 text-sm text-gray">
          Connect GitHub repositories to track agent memory usage.
        </p>
      </div>

      <GithubRepoList connectedRepos={connectedRepos} initialRepos={githubRepos} />
    </div>
  );
}
