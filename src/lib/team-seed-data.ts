import type {
  Team,
  TeamMember,
  TeamInvite,
  SessionSummary,
  BenchmarkTask,
} from "./team-types";
import { calculateCost } from "./model-pricing";
import { calculateEnergy, calculateEmissions } from "./carbon";

// ─── Deterministic seeded random ───

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ─── Team ───

export const MOCK_TEAM: Team = {
  id: "team-001",
  name: "Acme Engineering",
  slug: "acme-eng",
  owner_id: "dev-local-user-001",
  plan: "pro",
  codecarbon_org_id: null,
  created_at: "2026-01-15T00:00:00Z",
};

// ─── Members ───

export const MOCK_TEAM_MEMBERS: TeamMember[] = [
  { id: "mem-001", team_id: "team-001", user_id: "dev-local-user-001", github_username: "alexchen", github_avatar_url: "https://i.pravatar.cc/150?u=alexchen", display_name: "Alex Chen", role: "owner", joined_at: "2026-01-15T00:00:00Z" },
  { id: "mem-002", team_id: "team-001", user_id: "user-002", github_username: "sarahm", github_avatar_url: "https://i.pravatar.cc/150?u=sarahm", display_name: "Sarah Miller", role: "member", joined_at: "2026-01-16T00:00:00Z" },
  { id: "mem-003", team_id: "team-001", user_id: "user-003", github_username: "jpark", github_avatar_url: "https://i.pravatar.cc/150?u=jpark", display_name: "James Park", role: "member", joined_at: "2026-01-17T00:00:00Z" },
  { id: "mem-004", team_id: "team-001", user_id: "user-004", github_username: "linawu", github_avatar_url: "https://i.pravatar.cc/150?u=linawu", display_name: "Lina Wu", role: "member", joined_at: "2026-01-18T00:00:00Z" },
  { id: "mem-005", team_id: "team-001", user_id: "user-005", github_username: "marcob", github_avatar_url: "https://i.pravatar.cc/150?u=marcob", display_name: "Marco Bianchi", role: "member", joined_at: "2026-01-20T00:00:00Z" },
  { id: "mem-006", team_id: "team-001", user_id: "user-006", github_username: "priyad", github_avatar_url: "https://i.pravatar.cc/150?u=priyad", display_name: "Priya Das", role: "member", joined_at: "2026-01-22T00:00:00Z" },
  { id: "mem-007", team_id: "team-001", user_id: "user-007", github_username: "tomr", github_avatar_url: "https://i.pravatar.cc/150?u=tomr", display_name: "Tom Rodriguez", role: "member", joined_at: "2026-01-25T00:00:00Z" },
  { id: "mem-008", team_id: "team-001", user_id: "user-008", github_username: "emmak", github_avatar_url: "https://i.pravatar.cc/150?u=emmak", display_name: "Emma Kim", role: "member", joined_at: "2026-02-01T00:00:00Z" },
];

// ─── Invites ───

export const MOCK_TEAM_INVITES: TeamInvite[] = [
  { id: "inv-001", team_id: "team-001", github_username: "dannyf", invited_by: "dev-local-user-001", status: "pending", created_at: "2026-02-25T00:00:00Z" },
];

// ─── Sessions ───

const MODELS = ["claude-opus-4-6", "claude-sonnet-4-6", "claude-haiku-4-5-20251001"] as const;
const PROJECTS = ["acme-web", "acme-api", "acme-mobile", "acme-infra", "ham", "design-system"] as const;

function generateSessions(): SessionSummary[] {
  const rand = seededRandom(42);
  const sessions: SessionSummary[] = [];
  const now = new Date("2026-03-01T12:00:00Z");

  for (let day = 0; day < 30; day++) {
    const sessionsPerDay = Math.floor(rand() * 4) + 3; // 3-6 sessions per day
    for (let s = 0; s < sessionsPerDay; s++) {
      const memberIdx = Math.floor(rand() * MOCK_TEAM_MEMBERS.length);
      const member = MOCK_TEAM_MEMBERS[memberIdx];
      const modelIdx = rand() < 0.15 ? 0 : rand() < 0.6 ? 1 : 2; // 15% opus, 45% sonnet, 40% haiku
      const model = MODELS[modelIdx];
      const project = PROJECTS[Math.floor(rand() * PROJECTS.length)];

      const durationMs = Math.floor(rand() * 600_000) + 60_000; // 1-11 min
      const inputTokens = Math.floor(rand() * 80_000) + 5_000;
      const outputTokens = Math.floor(rand() * 20_000) + 1_000;
      const cacheReadTokens = Math.floor(rand() * inputTokens * 0.3);
      const costUsd = calculateCost(inputTokens, outputTokens, model);
      const energyWh = calculateEnergy(durationMs, model);
      const co2eGrams = calculateEmissions(energyWh);
      const isHamOn = rand() > 0.3; // 70% HAM on

      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - day);
      startDate.setHours(9 + Math.floor(rand() * 9), Math.floor(rand() * 60));

      const endDate = new Date(startDate.getTime() + durationMs);

      sessions.push({
        id: `sess-${day}-${s}`,
        engineer_id: member.id,
        team_id: "team-001",
        project_name: project,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        duration_ms: durationMs,
        model,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        cache_read_tokens: cacheReadTokens,
        cost_usd: Math.round(costUsd * 10000) / 10000,
        message_count: Math.floor(rand() * 30) + 5,
        tool_call_count: Math.floor(rand() * 20) + 2,
        is_ham_on: isHamOn,
        files_read_count: Math.floor(rand() * 15) + 1,
        energy_wh: Math.round(energyWh * 10000) / 10000,
        co2e_grams: Math.round(co2eGrams * 10000) / 10000,
        codecarbon_run_id: null,
        synced_at: new Date().toISOString(),
      });
    }
  }

  return sessions;
}

function generateBenchmarkTasks(): BenchmarkTask[] {
  const rand = seededRandom(99);
  const tasks: BenchmarkTask[] = [];
  const now = new Date("2026-03-01T12:00:00Z");

  // Baseline tasks (no HAM) — 80 tasks across first 6 members
  for (let i = 0; i < 80; i++) {
    const memberIdx = Math.floor(rand() * 6);
    const member = MOCK_TEAM_MEMBERS[memberIdx];
    const model = MODELS[rand() < 0.5 ? 1 : 2];
    const project = PROJECTS[Math.floor(rand() * PROJECTS.length)];

    const daysAgo = Math.floor(rand() * 30);
    const ts = new Date(now);
    ts.setDate(ts.getDate() - daysAgo);

    const durationSec = Math.floor(rand() * 300) + 30;
    const tokens = Math.floor(rand() * 60_000) + 10_000;
    const cacheReadTokens = Math.floor(rand() * tokens * 0.1);
    const costUsd = calculateCost(tokens * 0.7, tokens * 0.3, model);
    const energyWh = calculateEnergy(durationSec * 1000, model);

    tasks.push({
      id: `bench-base-${i}`,
      engineer_id: member.id,
      team_id: "team-001",
      project_name: project,
      timestamp: ts.toISOString(),
      duration_sec: durationSec,
      tokens,
      cache_read_tokens: cacheReadTokens,
      model,
      ham_active: false,
      cost_usd: Math.round(costUsd * 10000) / 10000,
      co2e_grams: Math.round(calculateEmissions(energyWh) * 10000) / 10000,
      synced_at: new Date().toISOString(),
    });
  }

  // HAM-active tasks — 167 tasks, ~40% less tokens/time
  for (let i = 0; i < 167; i++) {
    const memberIdx = Math.floor(rand() * 6);
    const member = MOCK_TEAM_MEMBERS[memberIdx];
    const model = MODELS[rand() < 0.5 ? 1 : 2];
    const project = PROJECTS[Math.floor(rand() * PROJECTS.length)];

    const daysAgo = Math.floor(rand() * 30);
    const ts = new Date(now);
    ts.setDate(ts.getDate() - daysAgo);

    const durationSec = Math.floor(rand() * 180) + 20; // shorter with HAM
    const tokens = Math.floor(rand() * 35_000) + 5_000; // fewer tokens
    const cacheReadTokens = Math.floor(rand() * tokens * 0.4); // more cache hits
    const costUsd = calculateCost(tokens * 0.7, tokens * 0.3, model);
    const energyWh = calculateEnergy(durationSec * 1000, model);

    tasks.push({
      id: `bench-ham-${i}`,
      engineer_id: member.id,
      team_id: "team-001",
      project_name: project,
      timestamp: ts.toISOString(),
      duration_sec: durationSec,
      tokens,
      cache_read_tokens: cacheReadTokens,
      model,
      ham_active: true,
      cost_usd: Math.round(costUsd * 10000) / 10000,
      co2e_grams: Math.round(calculateEmissions(energyWh) * 10000) / 10000,
      synced_at: new Date().toISOString(),
    });
  }

  return tasks;
}

export const MOCK_SESSION_SUMMARIES = generateSessions();
export const MOCK_BENCHMARK_TASKS = generateBenchmarkTasks();
