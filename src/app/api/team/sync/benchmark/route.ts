import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { getUser, isSupabaseConfigured } from "@/lib/auth";
import { serverCache } from "@/lib/cache";

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { tasks } = body;

  if (!Array.isArray(tasks)) {
    return NextResponse.json({ error: "tasks array is required" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ synced: tasks.length });
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const { data: membership } = await supabase
    .from("team_members")
    .select("id, team_id")
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return NextResponse.json({ error: "Not a team member" }, { status: 403 });
  }

  const enriched = tasks.map((t: Record<string, unknown>) => ({
    ...t,
    engineer_id: membership.id,
    team_id: membership.team_id,
  }));

  const { error } = await supabase.from("benchmark_tasks").insert(enriched);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  serverCache.invalidate("team-stats:");
  revalidateTag("team-stats", { expire: 0 });

  return NextResponse.json({ synced: enriched.length });
}
