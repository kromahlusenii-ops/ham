import { NextResponse } from "next/server";
import { getUser, isSupabaseConfigured, getGhToken } from "@/lib/auth";
import { fetchFileContent } from "@/lib/scanner";
import { MOCK_MEMORY_FILES } from "@/lib/mock-scan-data";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; fileId: string }> },
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, fileId } = await params;

  // Dev mode — return mock content
  if (!isSupabaseConfigured()) {
    const files = MOCK_MEMORY_FILES[id] ?? [];
    const file = files.find((f) => f.id === fileId);
    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    return NextResponse.json({
      content: file.content,
      token_count: file.token_count,
    });
  }

  // Prod mode
  const token = await getGhToken();
  if (!token) {
    return NextResponse.json({ error: "no_github_token" }, { status: 401 });
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  // Get the memory file record
  const { data: memFile, error: fileError } = await supabase
    .from("memory_files")
    .select("*, connected_repos!inner(owner, name)")
    .eq("id", fileId)
    .eq("repo_id", id)
    .single();

  if (fileError || !memFile) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  // If content already cached, return it
  if (memFile.content) {
    return NextResponse.json({
      content: memFile.content,
      token_count: memFile.token_count,
    });
  }

  try {
    const repo = memFile.connected_repos as { owner: string; name: string };
    const content = await fetchFileContent(
      token,
      repo.owner,
      repo.name,
      memFile.path,
    );

    const tokenCount = Math.ceil(Buffer.byteLength(content, "utf-8") / 4);

    // Cache content in DB
    await supabase
      .from("memory_files")
      .update({ content, token_count: tokenCount })
      .eq("id", fileId);

    return NextResponse.json({ content, token_count: tokenCount });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch content";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
