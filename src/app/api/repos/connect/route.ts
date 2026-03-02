import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { getUser, isSupabaseConfigured } from "@/lib/auth";
import { serverCache } from "@/lib/cache";
import type { GitHubRepo } from "@/lib/types";

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { repo: GitHubRepo };
  const { repo } = body;

  if (!repo?.id || !repo?.name || !repo?.full_name || !repo?.owner?.login) {
    return NextResponse.json({ error: "Invalid repo data" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    // Dev mode — return a mock connected repo
    return NextResponse.json({
      connected: {
        id: `mock-${repo.id}`,
        user_id: user.id,
        github_id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        owner: repo.owner.login,
        private: repo.private,
        default_branch: repo.default_branch,
        description: repo.description,
        connected_at: new Date().toISOString(),
      },
    });
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("connected_repos")
    .insert({
      user_id: user.id,
      github_id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      owner: repo.owner.login,
      private: repo.private,
      default_branch: repo.default_branch,
      description: repo.description,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  serverCache.invalidate(`github-repos:${user.id}`);
  revalidateTag("connected-repos", { expire: 0 });

  return NextResponse.json({ connected: data });
}
