import type { ModelPricing } from "./team-types";

/** Per-million-token pricing */
export const MODEL_PRICING: Record<string, ModelPricing> = {
  "claude-opus-4-6": { input: 15, output: 75 },
  "claude-sonnet-4-6": { input: 3, output: 15 },
  "claude-sonnet-4-5-20250514": { input: 3, output: 15 },
  "claude-haiku-4-5-20251001": { input: 0.8, output: 4 },
  "claude-3-5-sonnet-20241022": { input: 3, output: 15 },
  "claude-3-5-haiku-20241022": { input: 0.8, output: 4 },
  "claude-sonnet-4-20250514": { input: 3, output: 15 },
};

/** Estimated GPU power per model (for carbon calculations) */
export const MODEL_POWER: Record<string, { gpu_power_w: number; gpu_count: number }> = {
  "claude-opus-4-6": { gpu_power_w: 700, gpu_count: 8 },
  "claude-sonnet-4-6": { gpu_power_w: 400, gpu_count: 4 },
  "claude-sonnet-4-5-20250514": { gpu_power_w: 400, gpu_count: 4 },
  "claude-haiku-4-5-20251001": { gpu_power_w: 300, gpu_count: 2 },
  "claude-3-5-sonnet-20241022": { gpu_power_w: 400, gpu_count: 4 },
  "claude-3-5-haiku-20241022": { gpu_power_w: 300, gpu_count: 2 },
  "claude-sonnet-4-20250514": { gpu_power_w: 400, gpu_count: 4 },
};

export function calculateCost(inputTokens: number, outputTokens: number, model: string): number {
  const pricing = MODEL_PRICING[model] ?? MODEL_PRICING["claude-sonnet-4-6"];
  return (inputTokens / 1_000_000) * pricing.input + (outputTokens / 1_000_000) * pricing.output;
}

export function formatCost(usd: number): string {
  if (usd >= 1000) return `$${(usd / 1000).toFixed(1)}K`;
  if (usd >= 1) return `$${usd.toFixed(2)}`;
  if (usd >= 0.01) return `$${usd.toFixed(2)}`;
  return `$${usd.toFixed(4)}`;
}

export function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

/** Short display name for a model ID */
export function modelDisplayName(model: string): string {
  if (model.includes("opus")) return "Opus";
  if (model.includes("haiku")) return "Haiku";
  if (model.includes("sonnet")) return "Sonnet";
  return model;
}
