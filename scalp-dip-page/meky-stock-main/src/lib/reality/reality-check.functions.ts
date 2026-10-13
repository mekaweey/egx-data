import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type RealityBreakdown = {
  signal: string;
  total: number;
  wins: number;
  losses: number;
  expired: number;
  win_rate: number;
  avg_pct: number;
  best_pct: number;
  worst_pct: number;
  expectancy: number;
};

export type RealityByConfidence = {
  bucket: string;
  total: number;
  win_rate: number;
  avg_pct: number;
};

export type RealityTopSymbol = {
  symbol: string;
  total: number;
  win_rate: number;
  avg_pct: number;
};

export type RealityReport = {
  generatedAt: string;
  total: number;
  evaluated: number;
  pending: number;
  overallWinRate: number;
  overallAvgPct: number;
  totalReturnPct: number;
  bySignal: RealityBreakdown[];
  byConfidence: RealityByConfidence[];
  topWinners: RealityTopSymbol[];
  topLosers: RealityTopSymbol[];
  verdict: {
    ar: string;
    severity: "good" | "warn" | "bad";
  };
};

type Row = {
  symbol: string;
  signal: string;
  confidence: number;
  outcome: string;
  realized_pct: number | null;
};

function bucketOf(c: number) {
  if (c >= 80) return "80-100";
  if (c >= 70) return "70-79";
  if (c >= 60) return "60-69";
  if (c >= 50) return "50-59";
  return "<50";
}

function summarize(rows: Row[]): Omit<RealityBreakdown, "signal"> {
  const total = rows.length;
  const wins = rows.filter((r) => r.outcome === "target_hit").length;
  const losses = rows.filter((r) => r.outcome === "stop_hit").length;
  const expired = rows.filter((r) => r.outcome === "expired").length;
  const pcts = rows.map((r) => Number(r.realized_pct ?? 0));
  const avg = pcts.length ? pcts.reduce((a, b) => a + b, 0) / pcts.length : 0;
  const winPcts = rows.filter((r) => r.outcome === "target_hit").map((r) => Number(r.realized_pct ?? 0));
  const lossPcts = rows.filter((r) => r.outcome === "stop_hit").map((r) => Number(r.realized_pct ?? 0));
  const avgWin = winPcts.length ? winPcts.reduce((a, b) => a + b, 0) / winPcts.length : 0;
  const avgLoss = lossPcts.length ? lossPcts.reduce((a, b) => a + b, 0) / lossPcts.length : 0;
  const winRate = total ? wins / (wins + losses || 1) : 0;
  const expectancy = winRate * avgWin + (1 - winRate) * avgLoss;
  return {
    total,
    wins,
    losses,
    expired,
    win_rate: Math.round(winRate * 1000) / 10,
    avg_pct: Math.round(avg * 100) / 100,
    best_pct: pcts.length ? Math.max(...pcts) : 0,
    worst_pct: pcts.length ? Math.min(...pcts) : 0,
    expectancy: Math.round(expectancy * 100) / 100,
  };
}

export const getRealityCheck = createServerFn({ method: "GET" }).handler(async (): Promise<RealityReport> => {
  // Pull all recommendations (paginated)
  const rows: Row[] = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabaseAdmin
      .from("recommendations")
      .select("symbol, signal, confidence, outcome, realized_pct")
      .order("created_at", { ascending: false })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    rows.push(...(data as Row[]));
    if (data.length < PAGE) break;
  }

  const total = rows.length;
  const evaluated = rows.filter((r) => r.outcome !== "pending");
  const pending = total - evaluated.length;

  // Overall
  const overall = summarize(evaluated);

  // By signal
  const signals = Array.from(new Set(evaluated.map((r) => r.signal)));
  const bySignal: RealityBreakdown[] = signals
    .map((sig) => ({ signal: sig, ...summarize(evaluated.filter((r) => r.signal === sig)) }))
    .sort((a, b) => b.total - a.total);

  // By confidence bucket
  const buckets = ["80-100", "70-79", "60-69", "50-59", "<50"];
  const byConfidence: RealityByConfidence[] = buckets
    .map((b) => {
      const sub = evaluated.filter((r) => bucketOf(r.confidence) === b);
      if (sub.length === 0) return null;
      const s = summarize(sub);
      return { bucket: b, total: s.total, win_rate: s.win_rate, avg_pct: s.avg_pct };
    })
    .filter((x): x is RealityByConfidence => x !== null);

  // Top winners/losers by symbol (min 3 trades)
  const bySym = new Map<string, Row[]>();
  for (const r of evaluated) {
    const arr = bySym.get(r.symbol) ?? [];
    arr.push(r);
    bySym.set(r.symbol, arr);
  }
  const symbolStats = Array.from(bySym.entries())
    .filter(([, arr]) => arr.length >= 3)
    .map(([symbol, arr]) => {
      const s = summarize(arr);
      return { symbol, total: s.total, win_rate: s.win_rate, avg_pct: s.avg_pct };
    });
  const topWinners = [...symbolStats].sort((a, b) => b.avg_pct - a.avg_pct).slice(0, 5);
  const topLosers = [...symbolStats].sort((a, b) => a.avg_pct - b.avg_pct).slice(0, 5);

  // Verdict
  let verdict: RealityReport["verdict"];
  if (overall.win_rate >= 55 && overall.avg_pct > 0) {
    verdict = { ar: "النظام مربح حالياً ✅ — استمر بحذر وكمّل التحسين", severity: "good" };
  } else if (overall.win_rate >= 45) {
    verdict = { ar: "النظام شبه متعادل ⚠️ — محتاج تحسين قبل ما تتداول بفلوس حقيقية", severity: "warn" };
  } else {
    verdict = { ar: "النظام خاسر حالياً ❌ — ممنوع التداول الحقيقي. لازم نعيد بناء الاستراتيجية", severity: "bad" };
  }

  return {
    generatedAt: new Date().toISOString(),
    total,
    evaluated: evaluated.length,
    pending,
    overallWinRate: overall.win_rate,
    overallAvgPct: overall.avg_pct,
    totalReturnPct: Math.round(evaluated.reduce((a, r) => a + Number(r.realized_pct ?? 0), 0) * 100) / 100,
    bySignal,
    byConfidence,
    topWinners,
    topLosers,
    verdict,
  };
});