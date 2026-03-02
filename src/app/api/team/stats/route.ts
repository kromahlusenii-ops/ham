import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getUser, isSupabaseConfigured } from "@/lib/auth";
import { serverCache } from "@/lib/cache";
import {
  MOCK_TEAM,
  MOCK_TEAM_MEMBERS,
  MOCK_SESSION_SUMMARIES,
  MOCK_BENCHMARK_TASKS,
} from "@/lib/team-seed-data";
import {
  filterByTimeRange,
  computeTeamTotals,
  computeDailySpend,
  computeEngineerSpend,
  computeProjectSpend,
  computeModelSpend,
  computeCarbonMetrics,
  computeCarbonByEngineer,
  computeCarbonByModel,
  computeAdoption,
} from "@/lib/team-stats";
import { computeTeamBenchmark, computeEngineerBenchmarks } from "@/lib/benchmark-stats";
import type { TimeRange } from "@/lib/team-types";

export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const days = (parseInt(request.nextUrl.searchParams.get("days") ?? "30") || 30) as TimeRange;

  if (!isSupabaseConfigured()) {
    const sessions = filterByTimeRange(MOCK_SESSION_SUMMARIES, days);
    const benchmarks = MOCK_BENCHMARK_TASKS;
    const members = MOCK_TEAM_MEMBERS;

    return NextResponse.json({
      team: MOCK_TEAM,
      members,
      totals: computeTeamTotals(sessions, members),
      dailySpend: computeDailySpend(sessions, days),
      engineerSpend: computeEngineerSpend(sessions, members),
      projectSpend: computeProjectSpend(sessions),
      modelSpend: computeModelSpend(sessions),
      carbon: computeCarbonMetrics(sessions),
      carbonByEngineer: computeCarbonByEngineer(sessions, members),
      carbonByModel: computeCarbonByModel(sessions),
      benchmark: computeTeamBenchmark(benchmarks, members),
      engineerBenchmarks: computeEngineerBenchmarks(benchmarks, members),
      adoption: computeAdoption(sessions, members, benchmarks),
    });
  }

  // Check in-memory cache
  const cacheKey = `team-stats:${user.id}:${days}`;
  const cached = serverCache.get<Record<string, unknown>>(cacheKey);
  if (cached) {
    const body = JSON.stringify(cached);
    const etag = `"${createHash("md5").update(body).digest("hex")}"`;
    if (request.headers.get("if-none-match") === etag) {
      return new NextResponse(null, { status: 304 });
    }
    const response = new NextResponse(body, {
      headers: { "Content-Type": "application/json" },
    });
    response.headers.set("Cache-Control", "private, max-age=120, stale-while-revalidate=600");
    response.headers.set("ETag", etag);
    response.headers.set("X-Cache", "HIT");
    return response;
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const { data: membership } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return NextResponse.json({ error: "Not a team member" }, { status: 403 });
  }

  const teamId = membership.team_id;

  const [teamRes, membersRes, sessionsRes, benchmarksRes] = await Promise.all([
    supabase.from("teams").select("*").eq("id", teamId).single(),
    supabase.from("team_members").select("*").eq("team_id", teamId),
    supabase.from("session_summaries").select("*").eq("team_id", teamId),
    supabase.from("benchmark_tasks").select("*").eq("team_id", teamId),
  ]);

  const team = teamRes.data!;
  const members = membersRes.data ?? [];
  const allSessions = sessionsRes.data ?? [];
  const benchmarks = benchmarksRes.data ?? [];
  const sessions = filterByTimeRange(allSessions, days);

  const data = {
    team,
    members,
    totals: computeTeamTotals(sessions, members),
    dailySpend: computeDailySpend(sessions, days),
    engineerSpend: computeEngineerSpend(sessions, members),
    projectSpend: computeProjectSpend(sessions),
    modelSpend: computeModelSpend(sessions),
    carbon: computeCarbonMetrics(sessions),
    carbonByEngineer: computeCarbonByEngineer(sessions, members),
    carbonByModel: computeCarbonByModel(sessions),
    benchmark: computeTeamBenchmark(benchmarks, members),
    engineerBenchmarks: computeEngineerBenchmarks(benchmarks, members),
    adoption: computeAdoption(sessions, members, benchmarks),
  };

  serverCache.set(cacheKey, data, 300); // 5 min TTL

  const body = JSON.stringify(data);
  const etag = `"${createHash("md5").update(body).digest("hex")}"`;
  if (request.headers.get("if-none-match") === etag) {
    return new NextResponse(null, { status: 304 });
  }
  const response = new NextResponse(body, {
    headers: { "Content-Type": "application/json" },
  });
  response.headers.set("Cache-Control", "private, max-age=120, stale-while-revalidate=600");
  response.headers.set("ETag", etag);
  response.headers.set("X-Cache", "MISS");
  return response;
}
