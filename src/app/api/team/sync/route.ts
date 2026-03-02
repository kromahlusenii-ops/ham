import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { getUser, isSupabaseConfigured } from "@/lib/auth";
import { serverCache } from "@/lib/cache";
import { calculateEnergy, calculateEmissions } from "@/lib/carbon";

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { sessions } = body;

  if (!Array.isArray(sessions)) {
    return NextResponse.json({ error: "sessions array is required" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ synced: sessions.length });
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

  const enriched = sessions.map((s: Record<string, unknown>) => {
    const durationMs = s.duration_ms as number;
    const model = s.model as string;
    const energyWh = calculateEnergy(durationMs, model);
    const co2eGrams = calculateEmissions(energyWh);

    return {
      ...s,
      engineer_id: membership.id,
      team_id: membership.team_id,
      energy_wh: Math.round(energyWh * 10000) / 10000,
      co2e_grams: Math.round(co2eGrams * 10000) / 10000,
    };
  });

  const { error } = await supabase.from("session_summaries").insert(enriched);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  serverCache.invalidate("team-stats:");
  revalidateTag("team-stats", { expire: 0 });
  revalidateTag("repo-analytics", { expire: 0 });

  return NextResponse.json({ synced: enriched.length });
}
