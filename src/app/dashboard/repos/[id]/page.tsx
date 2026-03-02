import { ArrowLeft, Lock } from "lucide-react";
import Link from "next/link";
import { getUser, isSupabaseConfigured } from "@/lib/auth";
import { MOCK_CONNECTED_REPOS } from "@/lib/seed-data";
import { MOCK_MEMORY_FILES } from "@/lib/mock-scan-data";
import type { ConnectedRepo } from "@/lib/types";
import type { MemoryFile } from "@/lib/types";
import RepoDetail from "@/components/dashboard/RepoDetail";

async function getRepo(userId: string, id: string): Promise<ConnectedRepo | null> {
  if (!isSupabaseConfigured()) {
    return MOCK_CONNECTED_REPOS.find((r) => r.id === id) ?? null;
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const { data } = await supabase
    .from("connected_repos")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  return data as ConnectedRepo | null;
}

async function getMemoryFiles(repoId: string): Promise<MemoryFile[]> {
  if (!isSupabaseConfigured()) {
    return MOCK_MEMORY_FILES[repoId] ?? [];
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const { data } = await supabase
    .from("memory_files")
    .select("*")
    .eq("repo_id", repoId)
    .order("path");

  return (data as MemoryFile[]) ?? [];
}

export default async function RepoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getUser();
  const { id } = await params;
  const repo = await getRepo(user!.id, id);

  if (!repo) {
    return (
      <div className="space-y-4">
        <Link
          href="/dashboard/repos"
          className="inline-flex items-center gap-1 text-sm text-gray hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Repositories
        </Link>
        <div className="rounded-lg border border-stone bg-white p-8 text-center">
          <p className="text-sm text-gray">Repository not found.</p>
        </div>
      </div>
    );
  }

  const files = await getMemoryFiles(id);

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/repos"
        className="inline-flex items-center gap-1 text-sm text-gray hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Repositories
      </Link>

      {/* Repo header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            {repo.name}
          </h1>
          {repo.private && <Lock className="h-4 w-4 text-ash" />}
        </div>
        <p className="mt-1 text-sm text-gray">
          {repo.full_name}
          {repo.description && ` — ${repo.description}`}
        </p>
      </div>

      <RepoDetail
        repoId={id}
        repoName={repo.name}
        hamInitialized={repo.ham_initialized}
        initialFiles={files}
      />
    </div>
  );
}
