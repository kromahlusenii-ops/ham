import { NextResponse } from "next/server";
import { getUser, isSupabaseConfigured } from "@/lib/auth";
import { MOCK_MEMORY_FILES } from "@/lib/mock-scan-data";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  if (!isSupabaseConfigured()) {
    const files = MOCK_MEMORY_FILES[id] ?? [];
    return NextResponse.json({ files });
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const { data: files, error } = await supabase
    .from("memory_files")
    .select("*")
    .eq("repo_id", id)
    .order("path");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const response = NextResponse.json({ files: files ?? [] });
  response.headers.set("Cache-Control", "private, max-age=30, stale-while-revalidate=120");
  return response;
}
