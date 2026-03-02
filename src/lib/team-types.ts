// ─── Team & membership ───

export interface Team {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  plan: "free" | "pro";
  codecarbon_org_id: string | null;
  created_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  github_username: string;
  github_avatar_url: string | null;
  display_name: string | null;
  role: "owner" | "member";
  joined_at: string;
}

export interface TeamInvite {
  id: string;
  team_id: string;
  github_username: string;
  invited_by: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
}

// ─── Session & benchmark data ───

export interface SessionSummary {
  id: string;
  engineer_id: string;
  team_id: string;
  project_name: string;
  start_time: string;
  end_time: string;
  duration_ms: number;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens: number;
  cost_usd: number;
  message_count: number;
  tool_call_count: number;
  is_ham_on: boolean;
  files_read_count: number;
  energy_wh: number;
  co2e_grams: number;
  codecarbon_run_id: string | null;
  synced_at: string;
}

export interface BenchmarkTask {
  id: string;
  engineer_id: string;
  team_id: string;
  project_name: string;
  timestamp: string;
  duration_sec: number;
  tokens: number;
  cache_read_tokens: number;
  model: string;
  ham_active: boolean;
  cost_usd: number;
  co2e_grams: number;
  synced_at: string;
}

// ─── Model pricing ───

export type ModelKey =
  | "claude-opus-4-6"
  | "claude-sonnet-4-6"
  | "claude-sonnet-4-5-20250514"
  | "claude-haiku-4-5-20251001"
  | "claude-3-5-sonnet-20241022"
  | "claude-3-5-haiku-20241022"
  | "claude-sonnet-4-20250514";

export interface ModelPricing {
  input: number;
  output: number;
}

// ─── Aggregated stats ───

export interface TeamTotals {
  totalSpend: number;
  totalTokens: number;
  activeEngineers: number;
  avgCostPerEngineer: number;
  totalCo2eGrams: number;
}

export interface DailySpend {
  date: string;
  total: number;
  opus: number;
  sonnet: number;
  haiku: number;
}

export interface EngineerSpend {
  engineerId: string;
  displayName: string;
  githubUsername: string;
  githubAvatarUrl: string | null;
  sessions: number;
  tokens: number;
  cost: number;
  co2eGrams: number;
  avgCostPerSession: number;
  primaryModel: string;
  flags: string[];
}

export interface ProjectSpend {
  projectName: string;
  engineers: number;
  sessions: number;
  tokens: number;
  cost: number;
  co2eGrams: number;
  topModel: string;
}

export interface ModelSpend {
  model: string;
  sessions: number;
  tokens: number;
  cost: number;
  percentOfSpend: number;
  status: "Expensive" | "Efficient" | "Budget";
}

// ─── Carbon ───

export interface CarbonMetrics {
  totalCo2eGrams: number;
  totalEnergyWh: number;
  co2eSavedGrams: number;
  equivalentCharges: number;
}

export interface CarbonByEngineer {
  engineerId: string;
  displayName: string;
  co2eGrams: number;
  energyWh: number;
}

export interface CarbonByModel {
  model: string;
  co2eGrams: number;
  energyWh: number;
}

// ─── Benchmarks ───

export interface BenchmarkComparison {
  avgTokenReduction: number;
  avgTimeReduction: number;
  avgCacheImprovement: number;
  totalTasks: number;
  rows: { metric: string; baseline: string; hamActive: string; change: string }[];
}

export interface EngineerBenchmark {
  engineerId: string;
  displayName: string;
  githubUsername: string;
  status: BenchmarkStatus;
  baselineTasks: number;
  hamTasks: number;
  tokenReduction: number | null;
  timeReduction: number | null;
}

export type BenchmarkStatus = "Proven" | "Baseline in progress" | "Not started";

// ─── Adoption ───

export interface AdoptionMetrics {
  hamAdoptionRate: number;
  estimatedSavings: number;
  benchmarkCompletion: number;
  engineersNotUsingHam: string[];
}

// ─── Shared ───

export type TimeRange = 7 | 14 | 30 | 90;

export interface TeamDashboardData {
  team: Team;
  members: TeamMember[];
  totals: TeamTotals;
  dailySpend: DailySpend[];
  engineerSpend: EngineerSpend[];
  projectSpend: ProjectSpend[];
  modelSpend: ModelSpend[];
  carbon: CarbonMetrics;
  carbonByEngineer: CarbonByEngineer[];
  carbonByModel: CarbonByModel[];
  benchmark: BenchmarkComparison;
  engineerBenchmarks: EngineerBenchmark[];
  adoption: AdoptionMetrics;
}
