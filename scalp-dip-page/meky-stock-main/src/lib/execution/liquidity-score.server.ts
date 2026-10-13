/**
 * #20 Liquidity Scoring: تجنب أسهم صعب الخروج منها.
 */
export interface LiquidityScore { score: number; warning: string | null }

export function scoreLiquidity(avgVolume: number, avgValue: number, spread: number): LiquidityScore {
  let score = 100;
  let warning: string | null = null;
  if (avgValue < 1_000_000) { score -= 40; warning = "سيولة ضعيفة جداً" }
  else if (avgValue < 5_000_000) { score -= 20; warning = "سيولة متوسطة" }
  if (spread > 0.02) score -= 20;
  if (avgVolume < 50_000) score -= 20;
  return { score: Math.max(0, score), warning };
}