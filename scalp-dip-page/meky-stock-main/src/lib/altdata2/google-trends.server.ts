/**
 * Google Trends: public interest in a stock or company.
 */

export interface TrendsPoint {
  date: string;
  interest: number; // 0-100
}

export interface TrendsSignal {
  current: number;
  zScore: number;
  momentum: number;
  signal: "surge" | "rising" | "stable" | "declining";
  retailAttention: "extreme" | "high" | "normal" | "low";
}

export function analyzeTrends(history: TrendsPoint[]): TrendsSignal {
  if (history.length === 0) {
    return { current: 0, zScore: 0, momentum: 0, signal: "stable", retailAttention: "low" };
  }
  const values = history.map((p) => p.interest);
  const current = values[values.length - 1];
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const std = Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length);
  const z = std === 0 ? 0 : (current - mean) / std;

  const recent = values.slice(-7);
  const older = values.slice(-14, -7);
  const recentAvg = recent.reduce((a, b) => a + b, 0) / Math.max(recent.length, 1);
  const olderAvg = older.reduce((a, b) => a + b, 0) / Math.max(older.length, 1);
  const momentum = olderAvg === 0 ? 0 : (recentAvg - olderAvg) / olderAvg;

  let signal: TrendsSignal["signal"] = "stable";
  if (z > 2 && momentum > 0.3) signal = "surge";
  else if (momentum > 0.1) signal = "rising";
  else if (momentum < -0.1) signal = "declining";

  let retailAttention: TrendsSignal["retailAttention"] = "normal";
  if (current > 80) retailAttention = "extreme";
  else if (current > 50) retailAttention = "high";
  else if (current < 20) retailAttention = "low";

  return { current, zScore: z, momentum, signal, retailAttention };
}

/** Note: Real implementation would call SerpAPI / Google Trends scraper.
 *  This module accepts pre-fetched data and analyzes it. */