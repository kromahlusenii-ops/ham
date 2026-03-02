import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { getUser, isSupabaseConfigured } from "@/lib/auth";
import { serverCache } from "@/lib/cache";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  if (!isSupabaseConfigured()) {
    // Dev mode — return success
    return NextResponse.json({ disconnected: id });
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const { error } = await supabase
    .from("connected_repos")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  serverCache.invalidate(`github-repos:${user.id}`);
  revalidateTag("connected-repos", { expire: 0 });

  return NextResponse.json({ disconnected: id });
}
