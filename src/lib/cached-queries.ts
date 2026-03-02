import { unstable_cache } from "next/cache";

/**
 * Cached Supabase queries using Next.js `unstable_cache` + `revalidateTag`.
 *
 * These wrap the most expensive queries so the full-route Data Cache
 * can skip redundant Supabase round-trips between tag invalidations.
 */

async function getSupabase() {
  const { createClient } = await import("@/lib/supabase/server");
  return createClient();
}

// ─── Team Stats (the heaviest endpoint) ──────────────────────────────

export const getCachedTeamStats = unstable_cache(
  async (teamId: string, days: number) => {
    const supabase = await getSupabase();

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const [teamRes, membersRes, sessionsRes, benchmarksRes] = await Promise.all([
      supabase.from("teams").select("*").eq("id", teamId).single(),
      supabase.from("team_members").select("*").eq("team_id", teamId),
      supabase.from("session_summaries").select("*").eq("team_id", teamId),
      supabase.from("benchmark_tasks").select("*").eq("team_id", teamId),
    ]);

    return {
      team: teamRes.data,
      members: membersRes.data ?? [],
      sessions: sessionsRes.data ?? [],
      benchmarks: benchmarksRes.data ?? [],
    };
  },
  ["team-stats-query"],
  { tags: ["team-stats"], revalidate: 300 },
);

// ─── Repo Analytics ──────────────────────────────────────────────────

export const getCachedRepoAnalytics = unstable_cache(
  async (repoId: string, teamId: string, repoName: string, cutoffIso: string) => {
    const supabase = await getSupabase();

    const [membersRes, sessionsRes, benchmarksRes] = await Promise.all([
      supabase.from("team_members").select("*").eq("team_id", teamId),
      supabase
        .from("session_summaries")
        .select("*")
        .eq("team_id", teamId)
        .eq("project_name", repoName)
        .gte("start_time", cutoffIso),
      supabase
        .from("benchmark_tasks")
        .select("*")
        .eq("team_id", teamId)
        .eq("project_name", repoName),
    ]);

    return {
      members: membersRes.data ?? [],
      sessions: sessionsRes.data ?? [],
      benchmarks: benchmarksRes.data ?? [],
    };
  },
  ["repo-analytics-query"],
  { tags: ["repo-analytics"], revalidate: 180 },
);

// ─── Team Members ────────────────────────────────────────────────────

export const getCachedTeamMembers = unstable_cache(
  async (teamId: string) => {
    const supabase = await getSupabase();
    const { data: members } = await supabase
      .from("team_members")
      .select("*")
      .eq("team_id", teamId)
      .order("joined_at", { ascending: true });

    return members ?? [];
  },
  ["team-members-query"],
  { tags: ["team-members"], revalidate: 60 },
);

// ─── Connected Repos ─────────────────────────────────────────────────

export const getCachedConnectedRepos = unstable_cache(
  async (userId: string) => {
    const supabase = await getSupabase();
    const { data: repos } = await supabase
      .from("connected_repos")
      .select("*")
      .eq("user_id", userId)
      .order("connected_at", { ascending: false });

    return repos ?? [];
  },
  ["connected-repos-query"],
  { tags: ["connected-repos"], revalidate: 60 },
);
