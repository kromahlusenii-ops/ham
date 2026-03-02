import { NextResponse } from "next/server";
import { getUser, getGhToken } from "@/lib/auth";
import { serverCache } from "@/lib/cache";
import { fetchUserRepos } from "@/lib/github";

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await getGhToken();
  if (!token) {
    return NextResponse.json(
      { error: "no_github_token" },
      { status: 401 },
    );
  }

  // Check in-memory cache
  const cacheKey = `github-repos:${user.id}`;
  const cached = serverCache.get<{ repos: unknown[] }>(cacheKey);
  if (cached) {
    const response = NextResponse.json(cached);
    response.headers.set("Cache-Control", "private, max-age=60, stale-while-revalidate=300");
    return response;
  }

  try {
    const repos = await fetchUserRepos(token);
    const data = { repos };
    serverCache.set(cacheKey, data, 120); // 2 min TTL
    const response = NextResponse.json(data);
    response.headers.set("Cache-Control", "private, max-age=60, stale-while-revalidate=300");
    return response;
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch GitHub repos" },
      { status: 502 },
    );
  }
}
