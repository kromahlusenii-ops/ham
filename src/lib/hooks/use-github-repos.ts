import useSWR from "swr";
import type { GitHubRepo } from "@/lib/types";

export function useGithubRepos(initialRepos?: GitHubRepo[]) {
  return useSWR<{ repos: GitHubRepo[] }>(
    "/api/repos/github",
    {
      fallbackData: initialRepos ? { repos: initialRepos } : undefined,
      dedupingInterval: 30_000,
    },
  );
}
