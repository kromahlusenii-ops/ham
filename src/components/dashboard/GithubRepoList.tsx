"use client";

import { useState } from "react";
import { Search, Loader2, Lock, Check, Plus, LogIn } from "lucide-react";
import { mutate } from "swr";
import { useGithubRepos } from "@/lib/hooks/use-github-repos";
import type { GitHubRepo, ConnectedRepo } from "@/lib/types";

export default function GithubRepoList({
  connectedRepos,
  initialRepos,
}: {
  connectedRepos: ConnectedRepo[];
  initialRepos?: GitHubRepo[];
}) {
  const { data, error: swrError, isLoading } = useGithubRepos(initialRepos);
  const repos = data?.repos ?? [];

  const [search, setSearch] = useState("");
  const [connectedIds, setConnectedIds] = useState<Set<number>>(
    new Set(connectedRepos.map((r) => r.github_id)),
  );
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // Map github_id → connected repo id for disconnect
  const [connectedMap, setConnectedMap] = useState<Map<number, string>>(
    new Map(connectedRepos.map((r) => [r.github_id, r.id])),
  );

  const filtered = repos.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.full_name.toLowerCase().includes(search.toLowerCase()),
  );

  async function handleToggle(repo: GitHubRepo) {
    setTogglingId(repo.id);
    const isConnected = connectedIds.has(repo.id);

    try {
      if (isConnected) {
        const connectedId = connectedMap.get(repo.id);
        if (!connectedId) return;

        const res = await fetch(`/api/repos/${connectedId}/disconnect`, {
          method: "POST",
        });
        if (!res.ok) throw new Error();

        setConnectedIds((prev) => {
          const next = new Set(prev);
          next.delete(repo.id);
          return next;
        });
        setConnectedMap((prev) => {
          const next = new Map(prev);
          next.delete(repo.id);
          return next;
        });

        // Revalidate SWR caches after disconnect
        mutate((key) => typeof key === "string" && key.startsWith("/api/repos/github"));
      } else {
        const res = await fetch("/api/repos/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ repo }),
        });
        if (!res.ok) throw new Error();
        const data = await res.json();

        setConnectedIds((prev) => new Set(prev).add(repo.id));
        setConnectedMap((prev) =>
          new Map(prev).set(repo.id, data.connected.id),
        );

        // Fire-and-forget scan on connect
        fetch(`/api/repos/${data.connected.id}/scan`, { method: "POST" }).catch(() => {});

        // Revalidate SWR caches after connect
        mutate((key) => typeof key === "string" && key.startsWith("/api/repos/github"));
      }
    } catch {
      // Silently fail — user can retry
    } finally {
      setTogglingId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-gray" />
      </div>
    );
  }

  if (swrError) {
    return (
      <div className="rounded-lg border border-stone bg-white p-6 text-center">
        <p className="text-sm text-gray">Could not load GitHub repositories.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ash" />
        <input
          type="text"
          placeholder="Search repositories…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md border border-stone bg-white py-2 pl-9 pr-3 text-sm text-ink placeholder:text-ash focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

      {/* Repo list */}
      <div className="divide-y divide-stone rounded-lg border border-stone bg-white">
        {filtered.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-gray">
            No repositories found.
          </div>
        )}
        {filtered.map((repo) => {
          const isConnected = connectedIds.has(repo.id);
          const isToggling = togglingId === repo.id;

          return (
            <div
              key={repo.id}
              className="flex items-center justify-between px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-medium text-ink">
                    {repo.name}
                  </p>
                  {repo.private && (
                    <Lock className="h-3 w-3 shrink-0 text-ash" />
                  )}
                </div>
                {repo.description && (
                  <p className="mt-0.5 truncate text-xs text-gray">
                    {repo.description}
                  </p>
                )}
              </div>

              <button
                onClick={() => handleToggle(repo)}
                disabled={isToggling}
                className={`ml-4 flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  isConnected
                    ? "border border-stone bg-white text-gray hover:bg-silk hover:text-ink"
                    : "bg-ink text-white hover:bg-charcoal"
                } disabled:opacity-50`}
              >
                {isToggling ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : isConnected ? (
                  <>
                    <Check className="h-3 w-3" />
                    Connected
                  </>
                ) : (
                  <>
                    <Plus className="h-3 w-3" />
                    Connect
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
