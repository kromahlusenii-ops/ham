import { homedir } from 'os';
import { join } from 'path';

// Model pricing per million tokens (input)
export const MODEL_PRICING = {
  'claude-opus-4-6': { input: 15, output: 75 },
  'claude-sonnet-4-6': { input: 3, output: 15 },
  'claude-sonnet-4-5-20250514': { input: 3, output: 15 },
  'claude-haiku-4-5-20251001': { input: 0.8, output: 4 },
  // Older models
  'claude-3-5-sonnet-20241022': { input: 3, output: 15 },
  'claude-3-5-haiku-20241022': { input: 0.8, output: 4 },
  'claude-sonnet-4-20250514': { input: 3, output: 15 },
};

/**
 * Get the Claude projects directory for a given project path
 */
export function getProjectSessionDir(projectPath) {
  const encoded = projectPath.replace(/\//g, '-');
  return join(homedir(), '.claude', 'projects', encoded);
}

/**
 * Calculate cost in dollars from token counts and model
 */
export function calculateCost(inputTokens, outputTokens, model) {
  const pricing = MODEL_PRICING[model] || MODEL_PRICING['claude-sonnet-4-6'];
  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;
  return inputCost + outputCost;
}

/**
 * Format a date string to YYYY-MM-DD
 */
export function toDateKey(timestamp) {
  const d = new Date(timestamp);
  return d.toISOString().slice(0, 10);
}

/**
 * Estimate token count from file content length (~4 chars per token)
 */
export function estimateTokens(charCount) {
  return Math.ceil(charCount / 4);
}

/**
 * Source file extensions to look for when checking directory health
 */
export const SOURCE_EXTENSIONS = new Set([
  '.js', '.jsx', '.ts', '.tsx', '.py', '.swift', '.kt',
  '.dart', '.go', '.rs', '.java', '.c', '.cpp', '.h',
  '.rb', '.php', '.cs', '.vue', '.svelte',
]);
