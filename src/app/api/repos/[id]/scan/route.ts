import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { getUser, isSupabaseConfigured, getGhToken } from "@/lib/auth";
import { serverCache } from "@/lib/cache";
import { scanRepo } from "@/lib/scanner";
import { MOCK_MEMORY_FILES } from "@/lib/mock-scan-data";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Dev mode — return mock scan results
  if (!isSupabaseConfigured()) {
    const files = MOCK_MEMORY_FILES[id] ?? [];
    return NextResponse.json({
      files,
      total_files: files.length,
      total_tokens: files.reduce((sum, f) => sum + f.token_count, 0),
      scanned_at: new Date().toISOString(),
    });
  }

  // Prod mode — fetch repo, scan via GitHub API, upsert to DB
  const token = await getGhToken();
  if (!token) {
    return NextResponse.json({ error: "no_github_token" }, { status: 401 });
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  // Get the connected repo
  const { data: repo, error: repoError } = await supabase
    .from("connected_repos")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (repoError || !repo) {
    return NextResponse.json({ error: "Repo not found" }, { status: 404 });
  }

  try {
    const scannedFiles = await scanRepo(
      token,
      repo.owner,
      repo.name,
      repo.default_branch,
    );

    // Delete old scan results for this repo
    await supabase.from("memory_files").delete().eq("repo_id", id);

    // Insert new scan results and return them in one trip
    let resultFiles: Array<Record<string, unknown>> = [];
    if (scannedFiles.length > 0) {
      const rows = scannedFiles.map((f) => ({
        repo_id: id,
        path: f.path,
        file_type: f.file_type,
        sha: f.sha,
        size_bytes: f.size_bytes,
        token_count: f.token_count,
        last_scanned_at: new Date().toISOString(),
      }));

      const { data, error: insertError } = await supabase
        .from("memory_files")
        .insert(rows)
        .select();

      if (insertError) {
        return NextResponse.json(
          { error: insertError.message },
          { status: 500 },
        );
      }
      resultFiles = data ?? [];
    }

    // Auto-detect HAM initialization from in-memory data (no extra query)
    const hasRootClaudeMd = scannedFiles.some((f) => f.path === "CLAUDE.md");
    if (hasRootClaudeMd) {
      await supabase
        .from("connected_repos")
        .update({ ham_initialized: true })
        .eq("id", id);
    }

    serverCache.invalidate(`repo-analytics:${id}`);
    revalidateTag("repo-analytics", { expire: 0 });

    return NextResponse.json({
      files: resultFiles,
      total_files: resultFiles.length,
      total_tokens: resultFiles.reduce(
        (sum: number, f: Record<string, unknown>) => sum + (f.token_count as number),
        0,
      ),
      scanned_at: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Scan failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
