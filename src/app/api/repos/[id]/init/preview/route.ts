import { NextResponse } from "next/server";
import { getUser, isSupabaseConfigured, getGhToken } from "@/lib/auth";
import { getInitFiles } from "@/lib/ham-templates";
import { getFileSha } from "@/lib/github-write";
import { MOCK_CONNECTED_REPOS } from "@/lib/seed-data";
import { MOCK_INIT_PREVIEW } from "@/lib/mock-scan-data";
import type { ConnectedRepo } from "@/lib/types";

const INIT_PATHS = [
  "CLAUDE.md",
  ".memory/decisions.md",
  ".memory/patterns.md",
  ".memory/inbox.md",
];

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Dev mode
  if (!isSupabaseConfigured()) {
    return NextResponse.json(MOCK_INIT_PREVIEW);
  }

  // Prod mode
  const token = await getGhToken();
  if (!token) {
    return NextResponse.json({ error: "no_github_token" }, { status: 401 });
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const { data: repo } = await supabase
    .from("connected_repos")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!repo) {
    return NextResponse.json({ error: "Repo not found" }, { status: 404 });
  }

  const typedRepo = repo as ConnectedRepo;
  const existingFiles: string[] = [];

  for (const path of INIT_PATHS) {
    const sha = await getFileSha(
      token,
      typedRepo.owner,
      typedRepo.name,
      path,
      typedRepo.default_branch,
    );
    if (sha) existingFiles.push(path);
  }

  const files = getInitFiles(
    { name: typedRepo.name, description: typedRepo.description },
    existingFiles,
  );

  const filesToCreate = Object.entries(files).map(([path, content]) => ({
    path,
    content,
  }));

  return NextResponse.json({ filesToCreate, existingFiles });
}
