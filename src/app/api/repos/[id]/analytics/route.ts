import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getUser, isSupabaseConfigured } from "@/lib/auth";
import { serverCache } from "@/lib/cache";
import { MOCK_CONNECTED_REPOS } from "@/lib/seed-data";
import {
  computeTeamTotals,
  computeDailySpend,
  computeModelSpend,
  computeCarbonMetrics,
  computeCarbonByModel,
} from "@/lib/team-stats";
import { computeTeamBenchmark } from "@/lib/benchmark-stats";
import type { TimeRange, SessionSummary } from "@/lib/team-types";

const EMPTY_RESPONSE = { empty: true as const };

function sessionCounts(sessions: SessionSummary[]) {
  return {
    totalSessions: sessions.length,
    totalMessages: sessions.reduce((sum, s) => sum + s.message_count, 0),
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const days = (parseInt(request.nextUrl.searchParams.get("days") ?? "30") || 30) as TimeRange;

  // Dev mode — no real data available
  if (!isSupabaseConfigured()) {
    return NextResponse.json(EMPTY_RESPONSE);
  }

  // Check in-memory cache
  const cacheKey = `repo-analytics:${id}:${days}`;
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

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    // Look up repo name and team membership in parallel
    const [{ data: repo }, { data: membership }] = await Promise.all([
      supabase.from("connected_repos").select("name").eq("id", id).eq("user_id", user.id).single(),
      supabase.from("team_members").select("team_id").eq("user_id", user.id).single(),
    ]);

    if (!repo?.name) {
      const mockRepo = MOCK_CONNECTED_REPOS.find((r) => r.id === id);
      if (!mockRepo) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(EMPTY_RESPONSE);
    }

    if (!membership) {
      return NextResponse.json(EMPTY_RESPONSE);
    }

    const repoName = repo.name;
    const teamId = membership.team_id;

    // Push time filter to database instead of filtering in JS
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const [membersRes, sessionsRes, benchmarksRes] = await Promise.all([
      supabase.from("team_members").select("*").eq("team_id", teamId),
      supabase.from("session_summaries").select("*").eq("team_id", teamId).eq("project_name", repoName).gte("start_time", cutoff.toISOString()),
      supabase.from("benchmark_tasks").select("*").eq("team_id", teamId).eq("project_name", repoName),
    ]);

    const members = membersRes.data ?? [];
    const sessions = sessionsRes.data ?? [];
    const benchmarks = benchmarksRes.data ?? [];

    if (sessions.length === 0 && benchmarks.length === 0) {
      return NextResponse.json(EMPTY_RESPONSE);
    }

    const data = {
      empty: false,
      totals: computeTeamTotals(sessions, members),
      ...sessionCounts(sessions),
      dailySpend: computeDailySpend(sessions, days),
      modelSpend: computeModelSpend(sessions),
      carbon: computeCarbonMetrics(sessions),
      carbonByModel: computeCarbonByModel(sessions),
      benchmark: computeTeamBenchmark(benchmarks, members),
    };

    serverCache.set(cacheKey, data, 180); // 3 min TTL

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
  } catch {
    return NextResponse.json(EMPTY_RESPONSE);
  }
}
