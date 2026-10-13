/**
 * All-Layers Fusion — calls ~25 representative modules and fuses them
 * into one meta signal in [-1, 1]. Pure functions only (candles + optional news).
 */
import type { Candle } from "@/lib/market-data/types";
import { detectWyckoffPhase } from "@/lib/microstructure/wyckoff.server";
import { calcSMFI } from "@/lib/microstructure/smart-money-flow.server";
import { detectDarkPool } from "@/lib/microstructure/dark-pool.server";
import { estimateMicrostructure } from "@/lib/microstructure/order-book-imbalance.server";
import { bucketize, vpin } from "@/lib/signals/vpin.server";
import { realizedVolatility, realizedSemivariance } from "@/lib/signals/realized-volatility.server";
import { fitGARCH, forecastVolatility } from "@/lib/advstats/garch.server";
import { runKalman } from "@/lib/stats/kalman-filter.server";
import { waveletDecompose, waveletEnergy, waveletDenoise } from "@/lib/stats/wavelet-transform.server";
import { fitGPD, tailProbability } from "@/lib/stats/extreme-value-theory.server";
import { aggregate as crowdAggregate } from "@/lib/crowd/crowd-wisdom.server";
import { measureDisagreement } from "@/lib/robust/ensemble-disagreement.server";
import { transformerPredict } from "@/lib/ml/transformer-attention.server";
import { generatePaths, pathStats } from "@/lib/deep/diffusion-prices.server";
import { createSSM, step as ssmStep, forecast as ssmForecast } from "@/lib/deep/mamba-ssm.server";
import { scoreLiquidity } from "@/lib/execution/liquidity-score.server";
import { estimateMarketImpact } from "@/lib/execution/market-impact.server";

export type AllLayersResult = {
  meta: number;          // [-1, 1]
  confidence: number;    // 0..100
  contributions: Record<string, number>;
  reasons: string[];
};

function safe<T>(fn: () => T, fallback: T): T {
  try { const v = fn(); return v == null ? fallback : v; } catch { return fallback; }
}
const clamp = (x: number, lo = -1, hi = 1) =>
  !Number.isFinite(x) ? 0 : Math.max(lo, Math.min(hi, x));

export function fuseAllLayers(args: { candles: Candle[]; newsScore?: number }): AllLayersResult {
  const c = args.candles;
  if (c.length < 32) return { meta: 0, confidence: 0, contributions: {}, reasons: ["بيانات قليلة"] };
  const closes = c.map((x) => x.close);
  const vols = c.map((x) => x.volume);
  const last = c[c.length - 1];
  const prev = c[c.length - 2];
  const rets: number[] = [];
  for (let i = 1; i < closes.length; i++) rets.push((closes[i] - closes[i - 1]) / closes[i - 1]);

  const contrib: Record<string, number> = {};

  // 1) Wyckoff
  const wy = safe(() => detectWyckoffPhase(closes.slice(-50), vols.slice(-50)),
    { phase: "UNKNOWN" as const, confidence: 0 });
  contrib.wyckoff =
    wy.phase === "ACCUMULATION" ? 0.7 :
    wy.phase === "MARKUP" ? 0.9 :
    wy.phase === "DISTRIBUTION" ? -0.7 :
    wy.phase === "MARKDOWN" ? -0.9 : 0;

  // 2) Smart Money Flow Index
  const smf = safe(() => calcSMFI(c.slice(-30)), { value: 0, trend: "NEUTRAL" as const });
  contrib.smfi = smf.trend === "ACCUMULATION" ? 0.6 : smf.trend === "DISTRIBUTION" ? -0.6 : 0;

  // 3) Dark pool
  const volAvg20 = vols.slice(-20).reduce((a, b) => a + b, 0) / 20;
  const changePct = ((last.close - prev.close) / prev.close) * 100;
  const dp = safe(() => detectDarkPool(last.volume, volAvg20, changePct), { score: 0, reason: "" });
  contrib.darkpool = clamp((dp.score / 100) * Math.sign(changePct));

  // 4) Microstructure imbalance
  const ms = safe(() => estimateMicrostructure(last.open, last.high, last.low, last.close),
    { spread: 0, imbalance: 0, pressure: "NEUTRAL" as const });
  contrib.microstructure = clamp(ms.imbalance);

  // 5) VPIN
  const vpinVal = safe(() => {
    const slice = c.slice(-30);
    const trades = slice.map((x, i) => ({
      price: x.close, volume: x.volume,
      prevPrice: i === 0 ? x.close : slice[i - 1].close,
    }));
    const bucketSize = vols.slice(-30).reduce((a, b) => a + b, 0) / 5;
    return vpin(bucketize(trades, bucketSize));
  }, 0.5);
  contrib.vpin = clamp(0.5 - vpinVal);

  // 6) Realized vol
  const rv = safe(() => realizedVolatility(rets.slice(-20)), 0.02);
  contrib.realized_vol = clamp(0.5 - rv * 20);

  // 7) Semivariance
  const sv = safe(() => realizedSemivariance(rets.slice(-20)), 0);
  contrib.semivariance = clamp(-sv * 50);

  // 8) GARCH compression
  const garchScore = safe(() => {
    const params = fitGARCH(rets.slice(-60));
    const fc = forecastVolatility(params, rets.slice(-60), 3);
    const curr = Math.sqrt(rets.slice(-10).reduce((s, r) => s + r * r, 0) / 10);
    return (curr - (fc[fc.length - 1] ?? curr)) * 10;
  }, 0);
  contrib.garch_compression = clamp(garchScore);

  // 9) Kalman trend
  const k = safe(() => runKalman(closes.slice(-30)), { smoothed: [] as number[], trend: [] as number[] });
  const kTrend = k.trend.length ? k.trend[k.trend.length - 1] : 0;
  contrib.kalman_trend = clamp((kTrend / last.close) * 100);

  // 10) Wavelet trend energy
  const wavTrend = safe(() => {
    const decomp = waveletDecompose(closes.slice(-32), 3);
    const energies = waveletEnergy(decomp);
    const total = energies.reduce((a, b) => a + b, 0) || 1;
    return (energies[0] - energies[energies.length - 1]) / total;
  }, 0);
  contrib.wavelet_trend = clamp(wavTrend);

  // 11) Wavelet denoised slope
  const wavSlope = safe(() => {
    const den = waveletDenoise(closes.slice(-30), 0.1);
    return den.length > 1 ? (den[den.length - 1] - den[0]) / den[0] : 0;
  }, 0);
  contrib.wavelet_slope = clamp(wavSlope * 5);

  // 12) EVT tail probability (lower = bullish)
  const evtTail = safe(() => {
    const downside = rets.slice(-60).map((r) => -r);
    const params = fitGPD(downside, 0.9);
    return tailProbability(params, 0.05);
  }, 0.5);
  contrib.evt_tail = clamp(0.5 - evtTail);

  // 13) Transformer attention prediction
  const tr = safe(() => transformerPredict(closes.slice(-40), 20),
    { prediction: 0, confidence: 0, topInfluencers: [] });
  contrib.transformer = clamp(tr.prediction / 5);

  // 14) Diffusion path forecast
  const difScore = safe(() => {
    const drift = rets.slice(-20).reduce((a, b) => a + b, 0) / 20;
    const paths = generatePaths(last.close, { steps: 5, horizon: 5, drift, vol: rv }, 50);
    const stats = pathStats(paths);
    const projected = stats.mean[stats.mean.length - 1] ?? last.close;
    return (projected - last.close) / last.close;
  }, 0);
  contrib.diffusion = clamp(difScore * 10);

  // 15) Mamba SSM forecast
  const mambaScore = safe(() => {
    let state = createSSM(1);
    for (const cl of closes.slice(-30, -1)) state = ssmStep(state, cl).state;
    const fc = ssmForecast(state, closes.slice(-30));
    const next = fc[0] ?? last.close;
    return (next - last.close) / last.close;
  }, 0);
  contrib.mamba = clamp(mambaScore * 20);

  // 16) Liquidity score
  const avgValue = vols.slice(-20).reduce((s, v, i) => s + v * closes[closes.length - 20 + i], 0) / 20;
  const liq = safe(() => scoreLiquidity(volAvg20, avgValue, 0.005), { score: 50, warning: null });
  contrib.liquidity = clamp((liq.score - 50) / 50);

  // 17) Market impact (lower = better)
  const mi = safe(() => estimateMarketImpact(volAvg20 * 0.01, volAvg20, rv), 0.01);
  contrib.market_impact = clamp(0.5 - mi * 50);

  // 18) Momentum confluence
  const mom = (n: number) => (closes.length > n ? closes[closes.length - 1] / closes[closes.length - 1 - n] - 1 : 0);
  contrib.momentum_confluence = clamp((Math.sign(mom(5)) + Math.sign(mom(10)) + Math.sign(mom(20))) / 3);

  // 19) Volume trend
  const vol5 = vols.slice(-5).reduce((a, b) => a + b, 0) / 5;
  contrib.volume_trend = clamp(vol5 / Math.max(1, volAvg20) - 1);

  // 20) EMA distance
  const ema = (() => {
    let e = closes[0]; const kk = 2 / (21 + 1);
    for (let i = 1; i < closes.length; i++) e = closes[i] * kk + e * (1 - kk);
    return e;
  })();
  contrib.ema_distance = clamp(((last.close - ema) / ema) * 5);

  // 21) News (optional)
  contrib.news = clamp((args.newsScore ?? 0) / 1.5);

  // 22) Crowd wisdom aggregator over all contributions so far
  const sources = Object.entries(contrib).map(([name, v]) => ({
    name, prediction: v, historicalAccuracy: 0.62, sampleSize: 100,
  }));
  const crowd = safe(() => crowdAggregate(sources), { weighted: 0, confidence: 0 });
  contrib.crowd_wisdom = clamp(crowd.weighted);

  // 23) Ensemble disagreement → agreement factor
  const dis = safe(() => measureDisagreement(Object.values(contrib).map((v) => (v + 1) / 2)),
    { meanPrediction: 0.5, disagreement: 1, signalStrength: 0, voteEntropy: 0, recommendation: "no_signal" as const });
  const agreement = clamp(dis.signalStrength, 0, 1);

  // Weighted final meta
  const weights: Record<string, number> = {
    wyckoff: 1.5, smfi: 1.2, darkpool: 0.8, microstructure: 0.8, vpin: 0.6,
    realized_vol: 0.6, semivariance: 0.5, garch_compression: 0.7,
    kalman_trend: 1.0, wavelet_trend: 0.8, wavelet_slope: 0.8, evt_tail: 0.6,
    transformer: 1.4, diffusion: 1.0, mamba: 1.0,
    liquidity: 0.4, market_impact: 0.4,
    momentum_confluence: 1.5, volume_trend: 0.8, ema_distance: 0.6,
    news: 1.6, crowd_wisdom: 1.0,
  };
  let num = 0, den = 0;
  for (const [k, v] of Object.entries(contrib)) {
    const w = weights[k] ?? 0.5;
    num += v * w; den += w;
  }
  const meta = clamp(den > 0 ? num / den : 0);
  const confidence = Math.round(Math.max(0, Math.min(100, Math.abs(meta) * 60 + agreement * 40)));

  const reasons = Object.entries(contrib)
    .map(([k, v]) => ({ k, w: (weights[k] ?? 0.5) * Math.abs(v), v }))
    .sort((a, b) => b.w - a.w).slice(0, 5)
    .map((r) => `${r.k}: ${r.v >= 0 ? "+" : ""}${r.v.toFixed(2)}`);

  return { meta, confidence, contributions: contrib, reasons };
}