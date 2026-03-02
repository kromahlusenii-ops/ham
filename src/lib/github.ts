import type { GitHubRepo } from "./types";

const MOCK_REPOS: GitHubRepo[] = [
  {
    id: 100001,
    name: "ham",
    full_name: "ham-dev/ham",
    owner: { login: "ham-dev" },
    private: false,
    default_branch: "main",
    description: "Hierarchical Agent Memory for AI coding agents",
  },
  {
    id: 100002,
    name: "acme-api",
    full_name: "ham-dev/acme-api",
    owner: { login: "ham-dev" },
    private: true,
    default_branch: "main",
    description: "Internal REST API for Acme Corp",
  },
  {
    id: 100003,
    name: "design-system",
    full_name: "ham-dev/design-system",
    owner: { login: "ham-dev" },
    private: false,
    default_branch: "main",
    description: "Shared React component library",
  },
  {
    id: 100004,
    name: "ml-pipeline",
    full_name: "ham-dev/ml-pipeline",
    owner: { login: "ham-dev" },
    private: true,
    default_branch: "main",
    description: "Data processing and ML training pipeline",
  },
  {
    id: 100005,
    name: "docs-site",
    full_name: "ham-dev/docs-site",
    owner: { login: "ham-dev" },
    private: false,
    default_branch: "main",
    description: "Documentation website built with Next.js",
  },
];

/**
 * Fetch all repos for the authenticated user from GitHub.
 * Paginates through all pages (100 per page).
 * Returns mock repos when token is the dev sentinel.
 */
export async function fetchUserRepos(token: string): Promise<GitHubRepo[]> {
  if (token === "dev-mock-token") {
    return MOCK_REPOS;
  }

  const repos: GitHubRepo[] = [];
  let page = 1;

  while (true) {
    const res = await fetch(
      `https://api.github.com/user/repos?per_page=100&page=${page}&sort=updated`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
        },
      },
    );

    if (!res.ok) {
      throw new Error(`GitHub API error: ${res.status}`);
    }

    const batch: GitHubRepo[] = await res.json();
    repos.push(...batch);

    if (batch.length < 100) break;
    page++;
  }

  return repos;
}
