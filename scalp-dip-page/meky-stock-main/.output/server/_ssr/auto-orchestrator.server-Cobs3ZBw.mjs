import { supabaseAdmin } from "./client.server-D5ro3rAQ.mjs";
import { c as chatWithFallback } from "./chat-fallback.server-HMcdWJQs.mjs";
import { olScoreNudge, ragQuerySimilarNews } from "./tier-k-intelligence.server-IqAM99dH.mjs";
function bucketize(trades, bucketSize) {
  const buckets2 = [];
  let cur = { buyVolume: 0, sellVolume: 0 };
  let acc = 0;
  for (const t of trades) {
    const isBuy = t.price >= t.prevPrice;
    if (isBuy) cur.buyVolume += t.volume;
    else cur.sellVolume += t.volume;
    acc += t.volume;
    if (acc >= bucketSize) {
      buckets2.push(cur);
      cur = { buyVolume: 0, sellVolume: 0 };
      acc = 0;
    }
  }
  if (cur.buyVolume + cur.sellVolume > 0) buckets2.push(cur);
  return buckets2;
}
function vpin(buckets2) {
  if (buckets2.length === 0) return 0;
  const sum = buckets2.reduce((s, b) => s + Math.abs(b.buyVolume - b.sellVolume), 0);
  const totalVol = buckets2.reduce((s, b) => s + b.buyVolume + b.sellVolume, 0);
  return totalVol === 0 ? 0 : sum / totalVol;
}
function toxicityLabel(v) {
  if (v < 0.4) return "low";
  if (v < 0.6) return "elevated";
  return "high";
}
function realizedVolatility(intradayReturns) {
  if (intradayReturns.length < 2) return 0;
  const sumSq = intradayReturns.reduce((s, r) => s + r * r, 0);
  return Math.sqrt(sumSq);
}
function realizedSemivariance(intradayReturns) {
  const negs = intradayReturns.filter((r) => r < 0);
  return Math.sqrt(negs.reduce((s, r) => s + r * r, 0));
}
function createSSM(dim) {
  return {
    hidden: new Array(dim).fill(0),
    A: new Array(dim).fill(0).map(() => 0.9 + Math.random() * 0.09),
    B: new Array(dim).fill(0).map(() => Math.random() * 0.1),
    C: new Array(dim).fill(0).map(() => Math.random() * 0.1)
  };
}
function step(state2, x) {
  const newHidden = state2.hidden.map((h, i) => state2.A[i] * h + state2.B[i] * x);
  const y = newHidden.reduce((s, h, i) => s + state2.C[i] * h, 0);
  return { state: { ...state2, hidden: newHidden }, y };
}
function forecast(state2, series) {
  let cur = state2;
  const out = [];
  for (const x of series) {
    const r = step(cur, x);
    cur = r.state;
    out.push(r.y);
  }
  return out;
}
function softmax(xs) {
  const m = Math.max(...xs);
  const exps = xs.map((x) => Math.exp(x - m));
  const s = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / s);
}
function buildMixture(rawPi, mus, sigmas) {
  const pis = softmax(rawPi);
  return pis.map((pi, i) => ({ pi, mu: mus[i], sigma: Math.max(1e-4, sigmas[i]) }));
}
function expectedValue(comps) {
  return comps.reduce((s, c) => s + c.pi * c.mu, 0);
}
function variance$a(comps) {
  const ev = expectedValue(comps);
  return comps.reduce((s, c) => s + c.pi * (c.sigma * c.sigma + (c.mu - ev) ** 2), 0);
}
function randn() {
  const u = 1 - Math.random();
  const v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
function generatePaths(startPrice, config, numPaths = 50) {
  const paths = [];
  for (let p = 0; p < numPaths; p++) {
    const path = [startPrice];
    for (let t = 1; t <= config.horizon; t++) {
      const noise = randn() * config.vol;
      const denoised = path[t - 1] * (1 + config.drift) + noise * path[t - 1];
      path.push(Math.max(0.01, denoised));
    }
    paths.push(path);
  }
  return paths;
}
function pathStats(paths) {
  const T = paths[0]?.length ?? 0;
  const mean2 = [];
  const p10 = [];
  const p90 = [];
  for (let t = 0; t < T; t++) {
    const col = paths.map((p) => p[t]).sort((a, b) => a - b);
    mean2.push(col.reduce((s, v) => s + v, 0) / col.length);
    p10.push(col[Math.floor(col.length * 0.1)]);
    p90.push(col[Math.floor(col.length * 0.9)]);
  }
  return { mean: mean2, p10, p90 };
}
function fitDistribution(samples) {
  const dim = samples[0]?.length ?? 0;
  const means = new Array(dim).fill(0);
  const stds = new Array(dim).fill(0);
  for (const s of samples) for (let i = 0; i < dim; i++) means[i] += s[i];
  for (let i = 0; i < dim; i++) means[i] /= Math.max(1, samples.length);
  for (const s of samples)
    for (let i = 0; i < dim; i++) stds[i] += (s[i] - means[i]) ** 2;
  for (let i = 0; i < dim; i++)
    stds[i] = Math.sqrt(stds[i] / Math.max(1, samples.length)) || 1;
  return { means, stds };
}
function mahalanobisDistance(x, stats2) {
  let s = 0;
  for (let i = 0; i < x.length; i++) {
    const z = (x[i] - stats2.means[i]) / stats2.stds[i];
    s += z * z;
  }
  return Math.sqrt(s);
}
function isOOD(x, stats2, threshold = 3.5) {
  const d = mahalanobisDistance(x, stats2);
  return d / Math.sqrt(x.length) > threshold;
}
function createBank(capacity = 1024) {
  return { entries: [], capacity };
}
function write(bank, entry) {
  const entries = [...bank.entries, entry];
  if (entries.length > bank.capacity) entries.shift();
  return { ...bank, entries };
}
function cosine$2(a, b) {
  let dot2 = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot2 += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot2 / denom;
}
function read(bank, query, topK = 5) {
  const scored = bank.entries.map((e) => ({ e, score: cosine$2(query, e.key) }));
  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, topK);
  const totalScore = top.reduce((s, t) => s + Math.max(0, t.score), 0);
  const prediction = totalScore === 0 ? 0 : top.reduce((s, t) => s + Math.max(0, t.score) * t.e.value, 0) / totalScore;
  return { prediction, neighbors: top };
}
function fitGARCH(returns2) {
  const variance2 = returns2.reduce((s, r) => s + r * r, 0) / returns2.length;
  let best = { omega: variance2 * 0.05, alpha: 0.1, beta: 0.85 };
  let bestLL = -Infinity;
  for (const a of [0.05, 0.1, 0.15, 0.2]) {
    for (const b of [0.7, 0.8, 0.85, 0.9]) {
      if (a + b >= 1) continue;
      const omega = variance2 * (1 - a - b);
      let sigma2 = variance2;
      let ll = 0;
      for (const r of returns2) {
        sigma2 = omega + a * r * r + b * sigma2;
        ll += -0.5 * (Math.log(sigma2) + r * r / sigma2);
      }
      if (ll > bestLL) {
        bestLL = ll;
        best = { omega, alpha: a, beta: b };
      }
    }
  }
  return best;
}
function forecastVolatility(params, returns2, horizon = 5) {
  let sigma2 = returns2.reduce((s, r) => s + r * r, 0) / returns2.length;
  for (const r of returns2) sigma2 = params.omega + params.alpha * r * r + params.beta * sigma2;
  const forecasts = [];
  const lastR2 = returns2[returns2.length - 1] ** 2;
  let curr = params.omega + params.alpha * lastR2 + params.beta * sigma2;
  forecasts.push(Math.sqrt(curr));
  for (let h = 1; h < horizon; h++) {
    curr = params.omega + (params.alpha + params.beta) * curr;
    forecasts.push(Math.sqrt(curr));
  }
  return forecasts;
}
function intensity(t, eventTimes, params) {
  let lambda = params.mu;
  for (const ti of eventTimes) {
    if (ti < t) lambda += params.alpha * Math.exp(-params.beta * (t - ti));
  }
  return lambda;
}
function fitHawkes(eventTimes, T) {
  let best = { mu: 0.1, alpha: 0.5, beta: 1 };
  let bestLL = -Infinity;
  for (const mu of [0.01, 0.05, 0.1, 0.2]) {
    for (const alpha of [0.1, 0.3, 0.5, 0.8]) {
      for (const beta2 of [0.5, 1, 2, 5]) {
        if (alpha >= beta2) continue;
        let ll = 0;
        for (let i = 0; i < eventTimes.length; i++) {
          ll += Math.log(intensity(eventTimes[i], eventTimes.slice(0, i), { mu, alpha, beta: beta2 }));
        }
        ll -= mu * T;
        for (const ti of eventTimes) ll -= alpha / beta2 * (1 - Math.exp(-beta2 * (T - ti)));
        if (ll > bestLL) {
          bestLL = ll;
          best = { mu, alpha, beta: beta2 };
        }
      }
    }
  }
  return best;
}
function branchingRatio(params) {
  return params.alpha / params.beta;
}
function gaussian$3() {
  const u1 = Math.max(Math.random(), 1e-12);
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}
function estimateGBMParams(prices, dt = 1 / 252) {
  const logRets = [];
  for (let i = 1; i < prices.length; i++) logRets.push(Math.log(prices[i] / prices[i - 1]));
  const mean2 = logRets.reduce((a, b) => a + b, 0) / logRets.length;
  const variance2 = logRets.reduce((s, r) => s + (r - mean2) ** 2, 0) / logRets.length;
  const sigma = Math.sqrt(variance2 / dt);
  const mu = mean2 / dt + 0.5 * sigma * sigma;
  return { mu, sigma, dt };
}
function simulateGBMPath(s0, params, steps) {
  const path = [s0];
  let s = s0;
  for (let i = 0; i < steps; i++) {
    const drift = (params.mu - 0.5 * params.sigma * params.sigma) * params.dt;
    const shock = params.sigma * Math.sqrt(params.dt) * gaussian$3();
    s = s * Math.exp(drift + shock);
    path.push(s);
  }
  return path;
}
function monteCarloGBM(s0, params, steps, numPaths = 1e3, keepPaths = false) {
  const finals = [];
  const paths = [];
  for (let i = 0; i < numPaths; i++) {
    const p = simulateGBMPath(s0, params, steps);
    finals.push(p[p.length - 1]);
    if (keepPaths && i < 100) paths.push(p);
  }
  finals.sort((a, b) => a - b);
  const pctl = (p) => finals[Math.floor(p / 100 * finals.length)];
  return {
    paths,
    meanFinal: finals.reduce((a, b) => a + b, 0) / finals.length,
    percentiles: { p5: pctl(5), p25: pctl(25), p50: pctl(50), p75: pctl(75), p95: pctl(95) },
    probUp: finals.filter((f) => f > s0).length / finals.length,
    probDown: finals.filter((f) => f < s0).length / finals.length
  };
}
function gaussian$2() {
  const u1 = Math.max(Math.random(), 1e-12);
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}
function estimateJumpParams(prices, threshold = 3) {
  const logRets = [];
  for (let i = 1; i < prices.length; i++) logRets.push(Math.log(prices[i] / prices[i - 1]));
  const m = logRets.reduce((a, b) => a + b, 0) / logRets.length;
  const s = Math.sqrt(logRets.reduce((sum, r) => sum + (r - m) ** 2, 0) / logRets.length);
  const jumps = logRets.filter((r) => Math.abs(r - m) > threshold * s);
  const normal = logRets.filter((r) => Math.abs(r - m) <= threshold * s);
  const dt = 1 / 252;
  const normalMean = normal.reduce((a, b) => a + b, 0) / Math.max(normal.length, 1);
  const normalStd = Math.sqrt(normal.reduce((s2, r) => s2 + (r - normalMean) ** 2, 0) / Math.max(normal.length, 1));
  return {
    mu: normalMean / dt + 0.5 * (normalStd / Math.sqrt(dt)) ** 2,
    sigma: normalStd / Math.sqrt(dt),
    lambda: jumps.length / (logRets.length * dt),
    jumpMean: jumps.length > 0 ? jumps.reduce((a, b) => a + b, 0) / jumps.length : 0,
    jumpStd: jumps.length > 1 ? Math.sqrt(jumps.reduce((s2, j) => s2 + (j - normalMean) ** 2, 0) / jumps.length) : 0.05,
    dt
  };
}
function simulateJumpPath(s0, params, steps) {
  const path = [s0];
  let s = s0;
  const kappa = Math.exp(params.jumpMean + 0.5 * params.jumpStd ** 2) - 1;
  for (let i = 0; i < steps; i++) {
    const drift = (params.mu - params.lambda * kappa - 0.5 * params.sigma ** 2) * params.dt;
    const diffusion = params.sigma * Math.sqrt(params.dt) * gaussian$2();
    let jump = 0;
    if (Math.random() < params.lambda * params.dt) {
      jump = params.jumpMean + params.jumpStd * gaussian$2();
    }
    s = s * Math.exp(drift + diffusion + jump);
    path.push(s);
  }
  return path;
}
function decide(agent, price, history, fundamentalValue) {
  switch (agent.type) {
    case "noise":
      return (Math.random() - 0.5) * agent.aggressiveness;
    case "momentum": {
      if (history.length < 5) return 0;
      const recent = history.slice(-5);
      const trend = (recent[recent.length - 1] - recent[0]) / recent[0];
      return Math.sign(trend) * Math.min(Math.abs(trend) * 10, 1) * agent.aggressiveness;
    }
    case "value": {
      const mispricing = (fundamentalValue - price) / price;
      return Math.sign(mispricing) * Math.min(Math.abs(mispricing) * 5, 1) * agent.aggressiveness;
    }
    case "contrarian": {
      if (history.length < 5) return 0;
      const recent = history.slice(-5);
      const trend = (recent[recent.length - 1] - recent[0]) / recent[0];
      return -Math.sign(trend) * Math.min(Math.abs(trend) * 5, 1) * agent.aggressiveness;
    }
  }
}
function simulateAgentMarket(initialPrice, fundamentalValue, agents, steps) {
  const prices = [initialPrice];
  const volumes = [];
  let price = initialPrice;
  for (let t = 0; t < steps; t++) {
    let netDemand = 0;
    let volume = 0;
    for (const agent of agents) {
      const order = decide(agent, price, prices, fundamentalValue);
      netDemand += order;
      volume += Math.abs(order);
    }
    const impact = netDemand / agents.length;
    price = Math.max(price * (1 + impact * 0.01), 0.01);
    prices.push(price);
    volumes.push(volume);
  }
  return { prices, volumes };
}
function createDiverseAgents(count = 100) {
  const agents = [];
  const types = ["noise", "momentum", "value", "contrarian"];
  for (let i = 0; i < count; i++) {
    agents.push({
      type: types[i % types.length],
      capital: 1e4 + Math.random() * 9e4,
      position: 0,
      aggressiveness: 0.3 + Math.random() * 0.7
    });
  }
  return agents;
}
function gaussian$1() {
  const u1 = Math.max(Math.random(), 1e-12);
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}
function generateSyntheticReturns(realReturns, length) {
  const mean2 = realReturns.reduce((a, b) => a + b, 0) / realReturns.length;
  const std2 = Math.sqrt(realReturns.reduce((s, r) => s + (r - mean2) ** 2, 0) / realReturns.length);
  const synthetic = [];
  for (let i = 0; i < length; i++) {
    let r = mean2 + std2 * gaussian$1();
    if (Math.random() < 0.02) r += std2 * 3 * (Math.random() < 0.5 ? -1 : 1);
    synthetic.push(r);
  }
  return synthetic;
}
function generateFeatures(bars) {
  const n = bars.length;
  if (n === 0) return {};
  const closes = bars.map((b) => b.close);
  const volumes = bars.map((b) => b.volume);
  const highs = bars.map((b) => b.high);
  const lows = bars.map((b) => b.low);
  const f = {};
  for (const lag of [1, 3, 5, 10, 20, 50]) {
    if (n > lag) f[`return_${lag}`] = (closes[n - 1] - closes[n - 1 - lag]) / closes[n - 1 - lag];
  }
  for (const w of [5, 10, 20, 50, 100, 200]) {
    if (n >= w) {
      const ma = closes.slice(-w).reduce((a, b) => a + b, 0) / w;
      f[`ma_${w}`] = ma;
      f[`price_to_ma_${w}`] = closes[n - 1] / ma;
    }
  }
  const rets = [];
  for (let i = 1; i < n; i++) rets.push((closes[i] - closes[i - 1]) / closes[i - 1]);
  for (const w of [5, 10, 20, 50]) {
    if (rets.length >= w) {
      const slice = rets.slice(-w);
      const m = slice.reduce((a, b) => a + b, 0) / w;
      const v = slice.reduce((s, r) => s + (r - m) ** 2, 0) / w;
      f[`volatility_${w}`] = Math.sqrt(v);
    }
  }
  for (const w of [5, 10, 20]) {
    if (n >= w) {
      const hSlice = highs.slice(-w);
      const lSlice = lows.slice(-w);
      const hi = Math.max(...hSlice);
      const lo = Math.min(...lSlice);
      f[`range_${w}`] = (hi - lo) / closes[n - 1];
      f[`position_in_range_${w}`] = lo === hi ? 0.5 : (closes[n - 1] - lo) / (hi - lo);
    }
  }
  for (const w of [5, 20, 50]) {
    if (n >= w) {
      const avgV = volumes.slice(-w).reduce((a, b) => a + b, 0) / w;
      f[`volume_ratio_${w}`] = volumes[n - 1] / Math.max(avgV, 1);
    }
  }
  if (rets.length > 5) {
    const m = rets.reduce((a, b) => a + b, 0) / rets.length;
    const sd = Math.sqrt(rets.reduce((s, r) => s + (r - m) ** 2, 0) / rets.length);
    if (sd > 0) {
      f.skew = rets.reduce((s, r) => s + ((r - m) / sd) ** 3, 0) / rets.length;
      f.kurtosis = rets.reduce((s, r) => s + ((r - m) / sd) ** 4, 0) / rets.length - 3;
    }
  }
  return f;
}
function mean$d(x) {
  return x.reduce((a, b) => a + b, 0) / Math.max(x.length, 1);
}
function std$7(x) {
  const m = mean$d(x);
  return Math.sqrt(x.reduce((s, v) => s + (v - m) ** 2, 0) / Math.max(x.length, 1));
}
function dctCoefficients(x, k = 5) {
  const n = x.length;
  const result = [];
  for (let i = 0; i < k; i++) {
    let sum = 0;
    for (let t = 0; t < n; t++) sum += x[t] * Math.cos(Math.PI * i * (t + 0.5) / n);
    result.push(sum);
  }
  return result;
}
function autocorrelation(x, lag) {
  if (x.length <= lag) return 0;
  const m = mean$d(x);
  let num = 0;
  let den = 0;
  for (let i = 0; i < x.length - lag; i++) num += (x[i] - m) * (x[i + lag] - m);
  for (let i = 0; i < x.length; i++) den += (x[i] - m) ** 2;
  return den === 0 ? 0 : num / den;
}
function numberPeaks(x, support = 1) {
  let count = 0;
  for (let i = support; i < x.length - support; i++) {
    let isPeak = true;
    for (let j = 1; j <= support; j++) {
      if (x[i] <= x[i - j] || x[i] <= x[i + j]) {
        isPeak = false;
        break;
      }
    }
    if (isPeak) count++;
  }
  return count;
}
function longestStrike(x, aboveMean) {
  const m = mean$d(x);
  let longest = 0;
  let current = 0;
  for (const v of x) {
    if (aboveMean && v > m || !aboveMean && v < m) current++;
    else {
      longest = Math.max(longest, current);
      current = 0;
    }
  }
  return Math.max(longest, current);
}
function tsfreshFeatures(x) {
  if (x.length < 5) return {};
  const m = mean$d(x);
  const s = std$7(x);
  const sorted = [...x].sort((a, b) => a - b);
  const f = {
    mean: m,
    std: s,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    median: sorted[Math.floor(sorted.length / 2)],
    sum: x.reduce((a, b) => a + b, 0),
    abs_sum: x.reduce((a, b) => a + Math.abs(b), 0),
    abs_energy: x.reduce((a, b) => a + b * b, 0),
    cv: s / Math.max(Math.abs(m), 1e-9),
    range: sorted[sorted.length - 1] - sorted[0],
    above_mean: x.filter((v) => v > m).length / x.length,
    below_mean: x.filter((v) => v < m).length / x.length,
    zero_crossings: x.slice(1).filter((v, i) => (v - m) * (x[i] - m) < 0).length,
    longest_above_mean: longestStrike(x, true),
    longest_below_mean: longestStrike(x, false),
    num_peaks: numberPeaks(x, 1),
    num_peaks_3: numberPeaks(x, 3),
    first_loc_max: x.indexOf(sorted[sorted.length - 1]) / x.length,
    first_loc_min: x.indexOf(sorted[0]) / x.length
  };
  for (const lag of [1, 2, 5, 10, 20]) f[`autocorr_${lag}`] = autocorrelation(x, lag);
  const dct = dctCoefficients(x, 5);
  dct.forEach((c, i) => f[`dct_${i}`] = c);
  return f;
}
function initOnlineModel(dim, lr = 0.01, l2 = 1e-4) {
  return { weights: new Array(dim).fill(0), bias: 0, learningRate: lr, l2, samplesSeen: 0 };
}
function sigmoid$5(x) {
  return 1 / (1 + Math.exp(-Math.max(Math.min(x, 30), -30)));
}
function partialFit(model, x, y) {
  const z = model.bias + x.reduce((s, xi, i) => s + xi * model.weights[i], 0);
  const pred = sigmoid$5(z);
  const err = pred - y;
  for (let i = 0; i < model.weights.length; i++) {
    model.weights[i] -= model.learningRate * (err * x[i] + model.l2 * model.weights[i]);
  }
  model.bias -= model.learningRate * err;
  model.samplesSeen++;
  return model;
}
function predictOnline(model, x) {
  const z = model.bias + x.reduce((s, xi, i) => s + xi * model.weights[i], 0);
  return sigmoid$5(z);
}
function keyToString(k) {
  return `${k.entity}::${k.feature}::${k.version}::${k.bucket}`;
}
class FeatureStore {
  store = /* @__PURE__ */ new Map();
  hits = 0;
  misses = 0;
  maxSize;
  constructor(maxSize = 1e4) {
    this.maxSize = maxSize;
  }
  get(key) {
    const k = keyToString(key);
    const cached = this.store.get(k);
    if (!cached) {
      this.misses++;
      return null;
    }
    if (Date.now() - cached.computedAt > cached.ttlMs) {
      this.store.delete(k);
      this.misses++;
      return null;
    }
    this.hits++;
    return cached.value;
  }
  set(key, value, ttlMs = 3e5) {
    if (this.store.size >= this.maxSize) {
      const firstKey = this.store.keys().next().value;
      if (firstKey) this.store.delete(firstKey);
    }
    this.store.set(keyToString(key), { value, computedAt: Date.now(), ttlMs });
  }
  async getOrCompute(key, compute, ttlMs = 3e5) {
    const cached = this.get(key);
    if (cached !== null) return cached;
    const value = await compute();
    this.set(key, value, ttlMs);
    return value;
  }
  stats() {
    const total = this.hits + this.misses;
    return { hits: this.hits, misses: this.misses, hitRate: total === 0 ? 0 : this.hits / total, size: this.store.size };
  }
  invalidate(prefix) {
    if (!prefix) {
      const size = this.store.size;
      this.store.clear();
      return size;
    }
    let count = 0;
    for (const k of Array.from(this.store.keys())) {
      if (k.startsWith(prefix)) {
        this.store.delete(k);
        count++;
      }
    }
    return count;
  }
}
const globalFeatureStore = new FeatureStore(1e4);
function newDecisionId() {
  return `dec_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
function buildRecord(args) {
  return { id: newDecisionId(), ts: (/* @__PURE__ */ new Date()).toISOString(), ...args };
}
function integrateSignals(baseConfidence, signals, weights = {}, blendAlpha = 0.35) {
  if (signals.length === 0) {
    return { adjustedConfidence: baseConfidence, contributions: [], totalWeight: 0 };
  }
  const contributions = [];
  let weightedSum = 0;
  let totalWeight = 0;
  for (const s of signals) {
    const w = Math.max(0, weights[s.name] ?? 1) * (s.confidence ?? 1);
    const contrib = w * Math.max(-1, Math.min(1, s.value));
    contributions.push({ name: s.name, weight: w, contribution: contrib });
    weightedSum += contrib;
    totalWeight += w;
  }
  const meanSignal = totalWeight > 0 ? weightedSum / totalWeight : 0;
  const delta = blendAlpha * meanSignal * 50;
  const adjusted = Math.max(0, Math.min(100, baseConfidence + delta));
  return { adjustedConfidence: adjusted, contributions, totalWeight };
}
const registry = /* @__PURE__ */ new Map();
const DISABLE_THRESHOLD = 5;
function ensure(name) {
  let h = registry.get(name);
  if (!h) {
    h = {
      name,
      status: "unknown",
      lastRunAt: 0,
      lastDurationMs: 0,
      totalRuns: 0,
      successCount: 0,
      errorCount: 0,
      skipCount: 0,
      consecutiveErrors: 0,
      disabled: false
    };
    registry.set(name, h);
  }
  return h;
}
function runModule(name, fn) {
  const h = ensure(name);
  if (h.disabled) {
    h.skipCount++;
    h.totalRuns++;
    h.status = "skipped";
    h.lastRunAt = Date.now();
    return void 0;
  }
  const start = Date.now();
  try {
    const result = fn();
    h.lastDurationMs = Date.now() - start;
    h.lastRunAt = Date.now();
    h.totalRuns++;
    if (result === void 0) {
      h.skipCount++;
      h.status = "skipped";
    } else {
      h.successCount++;
      h.consecutiveErrors = 0;
      h.status = "ok";
    }
    return result;
  } catch (err) {
    h.lastDurationMs = Date.now() - start;
    h.lastRunAt = Date.now();
    h.totalRuns++;
    h.errorCount++;
    h.consecutiveErrors++;
    h.status = "error";
    h.lastError = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    h.lastErrorAt = Date.now();
    if (h.consecutiveErrors >= DISABLE_THRESHOLD) {
      h.disabled = true;
    }
    console.error(`[module-health] ${name} failed:`, h.lastError);
    return void 0;
  }
}
function getAllHealth() {
  return Array.from(registry.values()).sort((a, b) => a.name.localeCompare(b.name));
}
function getHealthSummary() {
  const all = getAllHealth();
  return {
    total: all.length,
    ok: all.filter((h) => h.status === "ok").length,
    error: all.filter((h) => h.status === "error").length,
    skipped: all.filter((h) => h.status === "skipped").length,
    disabled: all.filter((h) => h.disabled).length,
    modules: all
  };
}
function resetModule(name) {
  const h = registry.get(name);
  if (!h) return false;
  h.disabled = false;
  h.consecutiveErrors = 0;
  h.lastError = void 0;
  h.lastErrorAt = void 0;
  h.status = "unknown";
  return true;
}
function resetAllModules() {
  let n = 0;
  for (const h of registry.values()) {
    if (h.disabled || h.errorCount > 0) {
      h.disabled = false;
      h.consecutiveErrors = 0;
      h.lastError = void 0;
      h.lastErrorAt = void 0;
      h.status = "unknown";
      n++;
    }
  }
  return n;
}
const scores = /* @__PURE__ */ new Map();
const HALF_LIFE$1 = 50;
const ALPHA$1 = 1 - Math.pow(0.5, 1 / HALF_LIFE$1);
const symbolScores = /* @__PURE__ */ new Map();
const sectorScores = /* @__PURE__ */ new Map();
const TIME_DECAY_DAYS = 14;
function timeWeight(ageMs) {
  const days = ageMs / 864e5;
  return Math.pow(0.5, days / TIME_DECAY_DAYS);
}
function updateScore(map, key, signal, actualReturn, ageMs) {
  const s = map.get(key) ?? { brierSum: 0, n: 0, hitRate: 0.5, weight: 1 };
  const sigCapped = Math.max(-1, Math.min(1, signal));
  const actCapped = Math.max(-1, Math.min(1, actualReturn * 20));
  const err = (sigCapped - actCapped) ** 2;
  const w = timeWeight(ageMs);
  const a = ALPHA$1 * w;
  s.brierSum = s.brierSum * (1 - a) + err * a;
  s.n = Math.min(s.n + 1, 1e4);
  const hit = Math.sign(sigCapped) === Math.sign(actCapped) ? 1 : 0;
  s.hitRate = s.hitRate * (1 - a) + hit * a;
  s.weight = Math.max(0.1, Math.min(2, 0.2 + 1.6 * Math.max(0, s.hitRate - 0.4) / 0.4));
  map.set(key, s);
}
function recordOutcome(moduleName, signal, actualReturn, meta = {}) {
  const ageMs = meta.ageMs ?? 0;
  updateScore(scores, moduleName, signal, actualReturn, ageMs);
  if (meta.symbol) updateScore(symbolScores, `${moduleName}|${meta.symbol}`, signal, actualReturn, ageMs);
  if (meta.sector) updateScore(sectorScores, `${moduleName}|${meta.sector}`, signal, actualReturn, ageMs);
}
function getWeightMultipliers() {
  const out = {};
  for (const [k, v] of scores) {
    if (v.n >= 5) out[k] = v.weight;
  }
  return out;
}
function getSymbolWeightOverlay(symbol) {
  const out = {};
  for (const [k, v] of symbolScores) {
    if (!k.endsWith(`|${symbol}`)) continue;
    if (v.n < 8) continue;
    const name = k.split("|")[0];
    out[name] = 0.3 + 0.7 * v.weight;
  }
  return out;
}
function getSectorWeightOverlay(sector) {
  if (!sector) return {};
  const out = {};
  for (const [k, v] of sectorScores) {
    if (!k.endsWith(`|${sector}`)) continue;
    if (v.n < 8) continue;
    const name = k.split("|")[0];
    out[name] = 0.4 + 0.6 * v.weight;
  }
  return out;
}
function getAllScores() {
  return Array.from(scores.entries()).map(([name, s]) => ({ name, ...s }));
}
function detectRegime(candles) {
  if (candles.length < 30) return "calm";
  const closes = candles.slice(-30).map((c) => c.close);
  const rets = [];
  for (let i = 1; i < closes.length; i++) rets.push((closes[i] - closes[i - 1]) / closes[i - 1]);
  const mean2 = rets.reduce((s, x) => s + x, 0) / rets.length;
  const variance2 = rets.reduce((s, x) => s + (x - mean2) ** 2, 0) / rets.length;
  const vol = Math.sqrt(variance2);
  const trendStrength = Math.abs(rets.reduce((s, x) => s + x, 0)) / Math.max(1e-9, rets.reduce((s, x) => s + Math.abs(x), 0));
  if (vol > 0.04) return "high_vol";
  if (trendStrength > 0.35 && mean2 > 0) return "trending_up";
  if (trendStrength > 0.35 && mean2 < 0) return "trending_down";
  if (trendStrength < 0.15) return "mean_reverting";
  return "calm";
}
const REGIME_WEIGHTS = {
  trending_up: { mamba_ssm: 1.4, auto_features: 1.3, gbm_mc: 1.2, ood_detector: 0.7, hawkes_events: 0.7 },
  trending_down: { vpin: 1.5, garch_vol: 1.4, hawkes_events: 1.3, mamba_ssm: 0.8 },
  mean_reverting: { mixture_density: 1.3, agent_market: 1.3, bootstrap_robustness: 1.2, mamba_ssm: 0.7 },
  high_vol: { vpin: 1.5, garch_vol: 1.5, jump_diffusion: 1.4, ood_detector: 1.3, gbm_mc: 0.6 },
  calm: {}
};
function regimeWeights(r) {
  return REGIME_WEIGHTS[r] ?? {};
}
function mergeWeights(a, b) {
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) out[k] = (out[k] ?? 1) * v;
  return out;
}
const state = { a: 0.05, b: -2.5, n: 0 };
const LR$2 = 0.01;
function sigmoid$4(z) {
  if (z >= 0) {
    const e2 = Math.exp(-z);
    return 1 / (1 + e2);
  }
  const e = Math.exp(z);
  return e / (1 + e);
}
function calibrate(rawConfidence) {
  return sigmoid$4(state.a * rawConfidence + state.b);
}
function updateCalibration(rawConfidence, won) {
  const y = won ? 1 : 0;
  const p = calibrate(rawConfidence);
  const grad = p - y;
  state.a -= LR$2 * grad * rawConfidence;
  state.b -= LR$2 * grad;
  state.n++;
}
function calibrationState() {
  return { ...state };
}
function calibratedConfidence(rawConfidence) {
  if (state.n < 30) return rawConfidence;
  const p = calibrate(rawConfidence);
  const blended = 0.7 * p * 100 + 0.3 * rawConfidence;
  return Math.max(0, Math.min(100, blended));
}
function diversity(signals) {
  let bull = 0, bear = 0, neutral = 0;
  for (const s of signals) {
    const w = s.confidence ?? 0.5;
    if (s.value > 0.05) bull += w;
    else if (s.value < -0.05) bear += w;
    else neutral += w;
  }
  const total = bull + bear + neutral || 1;
  const pB = bull / total, pS = bear / total, pN = neutral / total;
  const term = (p) => p > 0 ? -p * Math.log(p) : 0;
  const H = term(pB) + term(pS) + term(pN);
  const maxH = Math.log(3);
  const entropy = H / maxH;
  const agreement = Math.max(pB, pS, pN);
  const multiplier = 0.6 + 0.5 * agreement;
  return { agreement, entropy, bullWeight: pB, bearWeight: pS, neutralWeight: pN, multiplier };
}
function robustness(baseConfidence, signals, weights = {}, noiseStd = 0.1, trials = 12) {
  const base = integrateSignals(baseConfidence, signals, weights, 0.3).adjustedConfidence;
  const baseSide = base > baseConfidence ? 1 : base < baseConfidence ? -1 : 0;
  let agree = 0;
  for (let t = 0; t < trials; t++) {
    const noisy = signals.map((s) => ({
      ...s,
      value: Math.max(-1, Math.min(1, s.value + (Math.random() * 2 - 1) * noiseStd))
    }));
    const r = integrateSignals(baseConfidence, noisy, weights, 0.3).adjustedConfidence;
    const side = r > baseConfidence ? 1 : r < baseConfidence ? -1 : 0;
    if (side === baseSide) agree++;
  }
  const stability = agree / trials;
  const multiplier = 0.7 + 0.35 * stability;
  return { stability, multiplier };
}
function bayesianInterval(signals, rawConfidence) {
  const n = signals.length || 1;
  let wSum = 0, mean2 = 0;
  for (const s of signals) {
    const w = s.confidence ?? 0.5;
    mean2 += w * s.value;
    wSum += w;
  }
  mean2 = wSum > 0 ? mean2 / wSum : 0;
  let varSum = 0;
  for (const s of signals) {
    const w = s.confidence ?? 0.5;
    varSum += w * (s.value - mean2) ** 2;
  }
  const variance2 = wSum > 0 ? varSum / wSum : 0;
  const std2 = Math.sqrt(variance2);
  const halfWidth = Math.min(25, std2 * 30 + 10 / Math.sqrt(n));
  return {
    lower: Math.max(0, rawConfidence - halfWidth),
    upper: Math.min(100, rawConfidence + halfWidth),
    halfWidth,
    /** Trust multiplier ∈ [0.7,1]: wider band → less trust. */
    trust: Math.max(0.7, 1 - halfWidth / 80)
  };
}
const referenceDist = /* @__PURE__ */ new Map();
function buckets(xs, n = 10) {
  if (xs.length === 0) return new Array(n).fill(1 / n);
  const min = Math.min(...xs), max = Math.max(...xs);
  const w = (max - min) / n || 1;
  const counts = new Array(n).fill(0);
  for (const x of xs) {
    const i = Math.min(n - 1, Math.max(0, Math.floor((x - min) / w)));
    counts[i]++;
  }
  return counts.map((c) => (c + 1) / (xs.length + n));
}
function driftPSI(symbol, recentReturns) {
  if (recentReturns.length < 30) return 0;
  const cur = buckets(recentReturns);
  const ref = referenceDist.get(symbol);
  if (!ref) {
    referenceDist.set(symbol, cur);
    return 0;
  }
  let psi = 0;
  for (let i = 0; i < cur.length; i++) psi += (cur[i] - ref[i]) * Math.log(cur[i] / ref[i]);
  const updated = ref.map((r, i) => r * 0.9 + cur[i] * 0.1);
  referenceDist.set(symbol, updated);
  return Math.abs(psi);
}
function driftMultiplier(psi) {
  if (psi < 0.1) return 1;
  if (psi < 0.25) return 0.95;
  if (psi < 0.5) return 0.85;
  return 0.7;
}
function anomalyCheck(candles) {
  if (candles.length < 5) return { ok: true };
  const last = candles[candles.length - 1];
  const prev = candles[candles.length - 2];
  if (last.close <= 0 || prev.close <= 0) return { ok: false, reason: "bad_price" };
  const gap = Math.abs(last.open - prev.close) / prev.close;
  if (gap > 0.25) return { ok: false, reason: "split_or_gap" };
  const range = (last.high - last.low) / last.close;
  if (range > 0.5) return { ok: false, reason: "extreme_range" };
  const vols = candles.slice(-21, -1).map((c) => c.volume);
  const avg = vols.reduce((s, v) => s + v, 0) / Math.max(1, vols.length);
  if (avg > 0 && last.volume > avg * 25) return { ok: false, reason: "volume_spike" };
  return { ok: true };
}
function multiTimeframeAgreement(candles) {
  if (candles.length < 40) return { agree: false, bonus: 0 };
  const d10 = candles.slice(-10).map((c) => c.close);
  const dailyTrend = d10[d10.length - 1] - d10[0];
  const weekly = [];
  for (let i = candles.length - 40; i < candles.length; i += 5) {
    weekly.push(candles[Math.min(i + 4, candles.length - 1)].close);
  }
  const weeklyTrend = weekly[weekly.length - 1] - weekly[0];
  const agree = Math.sign(dailyTrend) === Math.sign(weeklyTrend) && dailyTrend !== 0;
  return { agree, bonus: agree ? 1.1 : 0.9 };
}
const scanClusterCounts = /* @__PURE__ */ new Map();
function resetClusterTracking() {
  scanClusterCounts.clear();
}
function clusterPenalty(symbol, sector) {
  const key = sector || symbol.slice(0, 3);
  const count = scanClusterCounts.get(key) ?? 0;
  scanClusterCounts.set(key, count + 1);
  return Math.max(0.7, 1 - count * 0.1);
}
const shadowLog = [];
function recordShadow(symbol, prod, shadow) {
  shadowLog.push({ ts: Date.now(), symbol, prodConfidence: prod, shadowConfidence: shadow });
  if (shadowLog.length > 2e3) shadowLog.splice(0, shadowLog.length - 1e3);
}
function shadowStats() {
  if (shadowLog.length === 0) return { n: 0, avgDelta: 0, maxDelta: 0 };
  let sum = 0, maxD = 0;
  for (const r of shadowLog) {
    const d = r.shadowConfidence - r.prodConfidence;
    sum += d;
    if (Math.abs(d) > Math.abs(maxD)) maxD = d;
  }
  return { n: shadowLog.length, avgDelta: sum / shadowLog.length, maxDelta: maxD };
}
function buildRiskPlan(indicators, direction, confidencePct, hitRate = 0.55) {
  const price = indicators.close;
  const atr = indicators.atr14 ?? price * 0.02;
  const support = indicators.support ?? price * 0.95;
  const resistance = indicators.resistance ?? price * 1.05;
  let stopLoss, target;
  if (direction === 1) {
    const atrStop = price - 1.8 * atr;
    stopLoss = Math.max(atrStop, support * 0.995);
    const atrTarget = price + 3 * atr;
    target = Math.min(atrTarget, resistance * 0.995);
    if (target <= price) target = price + 2.5 * atr;
  } else {
    const atrStop = price + 1.8 * atr;
    stopLoss = Math.min(atrStop, resistance * 1.005);
    const atrTarget = price - 3 * atr;
    target = Math.max(atrTarget, support * 1.005);
    if (target >= price) target = price - 2.5 * atr;
  }
  const risk = Math.abs(price - stopLoss);
  const reward = Math.abs(target - price);
  const rr = risk > 0 ? reward / risk : 0;
  const p = Math.max(0.05, Math.min(0.95, hitRate));
  const b = Math.max(0.1, rr);
  const kelly = (p * (b + 1) - 1) / b;
  const confidenceFactor = Math.max(0, (confidencePct - 50) / 50);
  const sized = Math.max(0, kelly) * 0.325 * confidenceFactor * 100;
  const positionSizePct = Math.max(0.5, Math.min(5, sized || 1));
  return { entry: price, stopLoss, target, rr, positionSizePct };
}
const cache = /* @__PURE__ */ new Map();
const TTL = 6 * 3600 * 1e3;
async function nextEarningsDate(symbol) {
  const hit = cache.get(symbol);
  if (hit && Date.now() - hit.fetchedAt < TTL) return hit.date;
  const { data } = await supabaseAdmin.from("fundamentals").select("next_earnings_date").eq("symbol", symbol).order("as_of", { ascending: false }).limit(1);
  const date = data?.[0]?.next_earnings_date ?? null;
  cache.set(symbol, { date, fetchedAt: Date.now() });
  return date;
}
function earningsMultiplier(daysUntil) {
  if (daysUntil == null) return 1;
  if (daysUntil <= 1) return 0.6;
  if (daysUntil <= 3) return 0.75;
  if (daysUntil <= 7) return 0.9;
  return 1;
}
function daysBetween(from, isoDate) {
  const d = new Date(isoDate);
  return Math.round((d.getTime() - from.getTime()) / 864e5);
}
async function sanityCheck(args) {
  if (!process.env.LOVABLE_API_KEY && !process.env.GEMINI_API_KEY && !process.env.GROQ_API_KEY) {
    return { verdict: "neutral", reason: "no_key", multiplier: 1 };
  }
  const top = [...args.signals].sort((a, b) => Math.abs(b.value) - Math.abs(a.value)).slice(0, 6).map((s) => `${s.name}=${s.value.toFixed(2)}`).join(", ");
  const prompt = `You are a quant risk reviewer. Pick: ${args.symbol} signal=${args.signal} confidence=${args.confidence.toFixed(0)} regime=${args.regime}. Top module signals: ${top}. Reply STRICT JSON: {"verdict":"endorse|neutral|reject","reason":"<≤12 words>"} Reject only if signals strongly contradict the action.`;
  try {
    const text = await chatWithFallback({
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
      timeoutMs: 6e3
    });
    if (!text) return { verdict: "neutral", reason: "no_response", multiplier: 1 };
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return { verdict: "neutral", reason: "no_json", multiplier: 1 };
    const parsed = JSON.parse(m[0]);
    const verdict = parsed.verdict === "endorse" ? "endorse" : parsed.verdict === "reject" ? "reject" : "neutral";
    const multiplier = verdict === "reject" ? 0.65 : verdict === "endorse" ? 1.12 : 1;
    return { verdict, reason: (parsed.reason ?? "").slice(0, 120), multiplier };
  } catch {
    return { verdict: "neutral", reason: "exception", multiplier: 1 };
  }
}
function volumeProfile(candles, bins = 24) {
  if (candles.length < 10) return null;
  let pv = 0, v = 0;
  let min = Infinity, max = -Infinity;
  for (const c of candles) {
    const typical = (c.high + c.low + c.close) / 3;
    pv += typical * c.volume;
    v += c.volume;
    if (c.low < min) min = c.low;
    if (c.high > max) max = c.high;
  }
  if (v <= 0 || max <= min) return null;
  const vwap = pv / v;
  const step2 = (max - min) / bins;
  const buckets2 = new Array(bins).fill(0);
  for (const c of candles) {
    const typical = (c.high + c.low + c.close) / 3;
    const idx = Math.min(bins - 1, Math.max(0, Math.floor((typical - min) / step2)));
    buckets2[idx] += c.volume;
  }
  let bestIdx = 0, bestVol = -1;
  buckets2.forEach((vv, i) => {
    if (vv > bestVol) {
      bestVol = vv;
      bestIdx = i;
    }
  });
  const poc = min + (bestIdx + 0.5) * step2;
  const last = candles[candles.length - 1].close;
  const aboveVwap = (last - vwap) / vwap;
  const distPoc = Math.abs(last - poc) / poc;
  const value = Math.max(-1, Math.min(1, aboveVwap * 8 - distPoc * 3));
  return { vwap, poc, value };
}
function returns(candles) {
  const out = [];
  for (let i = 1; i < candles.length; i++) {
    const prev = candles[i - 1].close;
    if (prev > 0) out.push({ d: new Date(candles[i].date), r: (candles[i].close - prev) / prev });
  }
  return out;
}
function seasonalTilt(candles, today = /* @__PURE__ */ new Date()) {
  if (candles.length < 60) return { value: 0, samples: 0 };
  const rs = returns(candles);
  const dow = today.getDay();
  const wom = Math.floor((today.getDate() - 1) / 7);
  let dowSum = 0, dowN = 0, womSum = 0, womN = 0;
  for (const { d, r } of rs) {
    if (d.getDay() === dow) {
      dowSum += r;
      dowN++;
    }
    if (Math.floor((d.getDate() - 1) / 7) === wom) {
      womSum += r;
      womN++;
    }
  }
  const dowMean = dowN > 0 ? dowSum / dowN : 0;
  const womMean = womN > 0 ? womSum / womN : 0;
  const blended = 0.6 * dowMean + 0.4 * womMean;
  return { value: Math.max(-1, Math.min(1, Math.tanh(blended * 80))), samples: Math.min(dowN, womN) };
}
function smartMoneyFlow(candles, window = 20) {
  if (candles.length < window + 2) return { value: 0, flow: 0 };
  const recent = candles.slice(-window);
  let net = 0, volSum = 0;
  for (const c of recent) {
    const dir = c.close >= c.open ? 1 : -1;
    const body = Math.abs(c.close - c.open) / Math.max(1e-9, c.open);
    net += dir * body * c.volume;
    volSum += c.volume;
  }
  const flow = volSum > 0 ? net / volSum : 0;
  return { value: Math.max(-1, Math.min(1, Math.tanh(flow * 80))), flow };
}
const stats = /* @__PURE__ */ new Map();
const HALF_LIFE = 80;
const ALPHA = 1 - Math.pow(0.5, 1 / HALF_LIFE);
function recordFeatureOutcome(name, signal, realisedReturn) {
  const s = stats.get(name) ?? { n: 0, sumX: 0, sumY: 0, sumXX: 0, sumYY: 0, sumXY: 0, corr: 0 };
  const x = Math.max(-1, Math.min(1, signal));
  const y = Math.max(-1, Math.min(1, realisedReturn * 20));
  const a = ALPHA;
  s.sumX = s.sumX * (1 - a) + x * a;
  s.sumY = s.sumY * (1 - a) + y * a;
  s.sumXX = s.sumXX * (1 - a) + x * x * a;
  s.sumYY = s.sumYY * (1 - a) + y * y * a;
  s.sumXY = s.sumXY * (1 - a) + x * y * a;
  s.n = Math.min(s.n + 1, 1e5);
  const varX = s.sumXX - s.sumX * s.sumX;
  const varY = s.sumYY - s.sumY * s.sumY;
  const cov = s.sumXY - s.sumX * s.sumY;
  s.corr = varX > 1e-9 && varY > 1e-9 ? cov / Math.sqrt(varX * varY) : 0;
  stats.set(name, s);
}
function importanceMultiplier(name) {
  const s = stats.get(name);
  if (!s || s.n < 10) return 1;
  const strength = Math.min(1, Math.abs(s.corr) * 2);
  return 0.3 + 1.3 * strength;
}
async function multiAgentDebate(input) {
  if (!process.env.LOVABLE_API_KEY && !process.env.GEMINI_API_KEY && !process.env.GROQ_API_KEY) {
    return { multiplier: 1, verdict: "skip", summary: "" };
  }
  try {
    const text = await chatWithFallback({
      messages: [{
        role: "user",
        content: 'أنت 3 محللين: Bull, Bear, Risk Manager. قيّموا التوصية التالية. أعد JSON صارم: {"bull_score":0-10,"bear_score":0-10,"risk_score":0-10,"verdict":"confirm|reduce|reject","summary_ar":"..."}\n\n' + JSON.stringify(input)
      }],
      temperature: 0.2,
      timeoutMs: 8e3
    });
    if (!text) return { multiplier: 1, verdict: "error", summary: "" };
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return { multiplier: 1, verdict: "no_json", summary: "" };
    const output = JSON.parse(m[0]);
    let mul = 1;
    if (output.verdict === "confirm") mul = 1.15;
    else if (output.verdict === "reduce") mul = 0.75;
    else mul = 0.5;
    mul *= 1 + ((output.bull_score ?? 0) - (output.bear_score ?? 0)) * 0.02;
    return {
      multiplier: Math.max(0.5, Math.min(1.2, mul)),
      verdict: output.verdict,
      summary: output.summary_ar ?? ""
    };
  } catch {
    return { multiplier: 1, verdict: "error", summary: "" };
  }
}
const ACTIONS = ["skip", "enter_small", "enter_full", "scale_out_50"];
const ACT_MUL = { skip: 0, enter_small: 0.5, enter_full: 1, scale_out_50: 0.5 };
const Q = /* @__PURE__ */ new Map();
const LR$1 = 0.1;
const EPS = 0.05;
function stateKey(regime, confidence) {
  const bucket2 = Math.floor(confidence / 10) * 10;
  return `${regime}|${bucket2}`;
}
function ensureRow(s) {
  let row = Q.get(s);
  if (!row) {
    row = { skip: 0, enter_small: 0, enter_full: 0, scale_out_50: 0 };
    Q.set(s, row);
  }
  return row;
}
function suggestAction(regime, confidence) {
  const row = ensureRow(stateKey(regime, confidence));
  if (Math.random() < EPS) return ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
  let best = "skip", bv = -Infinity;
  for (const a of ACTIONS) if (row[a] > bv) {
    bv = row[a];
    best = a;
  }
  return best;
}
function rewardAction(regime, confidence, action, realisedReturn) {
  const row = ensureRow(stateKey(regime, confidence));
  const reward = realisedReturn * ACT_MUL[action];
  row[action] = row[action] + LR$1 * (reward - row[action]);
}
const sgdModels = /* @__PURE__ */ new Map();
function sgdPredict(symbol, x) {
  const m = sgdModels.get(symbol);
  if (!m || m.w.length !== x.length) return 0;
  let s = m.b;
  for (let i = 0; i < x.length; i++) s += m.w[i] * x[i];
  return Math.tanh(s);
}
function sgdUpdate(symbol, x, y) {
  let m = sgdModels.get(symbol);
  if (!m || m.w.length !== x.length) {
    m = { w: new Array(x.length).fill(0), b: 0, lr: 0.03, n: 0 };
  }
  const pred = sgdPredict(symbol, x);
  const err = y - pred;
  for (let i = 0; i < x.length; i++) m.w[i] += m.lr * err * x[i];
  m.b += m.lr * err;
  m.n++;
  sgdModels.set(symbol, m);
}
const residualsBuf = /* @__PURE__ */ new Map();
function recordResidual(symbol, err) {
  const arr = residualsBuf.get(symbol) ?? [];
  arr.push(Math.abs(err));
  if (arr.length > 200) arr.shift();
  residualsBuf.set(symbol, arr);
}
function conformalInterval(symbol, point, alpha = 0.1) {
  const arr = residualsBuf.get(symbol);
  if (!arr || arr.length < 10) return { lower: point - 5, upper: point + 5, q: 5 };
  const sorted = [...arr].sort((a, b) => a - b);
  const k = Math.min(sorted.length - 1, Math.ceil((1 - alpha) * sorted.length));
  const q = sorted[k];
  return { lower: point - q, upper: point + q, q };
}
const stackState = { w: {}, b: 0, lr: 0.05, n: 0 };
const sigmoid$3 = (z) => 1 / (1 + Math.exp(-z));
function stackPredict(signals) {
  let z = stackState.b;
  for (const s of signals) z += (stackState.w[s.name] ?? 0) * s.value;
  return sigmoid$3(z);
}
function stackUpdate(signals, y) {
  const p = stackPredict(signals);
  const err = y - p;
  for (const s of signals) {
    stackState.w[s.name] = (stackState.w[s.name] ?? 0) + stackState.lr * err * s.value;
  }
  stackState.b += stackState.lr * err;
  stackState.n++;
}
function stackMultiplier(signals) {
  if (stackState.n < 10) return 1;
  const p = stackPredict(signals);
  return 0.7 + 0.55 * Math.max(0, Math.min(1, p));
}
function cusumChangePoint(rets, k = 5e-3, h = 0.05) {
  if (rets.length < 20) return false;
  let sPos = 0, sNeg = 0;
  const mean2 = rets.reduce((s, x) => s + x, 0) / rets.length;
  for (const r of rets.slice(-30)) {
    sPos = Math.max(0, sPos + (r - mean2) - k);
    sNeg = Math.min(0, sNeg + (r - mean2) + k);
    if (sPos > h || sNeg < -h) return true;
  }
  return false;
}
const sectorBursts = /* @__PURE__ */ new Map();
function recordSectorMove(sector, magnitude) {
  if (!sector) return;
  if (Math.abs(magnitude) < 0.02) return;
  const arr = sectorBursts.get(sector) ?? [];
  arr.push(Date.now());
  const cutoff = Date.now() - 60 * 60 * 1e3;
  const fresh = arr.filter((t) => t > cutoff);
  sectorBursts.set(sector, fresh);
}
function contagionMultiplier(sector) {
  if (!sector) return 1;
  const arr = sectorBursts.get(sector) ?? [];
  if (arr.length >= 5) return 0.85;
  if (arr.length >= 2) return 0.95;
  return 1;
}
function hmmState(rets) {
  if (rets.length < 20) return "neutral";
  const r = rets.slice(-20);
  const mean2 = r.reduce((s, x) => s + x, 0) / r.length;
  const vol = Math.sqrt(r.reduce((s, x) => s + (x - mean2) ** 2, 0) / r.length);
  const skew = r.filter((x) => x > 0).length / r.length;
  if (mean2 > 0.01 && vol > 0.03) return "euphoria";
  if (mean2 < -0.01 && vol > 0.04) return "panic";
  if (mean2 > 3e-3 && skew > 0.55) return "risk_on";
  if (mean2 < -3e-3 && skew < 0.45) return "risk_off";
  if (vol > 0.02 && Math.abs(mean2) < 2e-3) return "rotation";
  return "neutral";
}
function hmmMultiplier(state2) {
  switch (state2) {
    case "panic":
      return 0.6;
    case "euphoria":
      return 0.85;
    // late-cycle caution
    case "risk_on":
      return 1.1;
    case "risk_off":
      return 0.8;
    case "rotation":
      return 0.95;
    default:
      return 1;
  }
}
function leadLagScore(symbolRets, indexRets, lag = 1) {
  const n = Math.min(symbolRets.length, indexRets.length) - lag;
  if (n < 10) return 0;
  let num = 0, dx = 0, dy = 0;
  const mx = indexRets.slice(0, n).reduce((s, x) => s + x, 0) / n;
  const my = symbolRets.slice(lag, lag + n).reduce((s, x) => s + x, 0) / n;
  for (let i = 0; i < n; i++) {
    const xi = indexRets[i] - mx;
    const yi = symbolRets[i + lag] - my;
    num += xi * yi;
    dx += xi * xi;
    dy += yi * yi;
  }
  const denom = Math.sqrt(dx * dy);
  return denom > 0 ? num / denom : 0;
}
function obImbalance(candles) {
  if (candles.length < 5) return 0;
  const recent = candles.slice(-10);
  let buy = 0, sell = 0;
  for (const c of recent) {
    const range = Math.max(1e-9, c.high - c.low);
    const closePos = (c.close - c.low) / range;
    buy += c.volume * closePos;
    sell += c.volume * (1 - closePos);
  }
  const tot = buy + sell;
  return tot > 0 ? (buy - sell) / tot : 0;
}
const cfStats = { skipReward: 0, enterReward: 0, n: 0 };
function recordCounterfactual(action, realizedPct) {
  cfStats.enterReward += realizedPct;
  cfStats.n++;
}
function counterfactualEdge() {
  if (cfStats.n < 5) return 0;
  return (cfStats.enterReward - cfStats.skipReward) / cfStats.n;
}
const sectorSignals = /* @__PURE__ */ new Map();
function recordSectorSignal(sector, value) {
  if (!sector) return;
  const arr = sectorSignals.get(sector) ?? [];
  arr.push(value);
  if (arr.length > 50) arr.shift();
  sectorSignals.set(sector, arr);
}
function neighborConsensus(sector) {
  if (!sector) return { value: 0, n: 0 };
  const arr = sectorSignals.get(sector) ?? [];
  if (arr.length < 2) return { value: 0, n: arr.length };
  const avg = arr.reduce((s, x) => s + x, 0) / arr.length;
  return { value: Math.max(-1, Math.min(1, avg)), n: arr.length };
}
function maybeQueueForLabel(symbol, confidence, intervalWidth) {
  const isUncertain = intervalWidth > 15 || confidence >= 40 && confidence <= 60;
  if (!isUncertain) return;
}
function snapshotV2State() {
  return {
    sgd: Array.from(sgdModels.entries()),
    residuals: Array.from(residualsBuf.entries()),
    stack: stackState,
    cf: cfStats,
    sectorSignals: Array.from(sectorSignals.entries())
  };
}
function restoreV2State(s) {
  if (!s || typeof s !== "object") return;
  const o = s;
  try {
    if (Array.isArray(o.sgd)) {
      sgdModels.clear();
      for (const [k, v] of o.sgd) sgdModels.set(k, v);
    }
    if (Array.isArray(o.residuals)) {
      residualsBuf.clear();
      for (const [k, v] of o.residuals) residualsBuf.set(k, v);
    }
    if (o.stack && typeof o.stack === "object") {
      const st = o.stack;
      stackState.w = st.w ?? {};
      stackState.b = st.b ?? 0;
      stackState.lr = st.lr ?? 0.05;
      stackState.n = st.n ?? 0;
    }
    if (o.cf && typeof o.cf === "object") {
      const c = o.cf;
      cfStats.skipReward = c.skipReward ?? 0;
      cfStats.enterReward = c.enterReward ?? 0;
      cfStats.n = c.n ?? 0;
    }
    if (Array.isArray(o.sectorSignals)) {
      sectorSignals.clear();
      for (const [k, v] of o.sectorSignals) sectorSignals.set(k, v);
    }
  } catch {
  }
}
function tripleBarrierLabel(entry, futureCloses, cfg) {
  if (!Number.isFinite(entry) || entry <= 0 || futureCloses.length === 0) return 0;
  const upper = entry * (1 + cfg.tpPct);
  const lower = entry * (1 - cfg.slPct);
  const horizon = Math.min(cfg.maxBars, futureCloses.length);
  for (let i = 0; i < horizon; i++) {
    const p = futureCloses[i];
    if (p >= upper) return 1;
    if (p <= lower) return -1;
  }
  return 0;
}
const metaModel = { w: [0, 0, 0, 0, 0], b: 0, n: 0 };
const META_LR = 0.05;
function sigmoid$2(x) {
  return 1 / (1 + Math.exp(-x));
}
function metaProbability(features) {
  const f = padOrTrim(features, 5);
  let z = metaModel.b;
  for (let i = 0; i < 5; i++) z += metaModel.w[i] * f[i];
  return sigmoid$2(z);
}
function metaUpdate(features, y) {
  const f = padOrTrim(features, 5);
  const p = metaProbability(f);
  const err = p - y;
  for (let i = 0; i < 5; i++) {
    metaModel.w[i] -= META_LR * err * f[i];
    if (!Number.isFinite(metaModel.w[i])) metaModel.w[i] = 0;
  }
  metaModel.b -= META_LR * err;
  metaModel.n++;
}
function metaMultiplier(features) {
  if (metaModel.n < 30) return 1;
  const p = metaProbability(features);
  return 0.7 + p * 0.45;
}
function padOrTrim(a, n) {
  const out = a.slice(0, n);
  while (out.length < n) out.push(0);
  return out.map((v) => Number.isFinite(v) ? Math.max(-3, Math.min(3, v)) : 0);
}
const bmaState = { ll: {}, n: {} };
function bmaUpdate(modules, won) {
  for (const m of modules) {
    const p = sigmoid$2(m.value * 2);
    const lik = won ? p : 1 - p;
    const ll = Math.log(Math.max(1e-6, lik));
    bmaState.ll[m.name] = (bmaState.ll[m.name] ?? 0) + ll;
    bmaState.n[m.name] = (bmaState.n[m.name] ?? 0) + 1;
  }
}
function bmaMultiplier(modules) {
  if (modules.length === 0) return 1;
  const scores2 = modules.map((m) => {
    const n = bmaState.n[m.name] ?? 0;
    if (n < 10) return 0;
    return (bmaState.ll[m.name] ?? 0) / n;
  });
  const max = Math.max(...scores2);
  const exps = scores2.map((s) => Math.exp(s - max));
  const sum = exps.reduce((a, b) => a + b, 0) || 1;
  const weights = exps.map((e) => e / sum);
  let blended = 0;
  for (let i = 0; i < modules.length; i++) blended += weights[i] * modules[i].value;
  return 1 + Math.max(-1, Math.min(1, blended)) * 0.15;
}
function snapshotLDPState() {
  return { meta: metaModel, bma: bmaState };
}
function restoreLDPState(s) {
  try {
    const obj = s;
    if (obj?.meta && Array.isArray(obj.meta.w)) {
      metaModel.w = obj.meta.w.slice(0, 5);
      while (metaModel.w.length < 5) metaModel.w.push(0);
      metaModel.b = Number(obj.meta.b ?? 0);
      metaModel.n = Number(obj.meta.n ?? 0);
    }
    if (obj?.bma && obj.bma.ll && obj.bma.n) {
      Object.assign(bmaState.ll, obj.bma.ll);
      Object.assign(bmaState.n, obj.bma.n);
    }
  } catch {
  }
}
const isoData = [];
let isoFitted = null;
function isotonicAdd(rawConfidence, won) {
  if (!Number.isFinite(rawConfidence)) return;
  isoData.push({ x: rawConfidence, y: won ? 1 : 0, w: 1 });
  if (isoData.length > 2e3) isoData.shift();
  if (isoData.length % 25 === 0) isotonicFit();
}
function isotonicFit() {
  if (isoData.length < 20) return;
  const sorted = [...isoData].sort((a, b) => a.x - b.x);
  const xs = sorted.map((p) => p.x);
  const ys = sorted.map((p) => p.y);
  const ws = sorted.map((p) => p.w);
  const n = ys.length;
  const yhat = ys.slice();
  const what = ws.slice();
  let i = 0;
  while (i < n - 1) {
    if (yhat[i] > yhat[i + 1]) {
      const sw = what[i] + what[i + 1];
      const sy = (yhat[i] * what[i] + yhat[i + 1] * what[i + 1]) / sw;
      yhat[i] = sy;
      what[i] = sw;
      yhat.splice(i + 1, 1);
      what.splice(i + 1, 1);
      xs.splice(i + 1, 1);
      if (i > 0) i--;
    } else {
      i++;
    }
  }
  isoFitted = { xs, ys: yhat };
}
function isotonicCalibrate(rawConfidence) {
  if (!isoFitted || isoFitted.xs.length < 2) return rawConfidence / 100;
  const { xs, ys } = isoFitted;
  if (rawConfidence <= xs[0]) return ys[0];
  if (rawConfidence >= xs[xs.length - 1]) return ys[ys.length - 1];
  let lo = 0, hi = xs.length - 1;
  while (hi - lo > 1) {
    const mid = lo + hi >> 1;
    if (xs[mid] <= rawConfidence) lo = mid;
    else hi = mid;
  }
  const t = (rawConfidence - xs[lo]) / (xs[hi] - xs[lo] || 1);
  return ys[lo] + t * (ys[hi] - ys[lo]);
}
const dowStats$1 = /* @__PURE__ */ new Map();
function dowRecord(date, won, pnlPct) {
  const d = typeof date === "string" ? new Date(date) : date;
  const dow = d.getDay();
  const s = dowStats$1.get(dow) ?? { wins: 0, total: 0, pnlSum: 0 };
  s.total++;
  if (won) s.wins++;
  s.pnlSum += pnlPct;
  dowStats$1.set(dow, s);
}
function dowMultiplier(date) {
  const d = typeof date === "string" ? new Date(date) : date;
  const dow = d.getDay();
  const s = dowStats$1.get(dow);
  if (!s || s.total < 10) return 1;
  const winRate = s.wins / s.total;
  const edge = winRate - 0.5;
  return Math.max(0.9, Math.min(1.1, 1 + edge * 0.4));
}
const regimeStack = /* @__PURE__ */ new Map();
function regimeStackUpdate(regime, tierName, tierScore, won) {
  if (!tierName) return;
  const r = regimeStack.get(regime) ?? /* @__PURE__ */ new Map();
  const s = r.get(tierName) ?? { sumW: 0, sumWY: 0 };
  s.sumW += Math.abs(tierScore);
  s.sumWY += (won ? 1 : 0) * Math.abs(tierScore);
  r.set(tierName, s);
  regimeStack.set(regime, r);
}
function regimeStackWeight(regime, tierName) {
  const r = regimeStack.get(regime);
  if (!r) return 1;
  const s = r.get(tierName);
  if (!s || s.sumW < 3) return 1;
  const winRate = s.sumWY / s.sumW;
  return Math.max(0.7, Math.min(1.3, 1 + (winRate - 0.5) * 0.6));
}
function trendDirection(closes, lookback) {
  if (closes.length < lookback + 2) return 0;
  const last = closes[closes.length - 1];
  const ref = closes[closes.length - 1 - lookback];
  if (!ref) return 0;
  const chg = (last - ref) / ref;
  if (chg > 0.015) return 1;
  if (chg < -0.015) return -1;
  return 0;
}
function aggregateCloses(candles, step2) {
  if (step2 <= 1) return candles.map((c) => c.close);
  const out = [];
  for (let i = step2 - 1; i < candles.length; i += step2) {
    out.push(candles[i].close);
  }
  return out;
}
function multiTimeframeConfirm(candles) {
  if (!candles || candles.length < 45) {
    return { nudge: 0, daily: 0, weekly: 0, biweekly: 0, agree: false };
  }
  const daily = trendDirection(candles.map((c) => c.close), 5);
  const weekly = trendDirection(aggregateCloses(candles, 5), 4);
  const biweekly = trendDirection(aggregateCloses(candles, 10), 4);
  if (daily === 1 && weekly === 1 && biweekly === 1) {
    return { nudge: 10, daily, weekly, biweekly, agree: true };
  }
  if (daily === -1 && weekly === -1 && biweekly === -1) {
    return { nudge: -8, daily, weekly, biweekly, agree: true };
  }
  const sum = daily + weekly + biweekly;
  if (Math.abs(sum) === 1) return { nudge: -3, daily, weekly, biweekly, agree: false };
  return { nudge: 0, daily, weekly, biweekly, agree: false };
}
const sectorPerf = /* @__PURE__ */ new Map();
const SECTOR_TTL_MS$1 = 24 * 3600 * 1e3;
function recordSectorReturn$1(sector, return5dPct) {
  if (!sector || !Number.isFinite(return5dPct)) return;
  const now = Date.now();
  const cur = sectorPerf.get(sector);
  if (!cur || now - cur.ts > SECTOR_TTL_MS$1) {
    sectorPerf.set(sector, { sum: return5dPct, n: 1, ts: now });
    return;
  }
  cur.sum += return5dPct;
  cur.n += 1;
  cur.ts = now;
}
function sectorRotationMultiplier$1(sector) {
  if (!sector) return 1;
  const s = sectorPerf.get(sector);
  if (!s || s.n < 2) return 1;
  const avg = s.sum / s.n;
  if (avg > 2) return 1.1;
  if (avg < -2) return 0.88;
  return 1 + avg / 100;
}
const patternStats = /* @__PURE__ */ new Map();
const pendingPatterns = /* @__PURE__ */ new Map();
function notePendingPatterns(symbol, patterns) {
  if (!patterns || patterns.length === 0) return;
  pendingPatterns.set(symbol.toUpperCase(), patterns);
}
function consumePendingPatterns(symbol) {
  const k = symbol.toUpperCase();
  const p = pendingPatterns.get(k) ?? [];
  pendingPatterns.delete(k);
  return p;
}
function recordPatternOutcomeN(patterns, won) {
  if (!patterns || patterns.length === 0) return;
  const now = Date.now();
  for (const p of patterns) {
    const k = String(p);
    const cur = patternStats.get(k) ?? { wins: 0, losses: 0, updatedAt: now };
    if (won) cur.wins += 1;
    else cur.losses += 1;
    cur.updatedAt = now;
    patternStats.set(k, cur);
  }
}
function patternOutcomeMultiplier(patterns) {
  if (!patterns || patterns.length === 0) return 1;
  let weightedWinRate = 0;
  let weight = 0;
  for (const p of patterns) {
    const stat = patternStats.get(String(p));
    if (!stat) continue;
    const total = stat.wins + stat.losses;
    if (total < 5) continue;
    const wr = stat.wins / total;
    weightedWinRate += wr * total;
    weight += total;
  }
  if (weight === 0) return 1;
  const avgWR = weightedWinRate / weight;
  const mult = 1 + (avgWR - 0.5) * 1.2;
  return Math.max(0.6, Math.min(1.3, mult));
}
function regimeAwareMultiplier(signal, indexTrendPct) {
  if (indexTrendPct == null || Number.isNaN(indexTrendPct)) return 1;
  const dir = signal === "buy" || signal === "strong_buy" ? 1 : signal === "sell" || signal === "strong_sell" ? -1 : 0;
  if (dir === 0) return 1;
  if (indexTrendPct > 1) return dir > 0 ? 1.15 : 0.8;
  if (indexTrendPct < -1) return dir > 0 ? 0.75 : 1.15;
  return 0.95;
}
function anomalyOutlierFilter(candles) {
  if (!candles || candles.length < 20) {
    return { isAnomaly: false, multiplier: 1 };
  }
  const recent = candles.slice(-21);
  const history = recent.slice(0, -1);
  const last = recent[recent.length - 1];
  const prev = recent[recent.length - 2];
  const vols = history.map((c) => c.volume);
  const meanV = vols.reduce((s, v) => s + v, 0) / vols.length;
  const varV = vols.reduce((s, v) => s + (v - meanV) ** 2, 0) / vols.length;
  const stdV = Math.sqrt(varV) || 1;
  const zVol = (last.volume - meanV) / stdV;
  const gapPct = prev.close > 0 ? (last.open - prev.close) / prev.close * 100 : 0;
  if (zVol > 5 || Math.abs(gapPct) > 10) {
    return {
      isAnomaly: true,
      reason: zVol > 5 ? `volume_spike_z=${zVol.toFixed(1)}` : `gap_${gapPct.toFixed(1)}pct`,
      multiplier: 0.55
    };
  }
  if (zVol > 4 || Math.abs(gapPct) > 8) {
    return {
      isAnomaly: true,
      reason: zVol > 4 ? `volume_elevated_z=${zVol.toFixed(1)}` : `gap_${gapPct.toFixed(1)}pct`,
      multiplier: 0.75
    };
  }
  return { isAnomaly: false, multiplier: 1 };
}
const kellyByPattern = /* @__PURE__ */ new Map();
function recordKellyOutcome(pattern, pnlPct) {
  if (!pattern) return;
  const s = kellyByPattern.get(pattern) ?? { wins: 0, losses: 0, sumWin: 0, sumLoss: 0 };
  if (pnlPct >= 0) {
    s.wins++;
    s.sumWin += pnlPct;
  } else {
    s.losses++;
    s.sumLoss += -pnlPct;
  }
  kellyByPattern.set(pattern, s);
}
function kellyFraction(patterns) {
  let best = 0;
  for (const p of patterns) {
    const s = kellyByPattern.get(p);
    if (!s) continue;
    const n = s.wins + s.losses;
    if (n < 5) continue;
    const winRate = s.wins / n;
    const avgWin = s.wins > 0 ? s.sumWin / s.wins : 0;
    const avgLoss = s.losses > 0 ? s.sumLoss / s.losses : 0;
    if (avgLoss <= 0) continue;
    const b = avgWin / avgLoss;
    const f = (b * winRate - (1 - winRate)) / b;
    const quarter = Math.max(0, Math.min(0.25, f * 0.25));
    if (quarter > best) best = quarter;
  }
  return best;
}
const sectorPickCounts = /* @__PURE__ */ new Map();
const SECTOR_TTL_MS = 6 * 60 * 60 * 1e3;
function noteSectorPick(sector) {
  if (!sector) return;
  const now = Date.now();
  const cur = sectorPickCounts.get(sector);
  if (!cur || now - cur.ts > SECTOR_TTL_MS) {
    sectorPickCounts.set(sector, { count: 1, ts: now });
  } else {
    cur.count += 1;
    cur.ts = now;
  }
}
function sectorConcentrationMultiplier(sector) {
  if (!sector) return 1;
  const cur = sectorPickCounts.get(sector);
  if (!cur) return 1;
  if (Date.now() - cur.ts > SECTOR_TTL_MS) return 1;
  if (cur.count <= 2) return 1;
  if (cur.count === 3) return 0.92;
  if (cur.count === 4) return 0.85;
  return 0.78;
}
const dowStats = Array.from({ length: 7 }, () => ({ wins: 0, total: 0 }));
function recordDowOutcome(date, won) {
  const d = date.getDay();
  dowStats[d].total++;
  if (won) dowStats[d].wins++;
}
function dowLearnedMultiplier(date) {
  const s = dowStats[date.getDay()];
  if (s.total < 10) return 1;
  const wr = s.wins / s.total;
  return Math.max(0.85, Math.min(1.15, 1 + (wr - 0.5) * 0.8));
}
function earningsProximityGuard(daysToEarnings) {
  if (daysToEarnings === null || daysToEarnings === void 0) return 1;
  const d = Math.abs(daysToEarnings);
  if (d <= 1) return 0.65;
  if (d <= 3) return 0.8;
  if (d <= 5) return 0.92;
  return 1;
}
const metaStats = /* @__PURE__ */ new Map();
["technical", "fundamental", "sentiment", "macro", "sector"].forEach((k) => metaStats.set(k, { hits: 0, total: 0 }));
function metaScoreWeights() {
  const keys = ["technical", "fundamental", "sentiment", "macro", "sector"];
  const raw = {};
  let sum = 0;
  for (const k of keys) {
    const s = metaStats.get(k);
    const wr = s.total >= 20 ? s.hits / s.total : 0.5;
    const w = Math.max(0.4, Math.min(1.6, wr * 2));
    raw[k] = w;
    sum += w;
  }
  const target = keys.length;
  for (const k of keys) raw[k] = raw[k] * (target / sum);
  return raw;
}
function metaWeightedMultiplier(scoreContribs) {
  const w = metaScoreWeights();
  let mult = 1, n = 0;
  for (const [k, v] of Object.entries(scoreContribs)) {
    if (typeof v !== "number") continue;
    mult *= 1 + (w[k] - 1) * 0.05 * Math.sign(v);
    n++;
  }
  return n === 0 ? 1 : Math.max(0.85, Math.min(1.18, mult));
}
const calibBuckets$1 = Array.from({ length: 10 }, () => ({ sum: 0, hits: 0, total: 0 }));
function recordCalibration(confidence0_100, won) {
  const bucket2 = Math.max(0, Math.min(9, Math.floor(confidence0_100 / 10)));
  const b = calibBuckets$1[bucket2];
  b.sum += confidence0_100;
  b.total++;
  if (won) b.hits++;
}
function reliabilityCalibrate(confidence0_100) {
  const bucket2 = Math.max(0, Math.min(9, Math.floor(confidence0_100 / 10)));
  const b = calibBuckets$1[bucket2];
  if (b.total < 15) return confidence0_100;
  const actual = b.hits / b.total * 100;
  return Math.max(0, Math.min(100, actual * 0.6 + confidence0_100 * 0.4));
}
const MIN_DAILY_VALUE_EGP = 5e5;
function liquidityMultiplier(candles) {
  if (!candles || candles.length < 5) return 1;
  const recent = candles.slice(-5);
  const avgValue = recent.reduce((s, c) => s + c.close * c.volume, 0) / recent.length;
  if (avgValue < MIN_DAILY_VALUE_EGP) return 0.55;
  if (avgValue < MIN_DAILY_VALUE_EGP * 3) return 0.85;
  return 1;
}
function suspensionPenalty(candles) {
  if (!candles || candles.length < 10) return 1;
  const last10 = candles.slice(-10);
  const uniqueCloses = new Set(last10.map((c) => c.close.toFixed(2))).size;
  return uniqueCloses <= 2 ? 0.7 : 1;
}
const decayByModel = /* @__PURE__ */ new Map();
function recordModelOutcome(model, won) {
  const w = decayByModel.get(model) ?? { recent: [], older: [] };
  w.recent.push(won ? 1 : 0);
  if (w.recent.length > 30) w.older.push(w.recent.shift());
  if (w.older.length > 60) w.older.shift();
  decayByModel.set(model, w);
}
function decayMultiplier(model) {
  const w = decayByModel.get(model);
  if (!w || w.recent.length < 20 || w.older.length < 20) return 1;
  const r = w.recent.reduce((s, x) => s + x, 0) / w.recent.length;
  const o = w.older.reduce((s, x) => s + x, 0) / w.older.length;
  const drop = o - r;
  if (drop > 0.15) return 0.8;
  if (drop > 0.08) return 0.92;
  if (drop < -0.1) return 1.08;
  return 1;
}
const stratStats = /* @__PURE__ */ new Map();
function classifyStrategy(args) {
  const { rsi, close, sma50, bbUpper, bbLower } = args;
  if (close && bbUpper && close > bbUpper * 0.99) return "breakout";
  if (rsi != null && rsi < 35 && close && bbLower && close < bbLower * 1.02) return "mean_reversion";
  if (close && sma50 && close > sma50 * 1.03) return "momentum";
  return "other";
}
function recordStrategyOutcome(family, won) {
  const s = stratStats.get(family) ?? { wins: 0, total: 0 };
  s.total++;
  if (won) s.wins++;
  stratStats.set(family, s);
}
function strategyBMAMultiplier(family) {
  const s = stratStats.get(family);
  if (!s || s.total < 15) return 1;
  const wr = s.wins / s.total;
  return Math.max(0.75, Math.min(1.2, 0.5 + wr));
}
const residualsByRegime = /* @__PURE__ */ new Map();
function addConformalResidual(regime, residualPct) {
  const arr = residualsByRegime.get(regime) ?? [];
  arr.push(Math.abs(residualPct));
  if (arr.length > 200) arr.shift();
  residualsByRegime.set(regime, arr);
}
function conformalHalfWidth(regime, coverage = 0.9) {
  const arr = residualsByRegime.get(regime);
  if (!arr || arr.length < 30) return null;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor(coverage * sorted.length));
  return sorted[idx];
}
const todayUniverse = { scores: [], ts: 0 };
const ONE_DAY_MS = 24 * 60 * 60 * 1e3;
function recordUniverseScore(score) {
  if (Date.now() - todayUniverse.ts > ONE_DAY_MS) {
    todayUniverse.scores = [];
    todayUniverse.ts = Date.now();
  }
  todayUniverse.scores.push(score);
}
function crossSectionalZ(score) {
  const arr = todayUniverse.scores;
  if (arr.length < 5) return 0;
  const mean2 = arr.reduce((s, x) => s + x, 0) / arr.length;
  const variance2 = arr.reduce((s, x) => s + (x - mean2) ** 2, 0) / arr.length;
  const sd = Math.sqrt(variance2) || 1;
  return (score - mean2) / sd;
}
function crossSectionalMultiplier(score) {
  const z = crossSectionalZ(score);
  if (z > 1.28) return 1.1;
  if (z > 0.5) return 1.04;
  if (z < -1.28) return 0.88;
  if (z < -0.5) return 0.96;
  return 1;
}
function hmmRegimeQ(returns2) {
  if (!returns2 || returns2.length < 10) return "sideways";
  const tail = returns2.slice(-30);
  const mean2 = tail.reduce((a, b) => a + b, 0) / tail.length;
  const sd = Math.sqrt(
    tail.reduce((a, b) => a + (b - mean2) ** 2, 0) / tail.length
  ) || 1e-9;
  const z = mean2 / (sd / Math.sqrt(tail.length));
  if (z > 0.6) return "bull";
  if (z < -0.6) return "bear";
  return "sideways";
}
const hmmStats = {
  bull: { wins: 0, total: 0 },
  bear: { wins: 0, total: 0 },
  sideways: { wins: 0, total: 0 }
};
function recordHmmOutcomeQ(state2, won) {
  const s = hmmStats[state2] ?? hmmStats.sideways;
  s.total++;
  if (won) s.wins++;
}
function hmmMultiplierQ(state2) {
  const s = hmmStats[state2];
  if (!s || s.total < 10) return 1;
  const wr = s.wins / s.total;
  return Math.max(0.85, Math.min(1.15, 0.85 + (wr - 0.4) * 0.75));
}
const betaState = /* @__PURE__ */ new Map();
function recordBayesOutcomeQ(pattern, won) {
  const s = betaState.get(pattern) ?? { alpha: 1, beta: 1 };
  if (won) s.alpha++;
  else s.beta++;
  betaState.set(pattern, s);
}
function bayesianWinrateQ(pattern) {
  const s = betaState.get(pattern) ?? { alpha: 1, beta: 1 };
  const n = s.alpha + s.beta - 2;
  const mean2 = s.alpha / (s.alpha + s.beta);
  const v = s.alpha * s.beta / ((s.alpha + s.beta) ** 2 * (s.alpha + s.beta + 1));
  const sd = Math.sqrt(v);
  return {
    mean: mean2,
    lower: Math.max(0, mean2 - 1.96 * sd),
    upper: Math.min(1, mean2 + 1.96 * sd),
    n
  };
}
function bayesShrinkMultiplierQ(patterns) {
  if (!patterns.length) return 1;
  let widthAvg = 0;
  for (const p of patterns) {
    const w = bayesianWinrateQ(p);
    widthAvg += w.upper - w.lower;
  }
  widthAvg /= patterns.length;
  return Math.max(0.85, 1 - widthAvg * 0.15);
}
const featureContrib = /* @__PURE__ */ new Map();
function recordFeatureContributionQ(feature, value, realisedPct) {
  const s = featureContrib.get(feature) ?? { sum: 0, abs: 0, n: 0 };
  const c = Math.tanh(value) * Math.sign(realisedPct);
  s.sum += c;
  s.abs += Math.abs(c);
  s.n++;
  featureContrib.set(feature, s);
}
function featureImpactMultiplierQ(features) {
  if (!features.length) return 1;
  let score = 0, n = 0;
  for (const f of features) {
    const s = featureContrib.get(f);
    if (!s || s.n < 5) continue;
    score += s.sum / s.n;
    n++;
  }
  if (n === 0) return 1;
  const avg = score / n;
  return Math.max(0.85, Math.min(1.15, 1 + avg * 0.15));
}
const trainDist$1 = {};
const prodDist = {};
const CAP = 500;
function pushBounded(arr, v) {
  arr.push(v);
  if (arr.length > CAP) arr.splice(0, arr.length - CAP);
}
function recordTrainFeatureQ(name, value) {
  (trainDist$1[name] ??= []).length;
  pushBounded(trainDist$1[name] ??= [], value);
}
function recordProdFeatureQ(name, value) {
  pushBounded(prodDist[name] ??= [], value);
}
function driftAlarmMultiplierQ() {
  const names = Object.keys(trainDist$1).filter((n) => (prodDist[n]?.length ?? 0) >= 20);
  if (names.length === 0) return 1;
  let maxDrift = 0;
  for (const n of names) {
    const t = trainDist$1[n], p = prodDist[n];
    const mt = t.reduce((a, b) => a + b, 0) / t.length;
    const mp = p.reduce((a, b) => a + b, 0) / p.length;
    const sdT = Math.sqrt(t.reduce((a, b) => a + (b - mt) ** 2, 0) / t.length) || 1e-9;
    const d = Math.abs(mp - mt) / sdT;
    if (d > maxDrift) maxDrift = d;
  }
  if (maxDrift < 0.5) return 1;
  if (maxDrift < 1) return 0.95;
  if (maxDrift < 1.5) return 0.9;
  return 0.85;
}
let confSamples = [];
function recordConfidenceSampleQ(c) {
  confSamples.push(c);
  if (confSamples.length > 1e3) confSamples = confSamples.slice(-1e3);
}
function winsorizedConfidenceQ(c) {
  if (confSamples.length < 50) return c;
  const mean2 = confSamples.reduce((a, b) => a + b, 0) / confSamples.length;
  const sd = Math.sqrt(
    confSamples.reduce((a, b) => a + (b - mean2) ** 2, 0) / confSamples.length
  ) || 1e-9;
  const lo = mean2 - 2.5 * sd;
  const hi = mean2 + 2.5 * sd;
  return Math.max(lo, Math.min(hi, c));
}
function multiHorizonForecastQ(returns2) {
  if (!returns2 || returns2.length < 5) {
    return { h3: 0, h5: 0, h10: 0, h20: 0 };
  }
  const ewma = (alpha) => {
    let v = returns2[0];
    for (let i = 1; i < returns2.length; i++) v = alpha * returns2[i] + (1 - alpha) * v;
    return v;
  };
  const h3 = ewma(0.6) * 3;
  const h5 = ewma(0.4) * 5;
  const h10 = ewma(0.2) * 10;
  const h20 = ewma(0.1) * 20;
  return { h3, h5, h10, h20 };
}
const caseBank = [];
const CASE_CAP = 2e3;
function recordHistoricalCaseQ(features, won, realisedPct) {
  caseBank.push({ features: features.slice(0, 8), won, pct: realisedPct });
  if (caseBank.length > CASE_CAP) caseBank.splice(0, caseBank.length - CASE_CAP);
}
function dist$1(a, b) {
  const n = Math.min(a.length, b.length);
  let s = 0;
  for (let i = 0; i < n; i++) s += (a[i] - b[i]) ** 2;
  return Math.sqrt(s);
}
function knnSimilarityMultiplierQ(features, k = 5) {
  if (caseBank.length < 20) return { multiplier: 1, analogs: 0, winRate: 0.5 };
  const scored = caseBank.map((c) => ({ c, d: dist$1(c.features, features) })).sort((a, b) => a.d - b.d).slice(0, k);
  const wins = scored.filter((s) => s.c.won).length;
  const wr = wins / scored.length;
  const mult = Math.max(0.85, Math.min(1.15, 1 + (wr - 0.5) * 0.3));
  return { multiplier: mult, analogs: scored.length, winRate: wr };
}
function snapshotTierQState() {
  return {
    hmmStats,
    beta: Array.from(betaState.entries()),
    featureContrib: Array.from(featureContrib.entries()),
    confSamples: confSamples.slice(-500),
    caseBank: caseBank.slice(-500)
  };
}
function restoreTierQState(s) {
  const o = s;
  if (!o) return;
  if (o.hmmStats) Object.assign(hmmStats, o.hmmStats);
  if (o.beta) for (const [k, v] of o.beta) betaState.set(k, v);
  if (o.featureContrib) for (const [k, v] of o.featureContrib) featureContrib.set(k, v);
  if (o.confSamples) confSamples = o.confSamples.slice(-1e3);
  if (o.caseBank) caseBank.push(...o.caseBank.slice(-CASE_CAP));
}
const arms = /* @__PURE__ */ new Map();
function gammaSample(k) {
  if (k < 1) return gammaSample(k + 1) * Math.pow(Math.random(), 1 / k);
  const d = k - 1 / 3, c = 1 / Math.sqrt(9 * d);
  while (true) {
    let x, v;
    do {
      const u1 = Math.random(), u2 = Math.random();
      x = Math.sqrt(-2 * Math.log(u1 || 1e-9)) * Math.cos(2 * Math.PI * u2);
      v = 1 + c * x;
    } while (v <= 0);
    v = v * v * v;
    const u = Math.random();
    if (u < 1 - 0.0331 * x * x * x * x) return d * v;
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}
function betaSample$1(a, b) {
  const x = gammaSample(Math.max(1, a));
  const y = gammaSample(Math.max(1, b));
  return x / (x + y || 1);
}
function thompsonSampleR(arm) {
  const s = arms.get(arm) ?? { alpha: 1, beta: 1 };
  return betaSample$1(s.alpha, s.beta);
}
function recordArmOutcomeR(arm, won) {
  const s = arms.get(arm) ?? { alpha: 1, beta: 1 };
  if (won) s.alpha++;
  else s.beta++;
  arms.set(arm, s);
}
function thompsonMultiplierR(arm) {
  const s = arms.get(arm);
  if (!s || s.alpha + s.beta < 6) return 1;
  const p = thompsonSampleR(arm);
  return Math.max(0.85, Math.min(1.15, 0.85 + (p - 0.4) * 0.75));
}
const ipwBuckets = /* @__PURE__ */ new Map();
function bucket(conf) {
  return Math.max(0, Math.min(9, Math.floor(conf / 10)));
}
function recordIpwR(confidence, propensity, realisedPct) {
  const b = bucket(confidence);
  const w = 1 / Math.max(0.05, Math.min(0.95, propensity));
  const s = ipwBuckets.get(b) ?? { n: 0, sumW: 0, sumWY: 0 };
  s.n++;
  s.sumW += w;
  s.sumWY += w * realisedPct;
  ipwBuckets.set(b, s);
}
function ipwMultiplierR(confidence) {
  const s = ipwBuckets.get(bucket(confidence));
  if (!s || s.n < 8) return 1;
  const ate = s.sumWY / (s.sumW || 1);
  return Math.max(0.9, Math.min(1.1, 1 + ate / 50));
}
const sectorRet$1 = /* @__PURE__ */ new Map();
function recordSectorReturnR(sector, realisedPct) {
  if (!sector) return;
  const a = sectorRet$1.get(sector) ?? [];
  a.push(realisedPct);
  if (a.length > 200) a.splice(0, a.length - 200);
  sectorRet$1.set(sector, a);
}
function sectorMomentumMultiplierR(sector) {
  if (!sector) return 1;
  const a = sectorRet$1.get(sector);
  if (!a || a.length < 10) return 1;
  const recent = a.slice(-20);
  const mean2 = recent.reduce((x, y) => x + y, 0) / recent.length;
  return Math.max(0.9, Math.min(1.1, 1 + Math.max(-5, Math.min(5, mean2)) / 50));
}
function earningsProximityMultiplierR(nextEarningsDate2) {
  if (!nextEarningsDate2) return 1;
  const days = (new Date(nextEarningsDate2).getTime() - Date.now()) / 864e5;
  if (days < 0 || days > 14) return 1;
  if (days <= 1) return 0.8;
  if (days <= 3) return 0.88;
  if (days <= 7) return 0.94;
  return 0.97;
}
function anchoredVwapDevR(candles, lookback = 30) {
  if (!candles || candles.length < 5) return null;
  const tail = candles.slice(-lookback);
  let anchor = 0;
  for (let i = 1; i < tail.length; i++) {
    if (tail[i].low < tail[anchor].low) anchor = i;
  }
  const seg = tail.slice(anchor);
  let pv = 0, vv = 0;
  for (const c of seg) {
    const tp = (c.high + c.low + c.close) / 3;
    pv += tp * c.volume;
    vv += c.volume;
  }
  if (vv <= 0) return null;
  const vwap = pv / vv;
  const last = seg[seg.length - 1].close;
  return { vwap, deviationPct: (last - vwap) / vwap * 100 };
}
function anchoredVwapMultiplierR(dev) {
  if (dev == null) return 1;
  if (dev > 8) return 0.92;
  if (dev > 5) return 0.96;
  if (dev < -8) return 1.05;
  if (dev < -5) return 1.03;
  return 1;
}
const sentHistory = /* @__PURE__ */ new Map();
function recordSentimentR(symbol, score) {
  const a = sentHistory.get(symbol) ?? [];
  a.push({ ts: Date.now(), score });
  const cutoff = Date.now() - 5 * 864e5;
  while (a.length && a[0].ts < cutoff) a.shift();
  sentHistory.set(symbol, a);
}
function sentimentVelocityR(symbol) {
  const a = sentHistory.get(symbol);
  if (!a || a.length < 2) return 0;
  const now = Date.now();
  const recent = a.filter((s) => now - s.ts <= 24 * 3600 * 1e3);
  const prior = a.filter((s) => now - s.ts > 24 * 3600 * 1e3 && now - s.ts <= 48 * 3600 * 1e3);
  if (!recent.length || !prior.length) return 0;
  const r = recent.reduce((x, s) => x + s.score, 0) / recent.length;
  const p = prior.reduce((x, s) => x + s.score, 0) / prior.length;
  return r - p;
}
function sentimentVelocityMultiplierR(symbol) {
  const v = sentimentVelocityR(symbol);
  if (!v) return 1;
  return Math.max(0.92, Math.min(1.08, 1 + Math.max(-0.5, Math.min(0.5, v)) * 0.16));
}
function volumeProfileR(candles, bins = 24) {
  if (!candles || candles.length < 10) return null;
  let lo = Infinity, hi = -Infinity;
  for (const c of candles) {
    if (c.low < lo) lo = c.low;
    if (c.high > hi) hi = c.high;
  }
  if (!isFinite(lo) || !isFinite(hi) || hi <= lo) return null;
  const step2 = (hi - lo) / bins;
  const vols = new Array(bins).fill(0);
  let total = 0;
  for (const c of candles) {
    const tp = (c.high + c.low + c.close) / 3;
    const b = Math.max(0, Math.min(bins - 1, Math.floor((tp - lo) / step2)));
    vols[b] += c.volume;
    total += c.volume;
  }
  let pocIdx = 0;
  for (let i = 1; i < bins; i++) if (vols[i] > vols[pocIdx]) pocIdx = i;
  const target = total * 0.7;
  let acc = vols[pocIdx], lo2 = pocIdx, hi2 = pocIdx;
  while (acc < target && (lo2 > 0 || hi2 < bins - 1)) {
    const lv = lo2 > 0 ? vols[lo2 - 1] : -1;
    const hv = hi2 < bins - 1 ? vols[hi2 + 1] : -1;
    if (hv >= lv) {
      hi2++;
      acc += vols[hi2];
    } else {
      lo2--;
      acc += vols[lo2];
    }
  }
  return {
    poc: lo + (pocIdx + 0.5) * step2,
    vah: lo + (hi2 + 1) * step2,
    val: lo + lo2 * step2
  };
}
function volumeProfileMultiplierR(price, vp) {
  if (!vp) return 1;
  if (price <= vp.val) return 1.05;
  if (price >= vp.vah) return 0.95;
  return 1;
}
function ensembleDisagreementR(multipliers) {
  const m = multipliers.filter((x) => isFinite(x));
  if (m.length < 3) return 1;
  const mean2 = m.reduce((a, b) => a + b, 0) / m.length;
  const variance2 = m.reduce((a, b) => a + (b - mean2) ** 2, 0) / m.length;
  const std2 = Math.sqrt(variance2);
  if (std2 < 0.03) return 1.08;
  if (std2 < 0.06) return 1.03;
  if (std2 > 0.15) return 0.88;
  if (std2 > 0.1) return 0.94;
  return 1;
}
function snapshotTierRState() {
  return {
    arms: Array.from(arms.entries()),
    ipw: Array.from(ipwBuckets.entries()),
    sectorRet: Array.from(sectorRet$1.entries())
  };
}
function restoreTierRState(s) {
  const o = s;
  if (!o) return;
  if (o.arms) for (const [k, v] of o.arms) arms.set(k, v);
  if (o.ipw) for (const [k, v] of o.ipw) ipwBuckets.set(k, v);
  if (o.sectorRet) for (const [k, v] of o.sectorRet) sectorRet$1.set(k, v.slice(-200));
}
function kalmanTrendS(prices) {
  if (!prices || prices.length < 2) return prices?.[prices.length - 1] ?? 0;
  let x = prices[0], p = 1;
  const q = 1e-4, r = 0.01;
  for (let i = 1; i < prices.length; i++) {
    p += q;
    const k = p / (p + r);
    x = x + k * (prices[i] - x);
    p = (1 - k) * p;
  }
  return x;
}
function kalmanTrendMultiplierS(price, kalman) {
  if (!price || !kalman) return 1;
  const dev = (price - kalman) / kalman;
  if (dev > 0.05) return 1.05;
  if (dev < -0.05) return 0.95;
  return 1;
}
function hurstS(returns2) {
  if (!returns2 || returns2.length < 20) return 0.5;
  const lags = [2, 4, 8, 16];
  const tau = [];
  for (const lag of lags) {
    const diffs = [];
    for (let i = lag; i < returns2.length; i++) diffs.push(returns2[i] - returns2[i - lag]);
    const mean2 = diffs.reduce((a, b) => a + b, 0) / diffs.length;
    const v = diffs.reduce((a, b) => a + (b - mean2) ** 2, 0) / diffs.length;
    tau.push(Math.sqrt(Math.max(v, 1e-12)));
  }
  const lx = lags.map((l) => Math.log(l));
  const ly = tau.map((t) => Math.log(t));
  const mx = lx.reduce((a, b) => a + b, 0) / lx.length;
  const my = ly.reduce((a, b) => a + b, 0) / ly.length;
  let num = 0, den = 0;
  for (let i = 0; i < lx.length; i++) {
    num += (lx[i] - mx) * (ly[i] - my);
    den += (lx[i] - mx) ** 2;
  }
  const h = den > 0 ? num / den : 0.5;
  return Math.max(0, Math.min(1, h));
}
function hurstMultiplierS(h, signalDir) {
  if (h > 0.6 && signalDir !== 0) return 1.06;
  if (h < 0.4 && signalDir !== 0) return 0.94;
  return 1;
}
function cusumChangeS(returns2, threshold = 5) {
  if (!returns2 || returns2.length < 20) return false;
  const tail = returns2.slice(-60);
  const mean2 = tail.reduce((a, b) => a + b, 0) / tail.length;
  const sd = Math.sqrt(tail.reduce((a, b) => a + (b - mean2) ** 2, 0) / tail.length) || 1e-6;
  let posS = 0, negS = 0;
  for (const r of tail) {
    const z = (r - mean2) / sd;
    posS = Math.max(0, posS + z - 0.5);
    negS = Math.max(0, negS - z - 0.5);
    if (posS > threshold || negS > threshold) return true;
  }
  return false;
}
function cusumMultiplierS(changed) {
  return changed ? 0.92 : 1;
}
const icBuf = /* @__PURE__ */ new Map();
const IC_CAP = 200;
function recordICSampleS(feature, signal, realised) {
  const a = icBuf.get(feature) ?? [];
  a.push({ signal, realised });
  if (a.length > IC_CAP) a.shift();
  icBuf.set(feature, a);
}
function spearman(xs, ys) {
  if (xs.length < 5) return 0;
  const rank = (arr) => {
    const idx = arr.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]);
    const r = new Array(arr.length).fill(0);
    idx.forEach(([, i], k) => {
      r[i] = k + 1;
    });
    return r;
  };
  const rx = rank(xs), ry = rank(ys);
  const n = xs.length;
  let d2 = 0;
  for (let i = 0; i < n; i++) d2 += (rx[i] - ry[i]) ** 2;
  return 1 - 6 * d2 / (n * (n * n - 1));
}
function icScoreS(feature) {
  const a = icBuf.get(feature);
  if (!a || a.length < 20) return 0;
  return spearman(a.map((s) => s.signal), a.map((s) => s.realised));
}
function icMultiplierS(features) {
  if (!features.length) return 1;
  const ics = features.map((f) => icScoreS(f)).filter((x) => x !== 0);
  if (!ics.length) return 1;
  const avg = ics.reduce((a, b) => a + b, 0) / ics.length;
  return Math.max(0.9, Math.min(1.1, 1 + Math.max(-0.3, Math.min(0.3, avg)) / 3));
}
function volTargetMultiplierS(returns2, targetAnnualVol = 0.15) {
  if (!returns2 || returns2.length < 20) return 1;
  const tail = returns2.slice(-30);
  const mean2 = tail.reduce((a, b) => a + b, 0) / tail.length;
  const dailyVol = Math.sqrt(tail.reduce((a, b) => a + (b - mean2) ** 2, 0) / tail.length) || 1e-6;
  const annualVol = dailyVol * Math.sqrt(252);
  const ratio = targetAnnualVol / annualVol;
  return Math.max(0.85, Math.min(1.15, ratio));
}
const priceCache = /* @__PURE__ */ new Map();
function cachePriceForPairsS(symbol, price) {
  const a = priceCache.get(symbol) ?? [];
  a.push(price);
  if (a.length > 120) a.shift();
  priceCache.set(symbol, a);
}
function orderFlowImbalanceS(c) {
  const range = c.high - c.low;
  if (range <= 0) return 0;
  return (c.close - c.open) / range;
}
function orderFlowMultiplierS(ofi, signalDir) {
  if (!signalDir) return 1;
  const aligned = Math.sign(ofi) === Math.sign(signalDir);
  const mag = Math.min(1, Math.abs(ofi));
  return aligned ? 1 + mag * 0.06 : 1 - mag * 0.06;
}
const metaBuf = [];
const META_CAP = 500;
let metaW = [0, 0, 0, 0];
let metaB = 0;
function sigmoid$1(x) {
  return 1 / (1 + Math.exp(-x));
}
function recordMetaConfidenceS(features, won) {
  const f = features.slice(0, 4);
  while (f.length < 4) f.push(0);
  metaBuf.push({ features: f, correct: won ? 1 : 0 });
  if (metaBuf.length > META_CAP) metaBuf.shift();
  const z = f.reduce((s, x, i) => s + metaW[i] * x, metaB);
  const p = sigmoid$1(z);
  const err = (won ? 1 : 0) - p;
  const lr = 0.02;
  metaW = metaW.map((w, i) => w + lr * err * f[i]);
  metaB += lr * err;
}
function metaConfidenceS(features) {
  if (metaBuf.length < 30) return 1;
  const f = features.slice(0, 4);
  while (f.length < 4) f.push(0);
  const z = f.reduce((s, x, i) => s + metaW[i] * x, metaB);
  const p = sigmoid$1(z);
  return Math.max(0.85, Math.min(1.1, 0.85 + p * 0.25));
}
function snapshotTierSState() {
  return {
    ic: Array.from(icBuf.entries()),
    metaW,
    metaB,
    metaBuf: metaBuf.slice(-200)
  };
}
function restoreTierSState(s) {
  const o = s;
  if (!o) return;
  if (o.ic) for (const [k, v] of o.ic) icBuf.set(k, v.slice(-IC_CAP));
  if (o.metaW && o.metaW.length === 4) metaW = o.metaW;
  if (typeof o.metaB === "number") metaB = o.metaB;
  if (o.metaBuf) metaBuf.push(...o.metaBuf.slice(-META_CAP));
}
const hmmHist = [];
const HMM_CAP = 400;
const hmmCounts = /* @__PURE__ */ new Map();
function classifyHmm(rets) {
  if (!rets.length) return "chop";
  const tail = rets.slice(-20);
  const m = tail.reduce((a, b) => a + b, 0) / tail.length;
  const v = tail.reduce((a, b) => a + (b - m) ** 2, 0) / tail.length;
  if (v > 9e-4 && Math.abs(m) < 1e-3) return "chop";
  return m > 0 ? "bull" : "bear";
}
function recordHmmStateT(rets) {
  const s = classifyHmm(rets);
  const prev = hmmHist[hmmHist.length - 1];
  if (prev) {
    const k = `${prev}->${s}`;
    hmmCounts.set(k, (hmmCounts.get(k) ?? 0) + 1);
  }
  hmmHist.push(s);
  if (hmmHist.length > HMM_CAP) hmmHist.shift();
  return s;
}
function hmmTransitionMultiplierT(rets) {
  const cur = classifyHmm(rets);
  const prev = hmmHist[hmmHist.length - 1] ?? cur;
  let total = 0, stay = 0;
  for (const [k, v] of hmmCounts) {
    if (k.startsWith(`${prev}->`)) {
      total += v;
      if (k === `${prev}->${prev}`) stay += v;
    }
  }
  if (total < 10) return 1;
  const pStay = stay / total;
  return 0.92 + pStay * 0.16;
}
let garchSigma2 = 1e-4;
const GARCH = { omega: 2e-6, alpha: 0.08, beta: 0.9 };
function updateGarchT(ret) {
  garchSigma2 = GARCH.omega + GARCH.alpha * ret * ret + GARCH.beta * garchSigma2;
}
function garchVolMultiplierT(rets) {
  if (!rets.length) return 1;
  for (const r of rets.slice(-30)) updateGarchT(r);
  const fcastVol = Math.sqrt(garchSigma2 * 252);
  if (fcastVol > 0.35) return 0.92;
  if (fcastVol < 0.1) return 1.04;
  return 1;
}
const beta = /* @__PURE__ */ new Map();
function recordBetaOutcomeT(arm, won) {
  const x = beta.get(arm) ?? { a: 1, b: 1 };
  if (won) x.a += 1;
  else x.b += 1;
  beta.set(arm, x);
}
function betaMultiplierT(arm) {
  const x = beta.get(arm);
  if (!x || x.a + x.b < 8) return 1;
  const mean2 = x.a / (x.a + x.b);
  const clipped = Math.max(0.3, Math.min(0.7, mean2));
  return 0.9 + (clipped - 0.3) * 0.5;
}
function concentrationMultiplierT(signals) {
  if (signals.length < 3) return 1;
  const abs = signals.map((s) => Math.abs(s));
  const tot = abs.reduce((a, b) => a + b, 0) || 1e-9;
  const h = abs.reduce((acc, v) => acc + (v / tot) ** 2, 0);
  if (h > 0.6) return 0.95;
  if (h < 0.25) return 1.04;
  return 1;
}
const refDist = /* @__PURE__ */ new Map();
const curDist = /* @__PURE__ */ new Map();
const DIST_CAP = 200;
function recordFeatureDistT(feature, value, ref) {
  const buf = (ref ? refDist : curDist).get(feature) ?? [];
  buf.push(value);
  if (buf.length > DIST_CAP) buf.shift();
  (ref ? refDist : curDist).set(feature, buf);
}
function ksStat(a, b) {
  const sa = [...a].sort((x, y) => x - y), sb = [...b].sort((x, y) => x - y);
  let i = 0, j = 0, d = 0;
  while (i < sa.length && j < sb.length) {
    if (sa[i] <= sb[j]) i++;
    else j++;
    d = Math.max(d, Math.abs(i / sa.length - j / sb.length));
  }
  return d;
}
function ksDriftMultiplierT(feature) {
  const a = refDist.get(feature), b = curDist.get(feature);
  if (!a || !b || a.length < 30 || b.length < 30) return 1;
  const d = ksStat(a, b);
  const crit = 1.36 * Math.sqrt((a.length + b.length) / (a.length * b.length));
  if (d > crit * 1.5) {
    return 0.9;
  }
  if (d > crit) return 0.95;
  return 1;
}
const permBuf = [];
const PERM_CAP = 300;
function recordPermSampleT(features, pnl) {
  permBuf.push({ features, pnl });
  if (permBuf.length > PERM_CAP) permBuf.shift();
}
function corr$1(xs, ys) {
  const n = xs.length;
  if (n < 5) return 0;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) {
    const ax = xs[i] - mx, ay = ys[i] - my;
    num += ax * ay;
    dx += ax * ax;
    dy += ay * ay;
  }
  const den = Math.sqrt(dx * dy);
  return den > 0 ? num / den : 0;
}
function featureImportanceT(name) {
  if (permBuf.length < 30) return 0;
  const xs = permBuf.map((s) => s.features[name] ?? 0);
  const ys = permBuf.map((s) => s.pnl);
  return Math.abs(corr$1(xs, ys));
}
function permImportanceMultiplierT(activeFeatures) {
  if (!activeFeatures.length) return 1;
  const imps = activeFeatures.map((f) => featureImportanceT(f));
  const avg = imps.reduce((a, b) => a + b, 0) / imps.length;
  return Math.max(0.95, Math.min(1.08, 0.95 + avg * 0.26));
}
const mwWeights = /* @__PURE__ */ new Map();
function recordMWOutcomeT(module, signal, pnl) {
  const w = mwWeights.get(module) ?? 1;
  const loss = Math.tanh(-signal * pnl * 10);
  const next = Math.max(0.1, Math.min(5, w * Math.exp(-0.05 * loss)));
  mwWeights.set(module, next);
}
function mwEnsembleMultiplierT(modules) {
  if (!modules.length) return 1;
  const ws = modules.map((m) => mwWeights.get(m) ?? 1);
  const avg = ws.reduce((a, b) => a + b, 0) / ws.length;
  return Math.max(0.92, Math.min(1.08, 0.92 + (avg - 0.5) * 0.16));
}
let plattA$1 = -1, plattB$1 = 0;
const plattBuf = [];
const PLATT_CAP = 500;
function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}
function recordPlattOutcomeT(score, won) {
  plattBuf.push({ score, won: won ? 1 : 0 });
  if (plattBuf.length > PLATT_CAP) plattBuf.shift();
  const z = plattA$1 * score + plattB$1;
  const p = sigmoid(z);
  const err = (won ? 1 : 0) - p;
  const lr = 0.01;
  plattA$1 += lr * err * score;
  plattB$1 += lr * err;
}
function plattCalibrateT(rawConf) {
  if (plattBuf.length < 30) return rawConf;
  const score = (rawConf - 50) / 50;
  const p = sigmoid(plattA$1 * score + plattB$1);
  return Math.max(0, Math.min(100, p * 100));
}
function snapshotTierTState() {
  return {
    hmmHist: hmmHist.slice(-200),
    hmmCounts: Array.from(hmmCounts.entries()),
    garchSigma2,
    beta: Array.from(beta.entries()),
    refDist: Array.from(refDist.entries()),
    curDist: Array.from(curDist.entries()),
    permBuf: permBuf.slice(-150),
    mwWeights: Array.from(mwWeights.entries()),
    plattA: plattA$1,
    plattB: plattB$1,
    plattBuf: plattBuf.slice(-200)
  };
}
function restoreTierTState(s) {
  const o = s;
  if (!o) return;
  if (o.hmmHist) hmmHist.push(...o.hmmHist.slice(-HMM_CAP));
  if (o.hmmCounts) for (const [k, v] of o.hmmCounts) hmmCounts.set(k, v);
  if (typeof o.garchSigma2 === "number") garchSigma2 = o.garchSigma2;
  if (o.beta) for (const [k, v] of o.beta) beta.set(k, v);
  if (o.refDist) for (const [k, v] of o.refDist) refDist.set(k, v.slice(-DIST_CAP));
  if (o.curDist) for (const [k, v] of o.curDist) curDist.set(k, v.slice(-DIST_CAP));
  if (o.permBuf) permBuf.push(...o.permBuf.slice(-PERM_CAP));
  if (o.mwWeights) for (const [k, v] of o.mwWeights) mwWeights.set(k, v);
  if (typeof o.plattA === "number") plattA$1 = o.plattA;
  if (typeof o.plattB === "number") plattB$1 = o.plattB;
  if (o.plattBuf) plattBuf.push(...o.plattBuf.slice(-PLATT_CAP));
}
const isoBuf = [];
const ISO_CAP = 600;
let isoBins = [];
function recordIsotonicOutcomeU(score, won) {
  isoBuf.push({ x: score, y: won ? 1 : 0 });
  if (isoBuf.length > ISO_CAP) isoBuf.shift();
  if (isoBuf.length % 25 === 0) refitIsotonic();
}
function refitIsotonic() {
  if (isoBuf.length < 30) return;
  const sorted = [...isoBuf].sort((a, b) => a.x - b.x);
  const bins = sorted.map((s) => ({ x: s.x, y: s.y, w: 1 }));
  let i = 0;
  while (i < bins.length - 1) {
    if (bins[i].y > bins[i + 1].y) {
      const wsum = bins[i].w + bins[i + 1].w;
      const ysum = (bins[i].y * bins[i].w + bins[i + 1].y * bins[i + 1].w) / wsum;
      const xsum = (bins[i].x * bins[i].w + bins[i + 1].x * bins[i + 1].w) / wsum;
      bins.splice(i, 2, { x: xsum, y: ysum, w: wsum });
      if (i > 0) i--;
    } else i++;
  }
  isoBins = bins.map((b) => ({ x: b.x, y: b.y }));
}
function isotonicCalibrateU(rawConf) {
  if (isoBins.length < 3) return rawConf;
  const x = rawConf;
  if (x <= isoBins[0].x) return isoBins[0].y * 100;
  if (x >= isoBins[isoBins.length - 1].x) return isoBins[isoBins.length - 1].y * 100;
  for (let i = 0; i < isoBins.length - 1; i++) {
    if (x >= isoBins[i].x && x <= isoBins[i + 1].x) {
      const t = (x - isoBins[i].x) / (isoBins[i + 1].x - isoBins[i].x || 1e-9);
      return (isoBins[i].y + t * (isoBins[i + 1].y - isoBins[i].y)) * 100;
    }
  }
  return rawConf;
}
const qResid = [];
const Q_CAP = 400;
function recordQuantileResidualU(predicted, realised) {
  qResid.push(realised - predicted);
  if (qResid.length > Q_CAP) qResid.shift();
}
function conformalQuantileU(predicted, alpha = 0.1) {
  if (qResid.length < 20) return { lower: predicted, upper: predicted };
  const sorted = [...qResid].sort((a, b) => a - b);
  const lo = sorted[Math.floor(alpha / 2 * sorted.length)];
  const hi = sorted[Math.floor((1 - alpha / 2) * sorted.length)];
  return { lower: predicted + lo, upper: predicted + hi };
}
function conformalWidthMultiplierU(predicted) {
  if (qResid.length < 20) return 1;
  const { lower, upper } = conformalQuantileU(predicted);
  const width = upper - lower;
  if (width > 0.2) return 0.92;
  if (width < 0.05) return 1.05;
  return 1;
}
let runLength = 0;
let bocpdMean = 0, bocpdM2 = 0, bocpdN = 0;
function bocpdUpdateU(value) {
  bocpdN++;
  const delta = value - bocpdMean;
  bocpdMean += delta / bocpdN;
  bocpdM2 += delta * (value - bocpdMean);
  const variance2 = bocpdN > 1 ? bocpdM2 / (bocpdN - 1) : 1e-6;
  const sd = Math.sqrt(Math.max(variance2, 1e-9));
  const z = Math.abs((value - bocpdMean) / sd);
  const changeProb = 1 - Math.exp(-z * 0.5);
  if (changeProb > 0.85) {
    runLength = 0;
    bocpdMean = value;
    bocpdM2 = 0;
    bocpdN = 1;
  } else runLength++;
  return { runLength, changeProb };
}
function bocpdMultiplierU() {
  if (bocpdN < 10) return 1;
  if (runLength < 3) return 0.88;
  if (runLength < 10) return 0.95;
  return 1;
}
const modSig = /* @__PURE__ */ new Map();
const TE_CAP = 200;
function recordModuleSignalU(name, sig) {
  const a = modSig.get(name) ?? [];
  a.push(sig);
  if (a.length > TE_CAP) a.shift();
  modSig.set(name, a);
}
function te(src, dst) {
  const n = Math.min(src.length, dst.length);
  if (n < 20) return 0;
  let hits = 0;
  for (let i = 1; i < n; i++) if (Math.sign(src[i - 1]) === Math.sign(dst[i])) hits++;
  return Math.max(0, hits / (n - 1) - 0.5) * 2;
}
function transferEntropyLeaderMultiplierU(active) {
  if (active.length < 2) return 1;
  const arrs = active.map((n) => modSig.get(n) ?? []);
  let bestLead = 0;
  for (let i = 0; i < arrs.length; i++) {
    for (let j = 0; j < arrs.length; j++) {
      if (i === j) continue;
      const t = te(arrs[i], arrs[j]);
      if (t > bestLead) bestLead = t;
    }
  }
  return 1 + Math.min(0.05, bestLead * 0.1);
}
let sgldW = [[0, 0, 0, 0]];
const SGLD_CAP = 8;
function gaussian() {
  const u = Math.random() || 1e-9, v = Math.random() || 1e-9;
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
function sgldUpdateU(features, target) {
  const f = features.slice(0, 4);
  while (f.length < 4) f.push(0);
  const lr = 0.01, sigma = 5e-3;
  const w = sgldW[sgldW.length - 1].slice();
  const pred = f.reduce((s, x, i) => s + w[i] * x, 0);
  const err = target - pred;
  for (let i = 0; i < 4; i++) w[i] += lr * err * f[i] + sigma * gaussian();
  sgldW.push(w);
  if (sgldW.length > SGLD_CAP) sgldW.shift();
}
function sgldUncertaintyMultiplierU(features) {
  if (sgldW.length < 3) return 1;
  const f = features.slice(0, 4);
  while (f.length < 4) f.push(0);
  const preds = sgldW.map((w) => f.reduce((s, x, i) => s + w[i] * x, 0));
  const m = preds.reduce((a, b) => a + b, 0) / preds.length;
  const v = preds.reduce((a, b) => a + (b - m) ** 2, 0) / preds.length;
  const sd = Math.sqrt(v);
  if (sd > 0.5) return 0.92;
  if (sd < 0.1) return 1.04;
  return 1;
}
const losses = [];
const LOSS_CAP = 500;
function recordLossU(realisedPct) {
  losses.push(realisedPct);
  if (losses.length > LOSS_CAP) losses.shift();
}
function evtTailMultiplierU() {
  if (losses.length < 50) return 1;
  const sorted = [...losses].sort((a, b) => a - b);
  const tail = sorted.slice(0, Math.max(5, Math.floor(sorted.length * 0.1)));
  const meanTail = tail.reduce((a, b) => a + b, 0) / tail.length;
  if (meanTail < -0.1) return 0.88;
  if (meanTail < -0.06) return 0.94;
  return 1;
}
const symStats = /* @__PURE__ */ new Map();
function recordSymbolTradeU(symbol, ret) {
  const s = symStats.get(symbol) ?? { vol: 0.02, trades: 0 };
  s.vol = 0.95 * s.vol + 0.05 * Math.abs(ret);
  s.trades++;
  symStats.set(symbol, s);
}
function symbolAdaptiveMultiplierU(symbol) {
  const s = symStats.get(symbol);
  if (!s || s.trades < 10) return 1;
  if (s.vol > 0.03 && s.trades > 20) return 1.02;
  return 1;
}
const oofBuf = [];
const OOF_CAP = 300;
function recordOOFSampleU(predConf, won) {
  oofBuf.push({ pred: predConf, won: won ? 1 : 0 });
  if (oofBuf.length > OOF_CAP) oofBuf.shift();
}
function oofAccuracyU() {
  if (oofBuf.length < 30) return 0.5;
  let hits = 0;
  for (const s of oofBuf) {
    const pred = s.pred >= 50 ? 1 : 0;
    if (pred === s.won) hits++;
  }
  return hits / oofBuf.length;
}
function oofRegularizerMultiplierU() {
  const acc = oofAccuracyU();
  if (oofBuf.length < 30) return 1;
  if (acc < 0.45) return 0.9;
  if (acc < 0.52) return 0.96;
  if (acc > 0.62) return 1.04;
  return 1;
}
function snapshotTierUState() {
  return {
    isoBuf: isoBuf.slice(-300),
    isoBins,
    qResid: qResid.slice(-200),
    runLength,
    bocpdMean,
    bocpdM2,
    bocpdN,
    modSig: Array.from(modSig.entries()).map(([k, v]) => [k, v.slice(-100)]),
    sgldW: sgldW.slice(-SGLD_CAP),
    losses: losses.slice(-300),
    symStats: Array.from(symStats.entries()),
    oofBuf: oofBuf.slice(-200)
  };
}
function restoreTierUState(s) {
  const o = s;
  if (!o) return;
  if (o.isoBuf) isoBuf.push(...o.isoBuf.slice(-ISO_CAP));
  if (o.isoBins) isoBins = o.isoBins;
  if (o.qResid) qResid.push(...o.qResid.slice(-Q_CAP));
  if (typeof o.runLength === "number") runLength = o.runLength;
  if (typeof o.bocpdMean === "number") bocpdMean = o.bocpdMean;
  if (typeof o.bocpdM2 === "number") bocpdM2 = o.bocpdM2;
  if (typeof o.bocpdN === "number") bocpdN = o.bocpdN;
  if (o.modSig) for (const [k, v] of o.modSig) modSig.set(k, v.slice(-TE_CAP));
  if (o.sgldW && o.sgldW.length) sgldW = o.sgldW.slice(-SGLD_CAP);
  if (o.losses) losses.push(...o.losses.slice(-LOSS_CAP));
  if (o.symStats) for (const [k, v] of o.symStats) symStats.set(k, v);
  if (o.oofBuf) oofBuf.push(...o.oofBuf.slice(-OOF_CAP));
}
const clamp$e = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const REGIMES = ["trending_up", "trending_down", "high_vol", "mean_reverting", "calm"];
const metaWeights = {};
for (const r of REGIMES) metaWeights[r] = {};
function recordTierMetaOutcomeV(regime, tierContribs, won) {
  const r = REGIMES.includes(regime) ? regime : "calm";
  const bucket2 = metaWeights[r] ?? (metaWeights[r] = {});
  const y = won ? 1 : -1;
  const lr = 0.05;
  for (const c of tierContribs) {
    const cur = bucket2[c.name] ?? { w: 0, n: 0 };
    cur.w = clamp$e(cur.w + lr * Math.tanh(c.signal) * y, -2, 2);
    cur.n += 1;
    bucket2[c.name] = cur;
  }
  const keys = Object.keys(bucket2);
  if (keys.length > 200) {
    const sorted = keys.sort((a, b) => bucket2[a].n - bucket2[b].n);
    for (let i = 0; i < keys.length - 200; i++) delete bucket2[sorted[i]];
  }
}
function tierMetaMultiplierV(regime, tierContribs) {
  const r = REGIMES.includes(regime) ? regime : "calm";
  const bucket2 = metaWeights[r] ?? {};
  let score = 0, n = 0;
  for (const c of tierContribs.slice(0, 10)) {
    const w = bucket2[c.name]?.w ?? 0;
    if (Math.abs(w) > 0.05 && (bucket2[c.name]?.n ?? 0) >= 5) {
      score += w * Math.tanh(c.signal);
      n++;
    }
  }
  if (n === 0) return 1;
  const avg = score / n;
  return clamp$e(1 + avg * 0.08, 0.88, 1.12);
}
const causalBuckets = {};
function recordCausalSampleW(features, realisedPct) {
  for (const [k, v] of Object.entries(features)) {
    if (!Number.isFinite(v)) continue;
    const b = causalBuckets[k] ?? (causalBuckets[k] = {
      high: { sumOutcome: 0, n: 0 },
      low: { sumOutcome: 0, n: 0 }
    });
    const slot = v > 0 ? b.high : b.low;
    slot.sumOutcome += realisedPct;
    slot.n += 1;
  }
  const keys = Object.keys(causalBuckets);
  if (keys.length > 100) {
    const trim = keys.slice(0, keys.length - 100);
    for (const k of trim) delete causalBuckets[k];
  }
}
function causalLiftMultiplierW(features) {
  let lift = 0, n = 0;
  for (const [k, v] of Object.entries(features)) {
    const b = causalBuckets[k];
    if (!b || b.high.n < 5 || b.low.n < 5) continue;
    const ate = b.high.sumOutcome / b.high.n - b.low.sumOutcome / b.low.n;
    if (!Number.isFinite(ate)) continue;
    lift += Math.tanh(ate * 0.5) * (v > 0 ? 1 : -1);
    n++;
  }
  if (n === 0) return 1;
  return clamp$e(1 + lift / n * 0.05, 0.92, 1.08);
}
function adversarialRobustnessMultiplierX(baseScore, signals, epsilon = 0.05) {
  if (signals.length === 0) return 1;
  let maxDelta = 0;
  let totalW = 0;
  for (const s of signals) totalW += Math.abs(s.weight ?? 1);
  if (totalW === 0) return 1;
  for (const s of signals) {
    const w = (s.weight ?? 1) / totalW;
    const delta = Math.abs(w * epsilon * 100);
    if (delta > maxDelta) maxDelta = delta;
  }
  const ratio = baseScore > 0 ? maxDelta / baseScore : 1;
  if (ratio < 0.02) return 1.05;
  if (ratio < 0.05) return 1.02;
  if (ratio > 0.15) return 0.88;
  if (ratio > 0.1) return 0.94;
  return 1;
}
const difficultyBuf = [];
function recordCurriculumSampleY(predictedConfidence, realisedPct, marketVol) {
  const difficulty = clamp$e(
    marketVol * 2 - Math.abs(realisedPct) * 0.1,
    0,
    1
  );
  const correct = predictedConfidence > 60 && realisedPct > 0 || predictedConfidence < 40 && realisedPct < 0;
  difficultyBuf.push({ difficulty, correct });
  if (difficultyBuf.length > 1e3) difficultyBuf.splice(0, difficultyBuf.length - 500);
}
function curriculumMultiplierY(currentVol) {
  if (difficultyBuf.length < 30) return 1;
  const hardSamples = difficultyBuf.filter((s) => s.difficulty > 0.5);
  if (hardSamples.length < 10) return 1;
  const hardAcc = hardSamples.filter((s) => s.correct).length / hardSamples.length;
  if (currentVol > 0.03 && hardAcc < 0.45) return 0.9;
  if (currentVol > 0.03 && hardAcc > 0.6) return 1.05;
  return 1;
}
const winnerPatterns = [];
function recordWinnerPatternZ(features, realisedPct) {
  if (realisedPct < 5) return;
  winnerPatterns.push({ features: { ...features }, realised: realisedPct });
  if (winnerPatterns.length > 200) winnerPatterns.splice(0, winnerPatterns.length - 150);
}
function imitationMultiplierZ(features) {
  if (winnerPatterns.length < 5) return 1;
  const keys = Object.keys(features);
  if (keys.length === 0) return 1;
  let bestSim = 0;
  for (const w of winnerPatterns) {
    let dot2 = 0, na = 0, nb = 0;
    for (const k of keys) {
      const a = features[k] ?? 0;
      const b = w.features[k] ?? 0;
      dot2 += a * b;
      na += a * a;
      nb += b * b;
    }
    const sim = na && nb ? dot2 / Math.sqrt(na * nb) : 0;
    if (sim > bestSim) bestSim = sim;
  }
  if (bestSim > 0.85) return 1.08;
  if (bestSim > 0.7) return 1.04;
  return 1;
}
const sectorStats = {};
const symbolStats = {};
let globalSum = 0, globalN = 0;
function recordHierarchicalOutcomeAA(symbol, sector, realisedPct) {
  const sec = sectorStats[sector] ?? (sectorStats[sector] = { sum: 0, n: 0 });
  sec.sum += realisedPct;
  sec.n += 1;
  const sym = symbolStats[symbol] ?? (symbolStats[symbol] = { sum: 0, n: 0, sector });
  sym.sum += realisedPct;
  sym.n += 1;
  sym.sector = sector;
  globalSum += realisedPct;
  globalN += 1;
}
function hierarchicalShrinkageMultiplierAA(symbol, sector) {
  const sym = symbolStats[symbol];
  const sec = sectorStats[sector];
  if (globalN < 10) return 1;
  const globalMean = globalSum / globalN;
  const secMean = sec && sec.n >= 3 ? sec.sum / sec.n : globalMean;
  const symMean = sym && sym.n >= 2 ? sym.sum / sym.n : secMean;
  const symW = sym ? sym.n / (sym.n + 5) : 0;
  const secW = sec ? sec.n / (sec.n + 10) : 0;
  const shrunk = symW * symMean + (1 - symW) * (secW * secMean + (1 - secW) * globalMean);
  return clamp$e(1 + Math.tanh(shrunk * 0.1) * 0.05, 0.93, 1.07);
}
const returnHistoryBB = [];
function recordReturnBB(realisedPct) {
  returnHistoryBB.push(realisedPct);
  if (returnHistoryBB.length > 500) returnHistoryBB.splice(0, returnHistoryBB.length - 300);
}
function sortinoMultiplierBB() {
  if (returnHistoryBB.length < 20) return 1;
  const mean2 = returnHistoryBB.reduce((a, b) => a + b, 0) / returnHistoryBB.length;
  const downside = returnHistoryBB.filter((r) => r < 0);
  if (downside.length < 3) return 1.05;
  const dvar = downside.reduce((a, b) => a + b * b, 0) / downside.length;
  const dstd = Math.sqrt(dvar);
  if (dstd < 1e-6) return 1;
  const sortino2 = mean2 / dstd;
  if (sortino2 > 0.5) return 1.06;
  if (sortino2 > 0.2) return 1.02;
  if (sortino2 < -0.3) return 0.9;
  if (sortino2 < 0) return 0.96;
  return 1;
}
const paretoBuf = [];
function recordParetoPointCC(point) {
  paretoBuf.push(point);
  if (paretoBuf.length > 500) paretoBuf.splice(0, paretoBuf.length - 300);
}
function paretoMultiplierCC(currentRisk, currentFreq) {
  if (paretoBuf.length < 20) return 1;
  const riskScore = 1 - clamp$e(currentRisk, 0, 1);
  const freqScore = 1 - Math.abs(currentFreq - 0.3) * 2;
  const blended = (riskScore + freqScore) / 2;
  return clamp$e(0.94 + blended * 0.12, 0.94, 1.06);
}
function explainabilityMultiplierDD(contributions) {
  if (contributions.length === 0) return 1;
  const abs = contributions.map((c) => Math.abs(c.contribution));
  const total = abs.reduce((a, b) => a + b, 0);
  if (total < 1e-9) return 1;
  const shares = abs.map((a) => a / total).sort((a, b) => b - a);
  const top1 = shares[0];
  const top3 = shares.slice(0, 3).reduce((a, b) => a + b, 0);
  if (top1 > 0.7) return 0.9;
  if (top1 > 0.5) return 0.95;
  if (top3 < 0.6 && shares.length >= 5) return 1.05;
  return 1;
}
function snapshotTierVWXState() {
  return {
    metaWeights,
    causalBuckets,
    difficultyBuf: difficultyBuf.slice(-300),
    winnerPatterns: winnerPatterns.slice(-100),
    sectorStats,
    symbolStats,
    globalSum,
    globalN,
    returnHistoryBB: returnHistoryBB.slice(-200),
    paretoBuf: paretoBuf.slice(-200)
  };
}
function restoreTierVWXState(s) {
  try {
    const d = s;
    if (d.metaWeights) for (const r of REGIMES) Object.assign(metaWeights[r], d.metaWeights[r] ?? {});
    if (d.causalBuckets) Object.assign(causalBuckets, d.causalBuckets);
    if (Array.isArray(d.difficultyBuf)) {
      difficultyBuf.length = 0;
      difficultyBuf.push(...d.difficultyBuf);
    }
    if (Array.isArray(d.winnerPatterns)) {
      winnerPatterns.length = 0;
      winnerPatterns.push(...d.winnerPatterns);
    }
    if (d.sectorStats) Object.assign(sectorStats, d.sectorStats);
    if (d.symbolStats) Object.assign(symbolStats, d.symbolStats);
    if (typeof d.globalSum === "number") globalSum = d.globalSum;
    if (typeof d.globalN === "number") globalN = d.globalN;
    if (Array.isArray(d.returnHistoryBB)) {
      returnHistoryBB.length = 0;
      returnHistoryBB.push(...d.returnHistoryBB);
    }
    if (Array.isArray(d.paretoBuf)) {
      paretoBuf.length = 0;
      paretoBuf.push(...d.paretoBuf);
    }
  } catch {
  }
}
const clamp$d = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const errBuf = [];
let phSum = 0, phMin = 0, phDriftFlag = false;
function recordPredictionErrorEE(predConfidence, realisedPct) {
  const predDir = clamp$d((predConfidence - 50) / 50, -1, 1);
  const realDir = clamp$d(realisedPct / 5, -1, 1);
  const err = Math.abs(predDir - realDir);
  errBuf.push(err);
  if (errBuf.length > 300) errBuf.splice(0, errBuf.length - 200);
  const mean2 = errBuf.reduce((a, b) => a + b, 0) / errBuf.length;
  phSum += err - mean2 - 5e-3;
  if (phSum < phMin) phMin = phSum;
  phDriftFlag = phSum - phMin > 0.5;
}
function driftMultiplierEE() {
  if (errBuf.length < 30) return 1;
  if (phDriftFlag) {
    phSum = 0;
    phMin = 0;
    phDriftFlag = false;
    return 0.88;
  }
  const recent = errBuf.slice(-30);
  const older = errBuf.slice(-90, -30);
  if (older.length < 30) return 1;
  const rMean = recent.reduce((a, b) => a + b, 0) / recent.length;
  const oMean = older.reduce((a, b) => a + b, 0) / older.length;
  const delta = rMean - oMean;
  if (delta > 0.15) return 0.92;
  if (delta < -0.1) return 1.04;
  return 1;
}
function ensembleDisagreementMultiplierFF(signals) {
  if (signals.length < 3) return 1;
  const vals = signals.map((s) => clamp$d(s.value, -2, 2));
  const mean2 = vals.reduce((a, b) => a + b, 0) / vals.length;
  const variance2 = vals.reduce((a, b) => a + (b - mean2) ** 2, 0) / vals.length;
  const std2 = Math.sqrt(variance2);
  if (std2 < 0.25) return 1.06;
  if (std2 < 0.45) return 1.02;
  if (std2 > 0.9) return 0.9;
  if (std2 > 0.7) return 0.95;
  return 1;
}
const featStats = {};
function recordFeatureOutcomeGG(features, realisedPct) {
  for (const [k, v] of Object.entries(features)) {
    if (!Number.isFinite(v)) continue;
    const product = Math.tanh(v) * Math.tanh(realisedPct / 5);
    const f = featStats[k] ?? (featStats[k] = { recent: [], older: [] });
    f.recent.push(product);
    if (f.recent.length > 30) {
      f.older.push(...f.recent.splice(0, f.recent.length - 30));
      if (f.older.length > 90) f.older.splice(0, f.older.length - 90);
    }
  }
  const keys = Object.keys(featStats);
  if (keys.length > 150) {
    for (const k of keys.slice(0, keys.length - 150)) delete featStats[k];
  }
}
function featureDecayMultiplierGG(features) {
  if (Object.keys(featStats).length < 5) return 1;
  let alive = 0, dead = 0;
  for (const k of Object.keys(features)) {
    const f = featStats[k];
    if (!f || f.recent.length < 10 || f.older.length < 30) continue;
    const rMean = f.recent.reduce((a, b) => a + b, 0) / f.recent.length;
    const oMean = f.older.reduce((a, b) => a + b, 0) / f.older.length;
    if (Math.abs(oMean) < 0.05) continue;
    const decay = (Math.abs(rMean) - Math.abs(oMean)) / Math.abs(oMean);
    if (decay < -0.5) dead++;
    else alive++;
  }
  if (alive + dead < 3) return 1;
  const aliveRatio = alive / (alive + dead);
  if (aliveRatio < 0.3) return 0.9;
  if (aliveRatio > 0.7) return 1.04;
  return 1;
}
const replayBuf = [];
function recordReplayHH(predConfidence, realisedPct) {
  replayBuf.push({ conf: predConfidence, realised: realisedPct });
  if (replayBuf.length > 500) replayBuf.splice(0, replayBuf.length - 300);
}
function counterfactualMultiplierHH(currentConfidence) {
  if (replayBuf.length < 40) return 1;
  const near = replayBuf.filter((r) => Math.abs(r.conf - currentConfidence) <= 10);
  if (near.length < 8) return 1;
  const avg = near.reduce((a, b) => a + b.realised, 0) / near.length;
  const global = replayBuf.reduce((a, b) => a + b.realised, 0) / replayBuf.length;
  const lift = avg - global;
  if (lift > 1) return 1.05;
  if (lift > 0.3) return 1.02;
  if (lift < -1) return 0.92;
  if (lift < -0.3) return 0.97;
  return 1;
}
function multiTimeframeConfluenceMultiplierII(signals) {
  if (signals.length < 3) return 1;
  const shortKeys = /rsi|stoch|macd|momentum|short/i;
  const longKeys = /ma200|sma|trend|long|hurst/i;
  let sShort = 0, nShort = 0, sLong = 0, nLong = 0;
  for (const s of signals) {
    if (shortKeys.test(s.name)) {
      sShort += s.value;
      nShort++;
    } else if (longKeys.test(s.name)) {
      sLong += s.value;
      nLong++;
    }
  }
  if (nShort < 1 || nLong < 1) return 1;
  const mShort = sShort / nShort, mLong = sLong / nLong;
  const sameDir = Math.sign(mShort) === Math.sign(mLong) && Math.sign(mShort) !== 0;
  if (sameDir && Math.abs(mShort) > 0.3 && Math.abs(mLong) > 0.3) return 1.06;
  if (sameDir) return 1.02;
  if (Math.sign(mShort) !== Math.sign(mLong) && Math.abs(mShort - mLong) > 0.8) return 0.9;
  return 1;
}
function microstructureMultiplierJJ(atr14, close, volume, avgVolume) {
  if (!close || !atr14 || !avgVolume) return 1;
  const atrRatio = atr14 / close;
  const volRatio = volume / avgVolume;
  if (atrRatio < 0.04 && volRatio > 1.3) return 1.05;
  if (atrRatio < 0.04 && volRatio > 1) return 1.02;
  if (atrRatio > 0.08 && volRatio < 0.7) return 0.88;
  if (atrRatio > 0.06 && volRatio < 0.8) return 0.94;
  return 1;
}
const regimeStats = {};
function recordRegimeOutcomeKK(regime, won) {
  const s = regimeStats[regime] ?? (regimeStats[regime] = { won: 0, lost: 0 });
  if (won) s.won++;
  else s.lost++;
}
function selfDiagnosticMultiplierKK(regime) {
  const s = regimeStats[regime];
  if (!s || s.won + s.lost < 20) return 1;
  const winRate = s.won / (s.won + s.lost);
  if (winRate < 0.35) return 0.88;
  if (winRate < 0.45) return 0.95;
  if (winRate > 0.65) return 1.06;
  if (winRate > 0.55) return 1.02;
  return 1;
}
const trustGrid = [
  { scale: 0.9, sumPnl: 0, n: 0 },
  { scale: 1, sumPnl: 0, n: 0 },
  { scale: 1.1, sumPnl: 0, n: 0 }
];
let trustIdx = 1;
function recordHyperparamOutcomeLL(realisedPct) {
  const cell = trustGrid[trustIdx];
  cell.sumPnl += realisedPct;
  cell.n += 1;
  const total = trustGrid.reduce((a, b) => a + b.n, 0);
  if (total % 10 === 0) {
    if (Math.random() < 0.1) {
      trustIdx = Math.floor(Math.random() * trustGrid.length);
    } else {
      let best = 0, bestAvg = -Infinity;
      for (let i = 0; i < trustGrid.length; i++) {
        const c = trustGrid[i];
        const avg = c.n >= 5 ? c.sumPnl / c.n : 0;
        if (avg > bestAvg) {
          bestAvg = avg;
          best = i;
        }
      }
      trustIdx = best;
    }
  }
}
function hyperparamMultiplierLL() {
  const cell = trustGrid[trustIdx];
  if (cell.n < 5) return 1;
  return cell.scale;
}
function snapshotTierEELMState() {
  return {
    errBuf: errBuf.slice(-200),
    phSum,
    phMin,
    phDriftFlag,
    featStats,
    replayBuf: replayBuf.slice(-300),
    regimeStats,
    trustGrid,
    trustIdx
  };
}
function restoreTierEELMState(s) {
  try {
    const d = s;
    if (Array.isArray(d.errBuf)) {
      errBuf.length = 0;
      errBuf.push(...d.errBuf);
    }
    if (typeof d.phSum === "number") phSum = d.phSum;
    if (typeof d.phMin === "number") phMin = d.phMin;
    if (typeof d.phDriftFlag === "boolean") phDriftFlag = d.phDriftFlag;
    if (d.featStats) Object.assign(featStats, d.featStats);
    if (Array.isArray(d.replayBuf)) {
      replayBuf.length = 0;
      replayBuf.push(...d.replayBuf);
    }
    if (d.regimeStats) Object.assign(regimeStats, d.regimeStats);
    if (Array.isArray(d.trustGrid) && d.trustGrid.length === trustGrid.length) {
      for (let i = 0; i < trustGrid.length; i++) Object.assign(trustGrid[i], d.trustGrid[i]);
    }
    if (typeof d.trustIdx === "number") trustIdx = d.trustIdx;
  } catch {
  }
}
const clamp$c = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const decisions = [];
function recordDecisionMM(regime, conf, won, realised) {
  decisions.push({ regime, conf, won, realised });
  if (decisions.length > 200) decisions.splice(0, decisions.length - 200);
}
function selfDiagnosticAgentMultiplierMM(regime, conf) {
  if (decisions.length < 30) return 1;
  const bucket2 = decisions.filter(
    (d) => d.regime === regime && Math.abs(d.conf - conf) <= 12
  );
  if (bucket2.length < 8) return 1;
  const wr = bucket2.filter((d) => d.won).length / bucket2.length;
  const avgPnl = bucket2.reduce((a, b) => a + b.realised, 0) / bucket2.length;
  if (conf > 65 && wr < 0.4) return 0.85;
  if (conf > 60 && wr < 0.45 && avgPnl < 0) return 0.92;
  if (wr > 0.65 && avgPnl > 0.5) return 1.05;
  return 1;
}
const regimeTrans = {};
let lastRegime = null;
function recordRegimeTransitionOO(regime) {
  if (lastRegime && lastRegime !== regime) {
    const row = regimeTrans[lastRegime] ?? (regimeTrans[lastRegime] = {});
    row[regime] = (row[regime] ?? 0) + 1;
  }
  lastRegime = regime;
}
function regimeSwitchingMultiplierOO(regime) {
  const row = regimeTrans[regime];
  if (!row) return 1;
  const total = Object.values(row).reduce((a, b) => a + b, 0);
  if (total < 10) return 1;
  const stay = (row[regime] ?? 0) / total;
  if (stay < 0.3) return 0.9;
  if (stay < 0.5) return 0.96;
  if (stay > 0.8) return 1.04;
  return 1;
}
const sentSeries = {};
function sentimentVelocityMultiplierPP(symbol) {
  const s = sentSeries[symbol];
  if (!s || s.length < 4) return 1;
  const recent = s.slice(-3).reduce((a, b) => a + b, 0) / 3;
  const older = s.slice(-6, -3).reduce((a, b) => a + b, 0) / Math.max(1, s.slice(-6, -3).length);
  const velocity = recent - older;
  if (velocity > 0.3) return 1.06;
  if (velocity > 0.1) return 1.02;
  if (velocity < -0.3) return 0.9;
  if (velocity < -0.1) return 0.96;
  return 1;
}
function orderBookReplayMultiplierQQ(close, atr14, volume, avgVolume) {
  if (!close || !atr14 || !avgVolume) return 1;
  const atrRatio = atr14 / close;
  const volRatio = volume / avgVolume;
  if (atrRatio > 0.05 && volRatio > 2) return 1.05;
  if (atrRatio > 0.05 && volRatio < 0.6) return 0.86;
  if (atrRatio > 0.03 && volRatio < 0.7) return 0.94;
  return 1;
}
const featStream = [];
function recordFeatureVectorRR(vec) {
  if (!vec.length) return;
  featStream.push(vec.slice());
  if (featStream.length > 300) featStream.splice(0, featStream.length - 300);
}
function anomalyAutoQuarantineMultiplierRR(vec) {
  if (featStream.length < 50 || !vec.length) return 1;
  const dim = Math.min(vec.length, featStream[0].length);
  const means = new Array(dim).fill(0);
  const vars = new Array(dim).fill(0);
  for (const v of featStream) for (let i = 0; i < dim; i++) means[i] += v[i] ?? 0;
  for (let i = 0; i < dim; i++) means[i] /= featStream.length;
  for (const v of featStream) for (let i = 0; i < dim; i++) {
    const d = (v[i] ?? 0) - means[i];
    vars[i] += d * d;
  }
  for (let i = 0; i < dim; i++) vars[i] = Math.max(1e-6, vars[i] / featStream.length);
  let dist2 = 0;
  for (let i = 0; i < dim; i++) {
    const d = (vec[i] ?? 0) - means[i];
    dist2 += d * d / vars[i];
  }
  dist2 = Math.sqrt(dist2 / dim);
  if (dist2 > 4) return 0.6;
  if (dist2 > 3) return 0.8;
  if (dist2 > 2.2) return 0.92;
  return 1;
}
const weightArms = [
  { scale: 0.85, sumPnl: 0, n: 0 },
  { scale: 0.95, sumPnl: 0, n: 0 },
  { scale: 1, sumPnl: 0, n: 0 },
  { scale: 1.05, sumPnl: 0, n: 0 },
  { scale: 1.15, sumPnl: 0, n: 0 }
];
let armIdx = 2;
function recordRLWeightsOutcomeSS(realisedPct) {
  const a = weightArms[armIdx];
  a.sumPnl += realisedPct;
  a.n += 1;
  const total = weightArms.reduce((s, x) => s + x.n, 0);
  if (total % 8 === 0) {
    if (Math.random() < 0.12) {
      armIdx = Math.floor(Math.random() * weightArms.length);
    } else {
      let best = armIdx, bestAvg = -Infinity;
      for (let i = 0; i < weightArms.length; i++) {
        const c = weightArms[i];
        if (c.n < 4) continue;
        const avg = c.sumPnl / c.n;
        if (avg > bestAvg) {
          bestAvg = avg;
          best = i;
        }
      }
      armIdx = best;
    }
  }
}
function rlOverWeightsMultiplierSS() {
  const a = weightArms[armIdx];
  if (a.n < 4) return 1;
  return a.scale;
}
const strats = [
  { name: "conservative", bias: 0.85, returns: [] },
  { name: "balanced", bias: 1, returns: [] },
  { name: "aggressive", bias: 1.18, returns: [] }
];
function sortino(rs) {
  if (rs.length < 5) return 0;
  const mean2 = rs.reduce((a, b) => a + b, 0) / rs.length;
  const downside = rs.filter((r) => r < 0);
  if (!downside.length) return mean2 * 10;
  const dd = Math.sqrt(downside.reduce((a, b) => a + b * b, 0) / downside.length);
  return dd > 1e-6 ? mean2 / dd : 0;
}
function recordBacktestOutcomeTT(currentConf, realisedPct) {
  for (const s of strats) {
    const taken = (currentConf - 50) / 50 * s.bias;
    s.returns.push(realisedPct * Math.tanh(taken));
    if (s.returns.length > 60) s.returns.splice(0, s.returns.length - 60);
  }
}
function backtestingInProductionMultiplierTT() {
  const scores2 = strats.map((s) => ({ s, score: sortino(s.returns) }));
  scores2.sort((a, b) => b.score - a.score);
  const best = scores2[0];
  if (!best || best.s.returns.length < 8) return 1;
  const target = best.s.bias;
  return clamp$c(0.85 + (target - 0.85) * 0.6, 0.85, 1.15);
}
function snapshotTierMMTTState() {
  return {
    decisions: decisions.slice(-200),
    regimeTrans,
    lastRegime,
    sentSeries,
    featStream: featStream.slice(-300),
    weightArms,
    armIdx,
    strats
  };
}
function restoreTierMMTTState(s) {
  try {
    const d = s;
    if (Array.isArray(d.decisions)) {
      decisions.length = 0;
      decisions.push(...d.decisions);
    }
    if (d.regimeTrans) Object.assign(regimeTrans, d.regimeTrans);
    if (typeof d.lastRegime === "string" || d.lastRegime === null) lastRegime = d.lastRegime ?? null;
    if (d.sentSeries) Object.assign(sentSeries, d.sentSeries);
    if (Array.isArray(d.featStream)) {
      featStream.length = 0;
      featStream.push(...d.featStream);
    }
    if (Array.isArray(d.weightArms) && d.weightArms.length === weightArms.length) {
      for (let i = 0; i < weightArms.length; i++) Object.assign(weightArms[i], d.weightArms[i]);
    }
    if (typeof d.armIdx === "number") armIdx = d.armIdx;
    if (Array.isArray(d.strats) && d.strats.length === strats.length) {
      for (let i = 0; i < strats.length; i++) {
        strats[i].returns = (d.strats[i].returns ?? []).slice(-60);
      }
    }
  } catch {
  }
}
const clamp$b = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
let llmVote = null;
const LLM_TTL_MS = 60 * 60 * 1e3;
function llmMetaAnalystMultiplierUU(currentRegime, dir) {
  if (!llmVote) return 1;
  if (Date.now() - llmVote.updatedAt > LLM_TTL_MS) return 1;
  if (llmVote.regime !== currentRegime) return 1;
  const align = Math.sign(dir) === Math.sign(llmVote.bias) && Math.sign(dir) !== 0;
  if (align && Math.abs(llmVote.bias) > 0.5) return 1.06;
  if (align) return 1.02;
  if (!align && Math.abs(llmVote.bias) > 0.5) return 0.9;
  return 1;
}
const tierIC = {};
function recordTierICVV(tierName, tierSignal, realisedPct) {
  if (!Number.isFinite(tierSignal)) return;
  const product = Math.tanh(tierSignal) * Math.tanh(realisedPct / 5);
  const s = tierIC[tierName] ?? (tierIC[tierName] = { recent: [], older: [] });
  s.recent.push(product);
  if (s.recent.length > 30) {
    s.older.push(...s.recent.splice(0, s.recent.length - 30));
    if (s.older.length > 90) s.older.splice(0, s.older.length - 90);
  }
}
function walkForwardICMultiplierVV() {
  const keys = Object.keys(tierIC);
  if (keys.length < 5) return 1;
  let healthy = 0, dead = 0;
  for (const k of keys) {
    const s = tierIC[k];
    if (s.recent.length < 10) continue;
    const r = s.recent.reduce((a, b) => a + b, 0) / s.recent.length;
    if (r > 0.05) healthy++;
    else if (r < -0.02) dead++;
  }
  if (healthy + dead < 5) return 1;
  const ratio = healthy / (healthy + dead);
  if (ratio > 0.7) return 1.05;
  if (ratio > 0.55) return 1.02;
  if (ratio < 0.3) return 0.9;
  if (ratio < 0.45) return 0.96;
  return 1;
}
const retSeries = {};
const marketSeries = [];
function recordReturnsWW(symbol, symRet2, marketRet) {
  if (!Number.isFinite(symRet2) || !Number.isFinite(marketRet)) return;
  const s = retSeries[symbol] ?? (retSeries[symbol] = []);
  s.push(symRet2);
  if (s.length > 60) s.splice(0, s.length - 60);
  marketSeries.push(marketRet);
  if (marketSeries.length > 60) marketSeries.splice(0, marketSeries.length - 60);
}
function pearson$2(a, b) {
  const n = Math.min(a.length, b.length);
  if (n < 8) return 0;
  const ma = a.slice(-n).reduce((x, y) => x + y, 0) / n;
  const mb = b.slice(-n).reduce((x, y) => x + y, 0) / n;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) {
    const x = a[a.length - n + i] - ma;
    const y = b[b.length - n + i] - mb;
    num += x * y;
    da += x * x;
    db += y * y;
  }
  const denom = Math.sqrt(da * db);
  return denom > 1e-9 ? num / denom : 0;
}
function crossAssetCorrelationMultiplierWW(symbol) {
  const s = retSeries[symbol];
  if (!s || s.length < 12 || marketSeries.length < 12) return 1;
  const corr2 = pearson$2(s, marketSeries);
  if (Math.abs(corr2) < 0.2) return 1.04;
  if (corr2 > 0.8) return 1.02;
  if (corr2 < -0.6) return 1.03;
  return 1;
}
const upMoves = {};
const downMoves = {};
function recordRangeXX(symbol, dailyRangePct, dir) {
  if (!Number.isFinite(dailyRangePct)) return;
  const arr = dir >= 0 ? upMoves[symbol] ?? (upMoves[symbol] = []) : downMoves[symbol] ?? (downMoves[symbol] = []);
  arr.push(Math.abs(dailyRangePct));
  if (arr.length > 30) arr.splice(0, arr.length - 30);
}
function optionsFlowMultiplierXX(symbol) {
  const u = upMoves[symbol], d = downMoves[symbol];
  if (!u || !d || u.length < 6 || d.length < 6) return 1;
  const mu = u.reduce((a, b) => a + b, 0) / u.length;
  const md = d.reduce((a, b) => a + b, 0) / d.length;
  if (mu < 1e-6 || md < 1e-6) return 1;
  const skew = mu / md;
  if (skew > 1.4) return 1.05;
  if (skew > 1.15) return 1.02;
  if (skew < 0.7) return 0.9;
  if (skew < 0.85) return 0.96;
  return 1;
}
const clusterSent = {};
function recordClusterSentimentYY(clusterKey, sent) {
  if (!clusterKey || !Number.isFinite(sent)) return;
  const s = clusterSent[clusterKey] ?? (clusterSent[clusterKey] = []);
  s.push(sent);
  if (s.length > 40) s.splice(0, s.length - 40);
}
function narrativeClusteringMultiplierYY(clusterKey) {
  const s = clusterSent[clusterKey];
  if (!s || s.length < 8) return 1;
  const recent = s.slice(-5).reduce((a, b) => a + b, 0) / 5;
  const older = s.slice(-15, -5);
  if (older.length < 5) return 1;
  const om = older.reduce((a, b) => a + b, 0) / older.length;
  const momentum = recent - om;
  if (momentum > 0.25 && recent > 0.2) return 1.06;
  if (momentum > 0.1) return 1.02;
  if (momentum < -0.25 && recent < -0.2) return 0.9;
  if (momentum < -0.1) return 0.96;
  return 1;
}
const execGap = [];
function recordExecutionGapZZ(realised, expected) {
  if (!Number.isFinite(realised) || !Number.isFinite(expected)) return;
  execGap.push(realised - expected);
  if (execGap.length > 80) execGap.splice(0, execGap.length - 80);
}
function executionQualityMultiplierZZ() {
  if (execGap.length < 15) return 1;
  const mean2 = execGap.reduce((a, b) => a + b, 0) / execGap.length;
  if (mean2 < -1.5) return 0.85;
  if (mean2 < -0.5) return 0.93;
  if (mean2 > 0.5) return 1.04;
  return 1;
}
const tierWeights = {};
let intercept = 0;
const LR = 0.02;
const L2 = 1e-3;
function trainStackingAAA(signals, realisedPct) {
  const target = Math.tanh(realisedPct / 5);
  let pred = intercept;
  for (const s of signals) {
    const w = tierWeights[s.name] ?? 0;
    pred += w * s.value;
  }
  const err = pred - target;
  intercept -= LR * err;
  for (const s of signals) {
    const w = tierWeights[s.name] ?? 0;
    const grad = err * s.value + L2 * w;
    tierWeights[s.name] = clamp$b(w - LR * grad, -1.5, 1.5);
  }
}
function metaLearnerStackingMultiplierAAA(signals) {
  if (Object.keys(tierWeights).length < 8) return 1;
  let pred = intercept;
  for (const s of signals) {
    const w = tierWeights[s.name];
    if (typeof w === "number") pred += w * s.value;
  }
  const m = 1 + clamp$b(pred, -0.5, 0.5) * 0.16;
  return clamp$b(m, 0.88, 1.08);
}
const humanStats = {};
function humanFeedbackMultiplierBBB(symbol) {
  const s = humanStats[symbol];
  if (!s || s.up + s.down < 3) return 1;
  const ratio = s.up / (s.up + s.down);
  if (ratio > 0.75) return 1.05;
  if (ratio > 0.6) return 1.02;
  if (ratio < 0.25) return 0.9;
  if (ratio < 0.4) return 0.96;
  return 1;
}
function snapshotTierUUBBBState() {
  return {
    llmVote,
    tierIC,
    retSeries,
    marketSeries: marketSeries.slice(-60),
    upMoves,
    downMoves,
    clusterSent,
    execGap: execGap.slice(-80),
    tierWeights,
    intercept,
    humanStats
  };
}
function restoreTierUUBBBState(s) {
  try {
    const d = s;
    if (d.llmVote !== void 0) llmVote = d.llmVote;
    if (d.tierIC) Object.assign(tierIC, d.tierIC);
    if (d.retSeries) Object.assign(retSeries, d.retSeries);
    if (Array.isArray(d.marketSeries)) {
      marketSeries.length = 0;
      marketSeries.push(...d.marketSeries);
    }
    if (d.upMoves) Object.assign(upMoves, d.upMoves);
    if (d.downMoves) Object.assign(downMoves, d.downMoves);
    if (d.clusterSent) Object.assign(clusterSent, d.clusterSent);
    if (Array.isArray(d.execGap)) {
      execGap.length = 0;
      execGap.push(...d.execGap);
    }
    if (d.tierWeights) Object.assign(tierWeights, d.tierWeights);
    if (typeof d.intercept === "number") intercept = d.intercept;
    if (d.humanStats) Object.assign(humanStats, d.humanStats);
  } catch {
  }
}
const clamp$a = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const mean$c = (a) => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
const variance$9 = (a) => {
  if (a.length < 2) return 0;
  const m = mean$c(a);
  return a.reduce((s, v) => s + (v - m) * (v - m), 0) / (a.length - 1);
};
const bmaTable = {};
function recordTierOutcomeCCC(regime, tierName, tierSignal, realisedPct) {
  if (!Number.isFinite(tierSignal) || !Number.isFinite(realisedPct)) return;
  const correct = Math.sign(tierSignal) === Math.sign(realisedPct) && Math.sign(tierSignal) !== 0;
  const key = `${regime}::${tierName}`;
  const p = bmaTable[key] ?? (bmaTable[key] = { a: 1, b: 1 });
  if (correct) p.a += 1;
  else p.b += 1;
}
function bayesianModelAveragingMultiplierCCC(regime, signals) {
  if (signals.length === 0) return 1;
  let weighted = 0, totalW = 0;
  for (const s of signals) {
    const p = bmaTable[`${regime}::${s.name}`];
    if (!p) continue;
    const w = p.a / (p.a + p.b);
    weighted += w * s.value;
    totalW += w;
  }
  if (totalW < 0.5) return 1;
  const blend = weighted / totalW;
  return clamp$a(1 + clamp$a(blend, -0.6, 0.6) * 0.12, 0.9, 1.08);
}
const conformalResiduals$2 = [];
function recordConformalSampleDDD(confidence, realisedPct) {
  if (!Number.isFinite(confidence) || !Number.isFinite(realisedPct)) return;
  const expected = (confidence - 50) / 50 * 3;
  conformalResiduals$2.push(Math.abs(realisedPct - expected));
  if (conformalResiduals$2.length > 500) conformalResiduals$2.splice(0, conformalResiduals$2.length - 500);
}
function getConformalIntervalDDD(confidence, alpha = 0.1) {
  const expected = (confidence - 50) / 50 * 3;
  if (conformalResiduals$2.length < 20) return { lower: expected - 3, upper: expected + 3, halfWidth: 3 };
  const sorted = [...conformalResiduals$2].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor((1 - alpha) * sorted.length));
  const q = sorted[idx];
  return { lower: expected - q, upper: expected + q, halfWidth: q };
}
function conformalMultiplierDDD(confidence) {
  const { halfWidth } = getConformalIntervalDDD(confidence);
  if (halfWidth < 1) return 1.05;
  if (halfWidth < 2) return 1.02;
  if (halfWidth > 6) return 0.88;
  if (halfWidth > 4) return 0.94;
  return 1;
}
const shapAgg = {};
function recordShapSampleEEE(signals, realisedPct) {
  if (!Number.isFinite(realisedPct)) return;
  const r = Math.tanh(realisedPct / 5);
  for (const s of signals) {
    const e = shapAgg[s.name] ?? (shapAgg[s.name] = { sumAbs: 0, n: 0, corr: 0 });
    e.sumAbs += Math.abs(s.value);
    e.corr = e.corr * 0.95 + s.value * r * 0.05;
    e.n += 1;
  }
}
function featureImportanceMultiplierEEE(signals) {
  if (signals.length === 0) return 1;
  let aligned = 0, total = 0;
  for (const s of signals) {
    const e = shapAgg[s.name];
    if (!e || e.n < 5) continue;
    total += 1;
    if (Math.sign(s.value) === Math.sign(e.corr) && Math.abs(e.corr) > 0.02) aligned += 1;
  }
  if (total < 3) return 1;
  const r = aligned / total;
  if (r > 0.75) return 1.05;
  if (r > 0.6) return 1.02;
  if (r < 0.3) return 0.92;
  if (r < 0.45) return 0.97;
  return 1;
}
const microFFF = {};
function microstructureTickMultiplierFFF(symbol, dir) {
  const s = microFFF[symbol];
  if (!s || s.imbalance.length < 8) return 1;
  const imb = mean$c(s.imbalance.slice(-10));
  const dev = mean$c(s.vwapDev.slice(-10));
  const aligned = Math.sign(imb) === Math.sign(dir) && Math.sign(dir) !== 0;
  if (aligned && Math.abs(imb) > 0.3 && Math.sign(dev) === Math.sign(dir)) return 1.06;
  if (aligned && Math.abs(imb) > 0.15) return 1.03;
  if (!aligned && Math.abs(imb) > 0.3) return 0.9;
  return 1;
}
const eventTable = {};
function eventStudyMultiplierGGG(activeEvents, dir) {
  if (!activeEvents.length) return 1;
  let sum = 0, n = 0;
  for (const ev of activeEvents) {
    const e = eventTable[ev];
    if (!e || e.car.length < 5) continue;
    sum += mean$c(e.car);
    n += 1;
  }
  if (n === 0) return 1;
  const avgCar = sum / n;
  const aligned = Math.sign(avgCar) === Math.sign(dir) && Math.sign(dir) !== 0;
  if (aligned && Math.abs(avgCar) > 2) return 1.06;
  if (aligned && Math.abs(avgCar) > 0.8) return 1.03;
  if (!aligned && Math.abs(avgCar) > 2) return 0.88;
  if (!aligned && Math.abs(avgCar) > 0.8) return 0.95;
  return 1;
}
const kalmanState$1 = {};
function updateKalmanHHH(symbol, observation) {
  if (!Number.isFinite(observation)) return 0;
  const k = kalmanState$1[symbol] ?? (kalmanState$1[symbol] = { x: observation, p: 1, q: 0.01, r: 0.5 });
  k.p = k.p + k.q;
  const gain = k.p / (k.p + k.r);
  k.x = k.x + gain * (observation - k.x);
  k.p = (1 - gain) * k.p;
  return k.x;
}
function kalmanTrendMultiplierHHH(symbol, currentPrice, dir) {
  const k = kalmanState$1[symbol];
  if (!k) return 1;
  if (!Number.isFinite(currentPrice) || currentPrice < 1e-6) return 1;
  const dev = (currentPrice - k.x) / k.x;
  const aligned = Math.sign(dev) === Math.sign(dir) && Math.sign(dir) !== 0;
  if (aligned && Math.abs(dev) > 0.02) return 1.04;
  if (!aligned && Math.abs(dev) > 0.03) return 0.92;
  return 1;
}
const garchState = {};
function updateGarchIII(symbol, ret) {
  if (!Number.isFinite(ret)) return;
  const g = garchState[symbol] ?? (garchState[symbol] = { omega: 1e-4, alpha: 0.1, beta: 0.85, sigma2: 4e-4 });
  g.sigma2 = g.omega + g.alpha * ret * ret + g.beta * g.sigma2;
}
function garchVolMultiplierIII(symbol) {
  const g = garchState[symbol];
  if (!g) return 1;
  const vol = Math.sqrt(g.sigma2) * 100;
  if (vol < 1) return 1.04;
  if (vol < 2) return 1.02;
  if (vol > 6) return 0.85;
  if (vol > 4) return 0.93;
  return 1;
}
const K = 4;
let centroids = [];
let centroidCounts = [];
const recentClusterIds = [];
function dist(a, b) {
  const n = Math.min(a.length, b.length);
  let s = 0;
  for (let i = 0; i < n; i++) {
    const d = a[i] - b[i];
    s += d * d;
  }
  return Math.sqrt(s);
}
function recordClusterRegimeJJJ(features) {
  if (!features.length) return -1;
  if (centroids.length < K) {
    centroids.push([...features]);
    centroidCounts.push(1);
    const id = centroids.length - 1;
    recentClusterIds.push(id);
    if (recentClusterIds.length > 30) recentClusterIds.shift();
    return id;
  }
  let best = 0, bestD = Infinity;
  for (let i = 0; i < centroids.length; i++) {
    const d = dist(centroids[i], features);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  centroidCounts[best] += 1;
  const lr = 1 / Math.min(centroidCounts[best], 100);
  const c = centroids[best];
  for (let i = 0; i < Math.min(c.length, features.length); i++) {
    c[i] = c[i] * (1 - lr) + features[i] * lr;
  }
  recentClusterIds.push(best);
  if (recentClusterIds.length > 30) recentClusterIds.shift();
  return best;
}
function clusterRegimeMultiplierJJJ(features) {
  if (recentClusterIds.length < 10 || centroids.length < K) return 1;
  const id = recordClusterRegimeJJJ(features);
  if (id < 0) return 1;
  const same = recentClusterIds.filter((x) => x === id).length;
  const stability = same / recentClusterIds.length;
  if (stability > 0.7) return 1.04;
  if (stability < 0.25) return 0.95;
  return 1;
}
const decisionHistory = [];
function recordDecisionKKK(signal, outcome) {
  if (!Number.isFinite(signal) || !Number.isFinite(outcome)) return;
  decisionHistory.push({ signal, outcome, ts: Date.now() });
  if (decisionHistory.length > 200) decisionHistory.splice(0, decisionHistory.length - 200);
}
function transformerSeqMultiplierKKK(currentSignal) {
  if (decisionHistory.length < 20) return 1;
  const sims = decisionHistory.map((d) => Math.exp(-Math.abs(d.signal - currentSignal) * 2));
  const z = sims.reduce((a, b) => a + b, 0) || 1;
  const expectedOutcome = decisionHistory.reduce((s, d, i) => s + sims[i] / z * d.outcome, 0);
  const aligned = Math.sign(expectedOutcome) === Math.sign(currentSignal) && Math.sign(currentSignal) !== 0;
  if (aligned && Math.abs(expectedOutcome) > 1.5) return 1.05;
  if (aligned && Math.abs(expectedOutcome) > 0.5) return 1.02;
  if (!aligned && Math.abs(expectedOutcome) > 1.5) return 0.9;
  return 1;
}
const causalSamples = [];
function recordCausalSampleLLL(sentiment, momentum, outcome) {
  if (![sentiment, momentum, outcome].every(Number.isFinite)) return;
  causalSamples.push({ sentiment, momentum, outcome });
  if (causalSamples.length > 300) causalSamples.splice(0, causalSamples.length - 300);
}
function causalInferenceMultiplierLLL(currentSentiment, dir) {
  if (causalSamples.length < 30) return 1;
  const m = causalSamples.map((s) => s.momentum);
  const mm = mean$c(m);
  const mVar = variance$9(m) + 1e-9;
  const sent = causalSamples.map((s) => s.sentiment);
  const out = causalSamples.map((s) => s.outcome);
  const sm = mean$c(sent), om = mean$c(out);
  let covSM = 0, covOM = 0;
  for (let i = 0; i < causalSamples.length; i++) {
    covSM += (sent[i] - sm) * (m[i] - mm);
    covOM += (out[i] - om) * (m[i] - mm);
  }
  covSM /= causalSamples.length;
  covOM /= causalSamples.length;
  const bSM = covSM / mVar, bOM = covOM / mVar;
  const sentRes = [], outRes = [];
  for (let i = 0; i < causalSamples.length; i++) {
    sentRes.push(sent[i] - sm - bSM * (m[i] - mm));
    outRes.push(out[i] - om - bOM * (m[i] - mm));
  }
  const srm = mean$c(sentRes), orm = mean$c(outRes);
  let num = 0, ds = 0, doo = 0;
  for (let i = 0; i < sentRes.length; i++) {
    const a = sentRes[i] - srm, b = outRes[i] - orm;
    num += a * b;
    ds += a * a;
    doo += b * b;
  }
  const denom = Math.sqrt(ds * doo) || 1;
  const causalCorr = num / denom;
  const aligned = Math.sign(currentSentiment) === Math.sign(dir) && Math.sign(dir) !== 0;
  if (aligned && causalCorr > 0.3) return 1.05;
  if (aligned && causalCorr > 0.1) return 1.02;
  if (!aligned && causalCorr > 0.3) return 0.92;
  return 1;
}
function adversarialRobustnessMultiplierMMM(signals) {
  if (signals.length < 3) return 1;
  const score = (vals) => vals.reduce((s, v, i) => s + v * (signals[i].weight ?? 1), 0);
  const base = score(signals.map((s) => s.value));
  if (Math.abs(base) < 1e-6) return 1;
  let flips = 0, total = 0;
  for (let i = 0; i < signals.length; i++) {
    for (const eps of [-0.1, 0.1]) {
      const perturbed = signals.map((s, j) => i === j ? s.value * (1 + eps) : s.value);
      const p = score(perturbed);
      total += 1;
      if (Math.sign(p) !== Math.sign(base)) flips += 1;
    }
  }
  const flipRate = flips / total;
  if (flipRate < 0.05) return 1.05;
  if (flipRate < 0.15) return 1.02;
  if (flipRate > 0.4) return 0.88;
  if (flipRate > 0.25) return 0.95;
  return 1;
}
const ewcFisher$1 = {};
const ewcAnchor = {};
function recordEWCSampleNNN(tierName, signal, gradient) {
  if (!Number.isFinite(signal) || !Number.isFinite(gradient)) return;
  const fisher = ewcFisher$1[tierName] ?? 0;
  ewcFisher$1[tierName] = fisher * 0.99 + gradient * gradient * 0.01;
  if (!(tierName in ewcAnchor)) ewcAnchor[tierName] = signal;
  else ewcAnchor[tierName] = ewcAnchor[tierName] * 0.995 + signal * 5e-3;
}
function continualLearningMultiplierNNN(signals) {
  if (signals.length === 0) return 1;
  let drift = 0, n = 0;
  for (const s of signals) {
    const anchor = ewcAnchor[s.name];
    const fisher = ewcFisher$1[s.name];
    if (anchor === void 0 || !fisher || fisher < 1e-6) continue;
    drift += fisher * (s.value - anchor) * (s.value - anchor);
    n += 1;
  }
  if (n < 3) return 1;
  const avgDrift = drift / n;
  if (avgDrift > 0.5) return 0.9;
  if (avgDrift > 0.2) return 0.96;
  return 1;
}
const tfHistory = [];
const tfReliability = { m1: 0.5, m5: 0.5, h1: 0.5, d1: 0.5 };
function recordTimeframeOutcomeOOO(s) {
  if (![s.sig1m, s.sig5m, s.sig1h, s.sig1d, s.outcome].every(Number.isFinite)) return;
  tfHistory.push(s);
  if (tfHistory.length > 100) tfHistory.splice(0, tfHistory.length - 100);
  const out = Math.sign(s.outcome);
  if (out === 0) return;
  const lr = 0.05;
  tfReliability.m1 += lr * ((Math.sign(s.sig1m) === out ? 1 : 0) - tfReliability.m1);
  tfReliability.m5 += lr * ((Math.sign(s.sig5m) === out ? 1 : 0) - tfReliability.m5);
  tfReliability.h1 += lr * ((Math.sign(s.sig1h) === out ? 1 : 0) - tfReliability.h1);
  tfReliability.d1 += lr * ((Math.sign(s.sig1d) === out ? 1 : 0) - tfReliability.d1);
}
function multiTimeframeFusionMultiplierOOO(tf, dir) {
  const r = tfReliability;
  const items = [
    { v: tf.sig1m ?? 0, w: r.m1 },
    { v: tf.sig5m ?? 0, w: r.m5 },
    { v: tf.sig1h ?? 0, w: r.h1 },
    { v: tf.sig1d ?? 0, w: r.d1 }
  ];
  const totalW = items.reduce((s, x) => s + x.w, 0) || 1;
  const fused = items.reduce((s, x) => s + x.v * x.w, 0) / totalW;
  const aligned = Math.sign(fused) === Math.sign(dir) && Math.sign(dir) !== 0;
  if (aligned && Math.abs(fused) > 0.5) return 1.05;
  if (aligned && Math.abs(fused) > 0.2) return 1.02;
  if (!aligned && Math.abs(fused) > 0.5) return 0.9;
  return 1;
}
const portfolioPositions = {};
function portfolioRiskParityMultiplierPPP(symbol, sector) {
  const positions = Object.entries(portfolioPositions);
  if (positions.length < 2) return 1;
  const totalW = positions.reduce((s, [, p]) => s + p.weight, 0) || 1;
  let hhi = 0;
  for (const [, p] of positions) {
    const w = p.weight / totalW;
    hhi += w * w;
  }
  let sectorExp = 0;
  for (const [, p] of positions) if (p.sector === sector) sectorExp += p.weight / totalW;
  const already = !!portfolioPositions[symbol];
  let mult = 1;
  if (hhi > 0.5) mult *= 0.92;
  if (sectorExp > 0.4) mult *= 0.93;
  if (already) mult *= 0.95;
  if (positions.length >= 5 && hhi < 0.25) mult *= 1.03;
  return clamp$a(mult, 0.82, 1.05);
}
function snapshotTierCCCPPPState() {
  return {
    bmaTable,
    conformalResiduals: conformalResiduals$2.slice(-500),
    shapAgg,
    microFFF,
    eventTable,
    kalmanState: kalmanState$1,
    garchState,
    centroids,
    centroidCounts,
    recentClusterIds: recentClusterIds.slice(-30),
    decisionHistory: decisionHistory.slice(-200),
    causalSamples: causalSamples.slice(-300),
    ewcFisher: ewcFisher$1,
    ewcAnchor,
    tfHistory: tfHistory.slice(-100),
    tfReliability,
    portfolioPositions
  };
}
function restoreTierCCCPPPState(s) {
  try {
    const d = s;
    if (d.bmaTable) Object.assign(bmaTable, d.bmaTable);
    if (Array.isArray(d.conformalResiduals)) {
      conformalResiduals$2.length = 0;
      conformalResiduals$2.push(...d.conformalResiduals);
    }
    if (d.shapAgg) Object.assign(shapAgg, d.shapAgg);
    if (d.microFFF) Object.assign(microFFF, d.microFFF);
    if (d.eventTable) Object.assign(eventTable, d.eventTable);
    if (d.kalmanState) Object.assign(kalmanState$1, d.kalmanState);
    if (d.garchState) Object.assign(garchState, d.garchState);
    if (Array.isArray(d.centroids)) centroids = d.centroids;
    if (Array.isArray(d.centroidCounts)) centroidCounts = d.centroidCounts;
    if (Array.isArray(d.recentClusterIds)) {
      recentClusterIds.length = 0;
      recentClusterIds.push(...d.recentClusterIds);
    }
    if (Array.isArray(d.decisionHistory)) {
      decisionHistory.length = 0;
      decisionHistory.push(...d.decisionHistory);
    }
    if (Array.isArray(d.causalSamples)) {
      causalSamples.length = 0;
      causalSamples.push(...d.causalSamples);
    }
    if (d.ewcFisher) Object.assign(ewcFisher$1, d.ewcFisher);
    if (d.ewcAnchor) Object.assign(ewcAnchor, d.ewcAnchor);
    if (Array.isArray(d.tfHistory)) {
      tfHistory.length = 0;
      tfHistory.push(...d.tfHistory);
    }
    if (d.tfReliability) Object.assign(tfReliability, d.tfReliability);
    if (d.portfolioPositions) Object.assign(portfolioPositions, d.portfolioPositions);
  } catch {
  }
}
const clamp$9 = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const mean$b = (a) => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
const altData = {};
function alternativeDataFusionMultiplierQQQ(symbol, dir) {
  const arr = altData[symbol];
  if (!arr || arr.length < 5) return 1;
  const recent = arr.slice(-3);
  const older = arr.slice(-10, -3);
  if (older.length < 3) return 1;
  const recScore = mean$b(recent.map((x) => x.trends + x.social * 1.5 + x.wiki));
  const oldScore = mean$b(older.map((x) => x.trends + x.social * 1.5 + x.wiki));
  const velocity = recScore - oldScore;
  const aligned = Math.sign(velocity) === Math.sign(dir) && Math.sign(dir) !== 0;
  if (aligned && Math.abs(velocity) > 2) return 1.06;
  if (aligned && Math.abs(velocity) > 0.5) return 1.02;
  if (!aligned && Math.abs(velocity) > 2) return 0.9;
  return 1;
}
const insiderData = {};
function insiderActivityMultiplierRRR(symbol, dir) {
  const arr = insiderData[symbol];
  if (!arr || arr.length < 3) return 1;
  const cutoff = Date.now() - 30 * 24 * 3600 * 1e3;
  const recent = arr.filter((e) => e.ts >= cutoff);
  if (recent.length < 2) return 1;
  const buys = recent.filter((e) => e.type === "buy").reduce((s, e) => s + e.size, 0);
  const sells = recent.filter((e) => e.type === "sell").reduce((s, e) => s + e.size, 0);
  const tot = buys + sells;
  if (tot < 1) return 1;
  const netRatio = (buys - sells) / tot;
  const aligned = Math.sign(netRatio) === Math.sign(dir) && Math.sign(dir) !== 0;
  if (aligned && Math.abs(netRatio) > 0.6 && recent.length >= 5) return 1.08;
  if (aligned && Math.abs(netRatio) > 0.3) return 1.03;
  if (!aligned && Math.abs(netRatio) > 0.6) return 0.88;
  return 1;
}
const analystRev = {};
function analystRevisionMultiplierSSS(symbol, dir) {
  const arr = analystRev[symbol];
  if (!arr || arr.length < 3) return 1;
  const recent = arr.slice(-5);
  const epsAvg = mean$b(recent.map((r) => r.epsDelta));
  const tgtAvg = mean$b(recent.map((r) => r.targetDelta));
  const composite = epsAvg + tgtAvg * 0.5;
  const aligned = Math.sign(composite) === Math.sign(dir) && Math.sign(dir) !== 0;
  if (aligned && Math.abs(composite) > 5) return 1.07;
  if (aligned && Math.abs(composite) > 1) return 1.03;
  if (!aligned && Math.abs(composite) > 5) return 0.88;
  return 1;
}
const darkPool = {};
function darkPoolFlowMultiplierTTT(symbol, dir) {
  const arr = darkPool[symbol];
  if (!arr || arr.length < 5) return 1;
  const cutoff = Date.now() - 5 * 24 * 3600 * 1e3;
  const recent = arr.filter((x) => x.ts >= cutoff);
  if (recent.length < 3) return 1;
  const b = recent.filter((x) => x.side === "buy").reduce((s2, x) => s2 + x.notional, 0);
  const s = recent.filter((x) => x.side === "sell").reduce((s2, x) => s2 + x.notional, 0);
  const tot = b + s;
  if (tot < 1) return 1;
  const imbalance = (b - s) / tot;
  const aligned = Math.sign(imbalance) === Math.sign(dir) && Math.sign(dir) !== 0;
  if (aligned && Math.abs(imbalance) > 0.5) return 1.06;
  if (aligned && Math.abs(imbalance) > 0.2) return 1.02;
  if (!aligned && Math.abs(imbalance) > 0.5) return 0.9;
  return 1;
}
const ragStore = [];
const RAG_DIM = 12;
function recordPatternUUU(features, outcome) {
  if (!features.length || !Number.isFinite(outcome)) return;
  const v = features.slice(0, RAG_DIM);
  while (v.length < RAG_DIM) v.push(0);
  ragStore.push({ vec: v, outcome, ts: Date.now() });
  if (ragStore.length > 1e3) ragStore.splice(0, ragStore.length - 1e3);
}
function cosine$1(a, b) {
  const n = Math.min(a.length, b.length);
  let dot2 = 0, na = 0, nb = 0;
  for (let i = 0; i < n; i++) {
    dot2 += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const d = Math.sqrt(na * nb);
  return d > 1e-9 ? dot2 / d : 0;
}
function vectorRAGMultiplierUUU(features, dir) {
  if (ragStore.length < 20 || !features.length) return 1;
  const v = features.slice(0, RAG_DIM);
  while (v.length < RAG_DIM) v.push(0);
  const scored = ragStore.map((p) => ({ sim: cosine$1(p.vec, v), outcome: p.outcome })).filter((x) => x.sim > 0.7).sort((a, b) => b.sim - a.sim).slice(0, 10);
  if (scored.length < 3) return 1;
  const expected = mean$b(scored.map((x) => x.outcome));
  const aligned = Math.sign(expected) === Math.sign(dir) && Math.sign(dir) !== 0;
  if (aligned && Math.abs(expected) > 2) return 1.06;
  if (aligned && Math.abs(expected) > 0.5) return 1.02;
  if (!aligned && Math.abs(expected) > 2) return 0.9;
  return 1;
}
const lstmCells = {};
function trainLstmVVV(symbol, input, target) {
  if (![input, target].every(Number.isFinite)) return;
  const s = lstmCells[symbol] ?? (lstmCells[symbol] = {
    h: 0,
    c: 0,
    wIn: 0.5,
    wF: 0.5,
    wOut: 0.5,
    bias: 0
  });
  const sigmoid2 = (x) => 1 / (1 + Math.exp(-x));
  const f = sigmoid2(s.wF * s.h + s.bias);
  const i = sigmoid2(s.wIn * input);
  const o = sigmoid2(s.wOut * input);
  s.c = f * s.c + i * Math.tanh(input);
  s.h = o * Math.tanh(s.c);
  const err = s.h - Math.tanh(target / 5);
  const lr = 0.01;
  s.wOut = clamp$9(s.wOut - lr * err * input, -2, 2);
  s.wIn = clamp$9(s.wIn - lr * err * input * 0.5, -2, 2);
  s.wF = clamp$9(s.wF - lr * err * s.h * 0.5, -2, 2);
  s.bias = clamp$9(s.bias - lr * err * 0.1, -1, 1);
}
function lstmDeepLearningMultiplierVVV(symbol, currentInput, dir) {
  const s = lstmCells[symbol];
  if (!s) return 1;
  const sigmoid2 = (x) => 1 / (1 + Math.exp(-x));
  const o = sigmoid2(s.wOut * currentInput);
  const pred = o * Math.tanh(s.c);
  const aligned = Math.sign(pred) === Math.sign(dir) && Math.sign(dir) !== 0;
  if (aligned && Math.abs(pred) > 0.4) return 1.05;
  if (aligned && Math.abs(pred) > 0.15) return 1.02;
  if (!aligned && Math.abs(pred) > 0.4) return 0.9;
  return 1;
}
const genePool = [];
const POOL_SIZE = 20;
function evalGene(g, feats) {
  const a = feats[g.a] ?? 0, b = feats[g.b] ?? 0;
  switch (g.op) {
    case "mul":
      return a * b;
    case "div":
      return Math.abs(b) > 1e-6 ? a / b : 0;
    case "add":
      return a + b;
    case "sub":
      return a - b;
  }
}
function trainGeneticAlgoWWW(features, outcome) {
  if (!features.length || !Number.isFinite(outcome)) return;
  if (genePool.length < POOL_SIZE) {
    const ops = ["mul", "div", "add", "sub"];
    while (genePool.length < POOL_SIZE) {
      genePool.push({
        a: Math.floor(Math.random() * features.length),
        b: Math.floor(Math.random() * features.length),
        op: ops[Math.floor(Math.random() * ops.length)],
        fitness: 0,
        n: 0
      });
    }
  }
  const r = Math.tanh(outcome / 5);
  for (const g of genePool) {
    const v = Math.tanh(evalGene(g, features));
    const correct = Math.sign(v) === Math.sign(r) && Math.sign(r) !== 0 ? 1 : 0;
    g.fitness = (g.fitness * g.n + correct) / (g.n + 1);
    g.n += 1;
  }
  if (Math.random() < 0.05) {
    genePool.sort((a, b) => b.fitness - a.fitness);
    const best = genePool[0];
    const ops = ["mul", "div", "add", "sub"];
    genePool[genePool.length - 1] = {
      a: Math.random() < 0.5 ? best.a : Math.floor(Math.random() * features.length),
      b: Math.random() < 0.5 ? best.b : Math.floor(Math.random() * features.length),
      op: Math.random() < 0.5 ? best.op : ops[Math.floor(Math.random() * ops.length)],
      fitness: 0,
      n: 0
    };
  }
}
function geneticAlgoMultiplierWWW(features, dir) {
  if (genePool.length < POOL_SIZE || !features.length) return 1;
  const ready = genePool.filter((g) => g.n >= 20 && g.fitness > 0.55);
  if (ready.length < 3) return 1;
  const signal = mean$b(ready.map((g) => Math.tanh(evalGene(g, features))));
  const aligned = Math.sign(signal) === Math.sign(dir) && Math.sign(dir) !== 0;
  if (aligned && Math.abs(signal) > 0.4) return 1.05;
  if (aligned && Math.abs(signal) > 0.15) return 1.02;
  if (!aligned && Math.abs(signal) > 0.4) return 0.92;
  return 1;
}
function quantumInspiredMultiplierXXX(currentWeight, targetWeight, sectorExposure) {
  const drift = Math.abs(currentWeight - targetWeight);
  if (drift > 0.2) return 0.95;
  return 1;
}
const thresholdPool = {};
function recordThresholdOutcomeYYY(thresholdKey, val, won) {
  const pool = thresholdPool[thresholdKey] ?? (thresholdPool[thresholdKey] = []);
  let entry = pool.find((p) => Math.abs(p.val - val) < 1e-6);
  if (!entry) {
    entry = { val, wins: 0, trials: 0 };
    pool.push(entry);
  }
  entry.trials += 1;
  if (won) entry.wins += 1;
}
function getBestThresholdYYY(thresholdKey, fallback) {
  const pool = thresholdPool[thresholdKey];
  if (!pool || pool.length === 0) return fallback;
  const totalTrials = pool.reduce((s, p) => s + p.trials, 0);
  if (totalTrials < 20) return fallback;
  let best = pool[0], bestScore = -Infinity;
  for (const p of pool) {
    if (p.trials === 0) continue;
    const wr = p.wins / p.trials;
    const ucb = wr + Math.sqrt(2 * Math.log(totalTrials) / p.trials);
    if (ucb > bestScore) {
      bestScore = ucb;
      best = p;
    }
  }
  return best.val;
}
function autoMLMultiplierYYY(thresholdKey, currentVal, fallback) {
  const best = getBestThresholdYYY(thresholdKey, fallback);
  const diff = Math.abs(currentVal - best);
  if (diff < 0.05) return 1.03;
  if (diff > 0.3) return 0.97;
  return 1;
}
const banditTable = {};
function recordTierBanditZZZ(regime, tier, won) {
  const k = `${regime}::${tier}`;
  const arm = banditTable[k] ?? (banditTable[k] = { a: 1, b: 1 });
  if (won) arm.a += 1;
  else arm.b += 1;
}
function betaSample(a, b) {
  const m = a / (a + b);
  const v = a * b / ((a + b) * (a + b) * (a + b + 1));
  const std2 = Math.sqrt(v);
  const u1 = Math.random() || 1e-9, u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return clamp$9(m + std2 * z, 0, 1);
}
function banditTierWeightZZZ(regime, tier) {
  const arm = banditTable[`${regime}::${tier}`];
  if (!arm) return 1;
  return betaSample(arm.a, arm.b);
}
function multiArmedBanditMultiplierZZZ(regime, tierSignals) {
  if (tierSignals.length < 3) return 1;
  let weighted = 0, totalW = 0;
  for (const s of tierSignals) {
    const w = banditTierWeightZZZ(regime, s.name);
    weighted += w * s.value;
    totalW += w;
  }
  if (totalW < 0.5) return 1;
  const score = weighted / totalW;
  return clamp$9(1 + clamp$9(score, -0.5, 0.5) * 0.12, 0.9, 1.08);
}
function simulationPlanningMultiplierAAAA(expectedRetPct, volPct, horizonDays) {
  if (!Number.isFinite(expectedRetPct) || !Number.isFinite(volPct) || volPct <= 0) return 1;
  const N = 500;
  const mu = expectedRetPct / 100 / Math.max(horizonDays, 1);
  const sigma = volPct / 100 / Math.sqrt(252);
  let wins = 0, sumRet = 0;
  for (let i = 0; i < N; i++) {
    let p = 1;
    for (let d = 0; d < horizonDays; d++) {
      const u1 = Math.random() || 1e-9, u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      p *= 1 + mu + sigma * z;
    }
    const ret = (p - 1) * 100;
    sumRet += ret;
    if (ret > 0) wins++;
  }
  const winRate = wins / N;
  const avgRet = sumRet / N;
  if (winRate > 0.65 && avgRet > 1) return 1.06;
  if (winRate > 0.55 && avgRet > 0) return 1.02;
  if (winRate < 0.35 || avgRet < -1) return 0.88;
  return 1;
}
let cotBias = null;
const COT_TTL = 30 * 60 * 1e3;
function chainOfThoughtMultiplierBBBB(dir) {
  if (!cotBias) return 1;
  if (Date.now() - cotBias.ts > COT_TTL) return 1;
  const aligned = Math.sign(cotBias.bias) === Math.sign(dir) && Math.sign(dir) !== 0;
  if (aligned && cotBias.conf > 0.7) return 1.06;
  if (aligned && cotBias.conf > 0.4) return 1.02;
  if (!aligned && cotBias.conf > 0.7) return 0.88;
  return 1;
}
const breaker = { recent: [], tripped: false, trippedAt: 0 };
const BREAKER_WINDOW = 30;
const BREAKER_THRESHOLD = 0.35;
const BREAKER_COOLDOWN_MS = 6 * 3600 * 1e3;
function recordBreakerOutcomeCCCC(won) {
  breaker.recent.push(won);
  if (breaker.recent.length > BREAKER_WINDOW) breaker.recent.shift();
  if (breaker.recent.length >= BREAKER_WINDOW) {
    const wr = breaker.recent.filter(Boolean).length / breaker.recent.length;
    if (wr < BREAKER_THRESHOLD && !breaker.tripped) {
      breaker.tripped = true;
      breaker.trippedAt = Date.now();
    } else if (wr > 0.55 && breaker.tripped && Date.now() - breaker.trippedAt > BREAKER_COOLDOWN_MS) {
      breaker.tripped = false;
    }
  }
}
function circuitBreakerMultiplierCCCC() {
  if (!breaker.tripped) return 1;
  return 0.5;
}
const abBuckets = {};
function recordABSampleDDDD(tier, prodVal, shadowVal) {
  const b = abBuckets[tier] ?? (abBuckets[tier] = { prod: { vals: [] }, shadow: { vals: [] } });
  if (Number.isFinite(prodVal)) {
    b.prod.vals.push(prodVal);
    if (b.prod.vals.length > 100) b.prod.vals.shift();
  }
  if (Number.isFinite(shadowVal)) {
    b.shadow.vals.push(shadowVal);
    if (b.shadow.vals.length > 100) b.shadow.vals.shift();
  }
}
const alertQueue = [];
function pushAlertFFFF(symbol, reason, severity) {
  alertQueue.push({ symbol, reason, severity, ts: Date.now() });
  if (alertQueue.length > 200) alertQueue.shift();
}
function checkCriticalSignalFFFF(symbol, confidence, robustness2, conformalHalfWidth2) {
  if (confidence >= 75 && robustness2 >= 1.02) {
    pushAlertFFFF(symbol, "Moderate-conviction robust signal", "med");
  }
}
function snapshotTierQQQFFFFState() {
  return {
    altData,
    insiderData,
    analystRev,
    darkPool,
    ragStore: ragStore.slice(-1e3),
    lstmCells,
    genePool,
    thresholdPool,
    banditTable,
    cotBias,
    breaker,
    abBuckets,
    alertQueue: alertQueue.slice(-200)
  };
}
function restoreTierQQQFFFFState(s) {
  try {
    const d = s;
    if (d.altData) Object.assign(altData, d.altData);
    if (d.insiderData) Object.assign(insiderData, d.insiderData);
    if (d.analystRev) Object.assign(analystRev, d.analystRev);
    if (d.darkPool) Object.assign(darkPool, d.darkPool);
    if (Array.isArray(d.ragStore)) {
      ragStore.length = 0;
      ragStore.push(...d.ragStore);
    }
    if (d.lstmCells) Object.assign(lstmCells, d.lstmCells);
    if (Array.isArray(d.genePool)) {
      genePool.length = 0;
      genePool.push(...d.genePool);
    }
    if (d.thresholdPool) Object.assign(thresholdPool, d.thresholdPool);
    if (d.banditTable) Object.assign(banditTable, d.banditTable);
    if (d.cotBias !== void 0) cotBias = d.cotBias;
    if (d.breaker) Object.assign(breaker, d.breaker);
    if (d.abBuckets) Object.assign(abBuckets, d.abBuckets);
    if (Array.isArray(d.alertQueue)) {
      alertQueue.length = 0;
      alertQueue.push(...d.alertQueue);
    }
  } catch {
  }
}
const clamp$8 = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const mean$a = (a) => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
const variance$8 = (a) => {
  if (a.length < 2) return 0;
  const m = mean$a(a);
  return a.reduce((s, v) => s + (v - m) * (v - m), 0) / (a.length - 1);
};
const std$6 = (a) => Math.sqrt(variance$8(a));
const vpinState = {};
function vpinMultiplierGGGG(symbol, dir) {
  const s = vpinState[symbol];
  if (!s || s.buckets.length < 5) return 1;
  const recent = s.buckets.slice(-20);
  const imb = recent.map((b) => Math.abs(b.buy - b.sell) / Math.max(1, b.buy + b.sell));
  const vpin2 = mean$a(imb);
  if (vpin2 > 0.5) return 0.88;
  if (vpin2 > 0.35) return 0.95;
  if (vpin2 < 0.15 && Math.abs(dir) > 0.2) return 1.03;
  return 1;
}
const hawkesEvents$3 = {};
const HAWKES_DECAY = 1 / (60 * 60 * 1e3);
function hawkesMultiplierHHHH(symbol, dir) {
  const arr = hawkesEvents$3[symbol];
  if (!arr || arr.length < 5) return 1;
  const now = Date.now();
  const baseline = 0.1;
  const alpha = 0.5;
  let intensity2 = baseline;
  for (const e of arr) {
    const dt = (now - e.ts) * HAWKES_DECAY;
    if (dt > 10) continue;
    intensity2 += alpha * e.mag * Math.exp(-dt);
  }
  if (intensity2 > 5 && Math.abs(dir) > 0.1) return 1.08;
  if (intensity2 > 2 && Math.abs(dir) > 0.1) return 1.03;
  if (intensity2 > 5 && Math.abs(dir) < 0.05) return 0.93;
  return 1;
}
const kyleSamples$1 = {};
function kyleLambdaMultiplierIIII(symbol) {
  const arr = kyleSamples$1[symbol];
  if (!arr || arr.length < 20) return 1;
  let num = 0, den = 0;
  for (const s of arr) {
    num += s.dPrice * s.signedVol;
    den += s.signedVol * s.signedVol;
  }
  if (den === 0) return 1;
  const lambda = num / den;
  const absL = Math.abs(lambda);
  if (absL > 0.01) return 0.9;
  if (absL > 5e-3) return 0.96;
  if (absL < 1e-3) return 1.04;
  return 1;
}
const pinHistory = {};
function pinMultiplierJJJJ(symbol, dir) {
  const s = pinHistory[symbol];
  if (!s || s.buys.length < 10) return 1;
  const meanB = mean$a(s.buys), meanS = mean$a(s.sells);
  const totalMean = meanB + meanS;
  if (totalMean === 0) return 1;
  const sigma = std$6([...s.buys, ...s.sells]);
  const pin = Math.abs(meanB - meanS) / (totalMean + 0.5 * sigma);
  const flowSign = Math.sign(meanB - meanS);
  const aligned = flowSign === Math.sign(dir) && Math.sign(dir) !== 0;
  if (pin > 0.3 && aligned) return 1.07;
  if (pin > 0.3 && !aligned) return 0.88;
  return 1;
}
const dmlSamples = [];
function recordDoubleMLKKKK(treatment, outcome, confounder) {
  if (![treatment, outcome, confounder].every(Number.isFinite)) return;
  dmlSamples.push({ treatment, outcome, confounder });
  if (dmlSamples.length > 500) dmlSamples.shift();
}
function doubleMLMultiplierKKKK(treatment, dir) {
  if (dmlSamples.length < 30) return 1;
  const c = dmlSamples.map((s) => s.confounder);
  const t = dmlSamples.map((s) => s.treatment);
  const y = dmlSamples.map((s) => s.outcome);
  const olsCoef = (x, z) => {
    const mx = mean$a(x), mz = mean$a(z);
    let num = 0, den = 0;
    for (let i = 0; i < x.length; i++) {
      num += (x[i] - mx) * (z[i] - mz);
      den += (z[i] - mz) ** 2;
    }
    return den === 0 ? 0 : num / den;
  };
  const bT = olsCoef(t, c);
  const bY = olsCoef(y, c);
  const mc = mean$a(c);
  const resT = t.map((v, i) => v - bT * (c[i] - mc));
  const resY = y.map((v, i) => v - bY * (c[i] - mc));
  const theta = olsCoef(resY, resT);
  const expected = theta * treatment;
  const aligned = Math.sign(expected) === Math.sign(dir) && Math.sign(dir) !== 0;
  if (aligned && Math.abs(expected) > 0.5) return 1.05;
  if (!aligned && Math.abs(expected) > 1) return 0.93;
  return 1;
}
const scHistory = {};
function recordReturnLLLL(symbol, ret) {
  if (!Number.isFinite(ret)) return;
  const a = scHistory[symbol] ?? (scHistory[symbol] = []);
  a.push(ret);
  if (a.length > 60) a.shift();
}
function syntheticControlMultiplierLLLL(symbol, dir) {
  const target = scHistory[symbol];
  if (!target || target.length < 20) return 1;
  const peers = Object.entries(scHistory).filter(([k, v]) => k !== symbol && v.length >= target.length);
  if (peers.length < 3) return 1;
  const n = target.length;
  const synth = new Array(n).fill(0);
  for (const [, v] of peers) {
    const tail = v.slice(-n);
    for (let i = 0; i < n; i++) synth[i] += tail[i] / peers.length;
  }
  const recent = target.slice(-5);
  const synthRecent = synth.slice(-5);
  const gap = mean$a(recent) - mean$a(synthRecent);
  const aligned = Math.sign(gap) === Math.sign(dir) && Math.sign(dir) !== 0;
  if (aligned && Math.abs(gap) > 0.5) return 1.05;
  if (!aligned && Math.abs(gap) > 1) return 0.94;
  return 1;
}
const ivSamples = [];
function recordIVMMMM(instrument, endogenous, outcome) {
  if (![instrument, endogenous, outcome].every(Number.isFinite)) return;
  ivSamples.push({ instrument, endogenous, outcome });
  if (ivSamples.length > 500) ivSamples.shift();
}
function ivMultiplierMMMM(endogenousValue, dir) {
  if (ivSamples.length < 30) return 1;
  const z = ivSamples.map((s) => s.instrument);
  const x = ivSamples.map((s) => s.endogenous);
  const y = ivSamples.map((s) => s.outcome);
  const mz = mean$a(z), mx = mean$a(x), my = mean$a(y);
  let num1 = 0, den1 = 0;
  for (let i = 0; i < z.length; i++) {
    num1 += (z[i] - mz) * (x[i] - mx);
    den1 += (z[i] - mz) ** 2;
  }
  if (den1 === 0) return 1;
  const pi = num1 / den1;
  const xhat = z.map((zi) => pi * (zi - mz) + mx);
  const mxh = mean$a(xhat);
  let num2 = 0, den2 = 0;
  for (let i = 0; i < xhat.length; i++) {
    num2 += (xhat[i] - mxh) * (y[i] - my);
    den2 += (xhat[i] - mxh) ** 2;
  }
  if (den2 === 0) return 1;
  const beta2 = num2 / den2;
  const expected = beta2 * endogenousValue;
  const aligned = Math.sign(expected) === Math.sign(dir) && Math.sign(dir) !== 0;
  if (aligned && Math.abs(expected) > 0.3) return 1.04;
  if (!aligned && Math.abs(expected) > 0.8) return 0.93;
  return 1;
}
const rddSamples = {};
function recordRDDNNNN(symbol, running, outcome) {
  if (!Number.isFinite(running) || !Number.isFinite(outcome)) return;
  const a = rddSamples[symbol] ?? (rddSamples[symbol] = []);
  a.push({ running, outcome });
  if (a.length > 200) a.shift();
}
function rddMultiplierNNNN(symbol, runningValue, dir) {
  const arr = rddSamples[symbol];
  if (!arr || arr.length < 20) return 1;
  const sorted = [...arr].sort((a, b) => a.running - b.running);
  let bestJump = 0, bestThresh = 0;
  for (const q of [0.3, 0.5, 0.7]) {
    const idx = Math.floor(sorted.length * q);
    const thresh = sorted[idx].running;
    const below = arr.filter((s) => s.running < thresh && s.running >= thresh - Math.abs(thresh) * 0.2);
    const above = arr.filter((s) => s.running >= thresh && s.running <= thresh + Math.abs(thresh) * 0.2);
    if (below.length < 3 || above.length < 3) continue;
    const jump = mean$a(above.map((s) => s.outcome)) - mean$a(below.map((s) => s.outcome));
    if (Math.abs(jump) > Math.abs(bestJump)) {
      bestJump = jump;
      bestThresh = thresh;
    }
  }
  if (Math.abs(bestJump) < 0.3) return 1;
  const crossing = runningValue >= bestThresh;
  const expected = crossing ? bestJump : 0;
  const aligned = Math.sign(expected) === Math.sign(dir) && Math.sign(dir) !== 0;
  if (aligned) return 1.04;
  if (!aligned && Math.abs(expected) > 0.6) return 0.95;
  return 1;
}
const calibBuckets = {};
function recordCalibrationOOOO(bucket2, predConf, correct) {
  if (!Number.isFinite(predConf)) return;
  const a = calibBuckets[bucket2] ?? (calibBuckets[bucket2] = []);
  a.push({ predConf, correct: correct ? 1 : 0 });
  if (a.length > 500) a.shift();
}
function metacognitiveMultiplierOOOO(bucket2, predConf) {
  const arr = calibBuckets[bucket2];
  if (!arr || arr.length < 20) return 1;
  const near = arr.filter((s) => Math.abs(s.predConf - predConf) <= 10);
  if (near.length < 5) return 1;
  const empirical = mean$a(near.map((s) => s.correct)) * 100;
  const gap = empirical - predConf;
  if (gap < -15) return 0.88;
  if (gap < -7) return 0.95;
  if (gap > 10) return 1.04;
  return 1;
}
const epistemicSamples = {};
const ensembleVar = {};
function recordUncertaintyPPPP(bucket2, residual, ensembleVariance) {
  if (!Number.isFinite(residual) || !Number.isFinite(ensembleVariance)) return;
  const a = epistemicSamples[bucket2] ?? (epistemicSamples[bucket2] = []);
  const e = ensembleVar[bucket2] ?? (ensembleVar[bucket2] = []);
  a.push(Math.abs(residual));
  e.push(ensembleVariance);
  if (a.length > 200) a.shift();
  if (e.length > 200) e.shift();
}
function uncertaintyMultiplierPPPP(bucket2) {
  const res = epistemicSamples[bucket2];
  const ens = ensembleVar[bucket2];
  if (!res || !ens || res.length < 20) return 1;
  const total = variance$8(res);
  const epistemic = mean$a(ens);
  const aleatoric = Math.max(0, total - epistemic);
  if (total === 0) return 1;
  const aleatoricFrac = aleatoric / total;
  if (aleatoricFrac > 0.75 && total > 4) return 0.85;
  if (aleatoricFrac > 0.6) return 0.93;
  if (aleatoricFrac < 0.3 && epistemic > 1) return 1.02;
  return 1;
}
const oodTrain = [];
const oodStats = { mean: [], varDiag: [] };
function recordOODTrainingQQQQ(features) {
  if (!features.every(Number.isFinite)) return;
  oodTrain.push(features.slice());
  if (oodTrain.length > 500) oodTrain.shift();
  if (oodTrain.length % 25 === 0 && oodTrain.length >= 25) {
    const d = oodTrain[0].length;
    const m = new Array(d).fill(0);
    for (const v of oodTrain) for (let i = 0; i < d; i++) m[i] += v[i];
    for (let i = 0; i < d; i++) m[i] /= oodTrain.length;
    const vr = new Array(d).fill(0);
    for (const v of oodTrain) for (let i = 0; i < d; i++) vr[i] += (v[i] - m[i]) ** 2;
    for (let i = 0; i < d; i++) vr[i] = vr[i] / oodTrain.length + 1e-6;
    oodStats.mean = m;
    oodStats.varDiag = vr;
  }
}
function oodMultiplierQQQQ(features) {
  if (!oodStats.mean.length || features.length !== oodStats.mean.length) return 1;
  if (oodTrain.length < 50) return 1;
  let d2 = 0;
  for (let i = 0; i < features.length; i++) {
    const diff = features[i] - oodStats.mean[i];
    d2 += diff * diff / oodStats.varDiag[i];
  }
  const mahal = Math.sqrt(d2);
  const expected = Math.sqrt(features.length);
  if (mahal > 3 * expected) return 0.75;
  if (mahal > 2 * expected) return 0.88;
  if (mahal > 1.5 * expected) return 0.95;
  return 1;
}
const baselineDist = {};
const recentDist = {};
const BINS = 10;
function binIndex(v, lo, hi) {
  const idx = Math.floor((v - lo) / (hi - lo) * BINS);
  return clamp$8(idx, 0, BINS - 1);
}
function recordDistributionRRRR(bucket2, value, baseline) {
  if (!Number.isFinite(value)) return;
  const lo = 0, hi = 100;
  const target = baseline ? baselineDist : recentDist;
  const s = target[bucket2] ?? (target[bucket2] = { bins: new Array(BINS).fill(0), total: 0 });
  s.bins[binIndex(value, lo, hi)] += 1;
  s.total += 1;
  if (s.total > 2e3) {
    for (let i = 0; i < BINS; i++) s.bins[i] *= 0.5;
    s.total *= 0.5;
  }
}
function modelDecayMultiplierRRRR(bucket2) {
  const b = baselineDist[bucket2];
  const r = recentDist[bucket2];
  if (!b || !r || b.total < 50 || r.total < 30) return 1;
  let psi = 0;
  for (let i = 0; i < BINS; i++) {
    const pB = Math.max(1e-4, b.bins[i] / b.total);
    const pR = Math.max(1e-4, r.bins[i] / r.total);
    psi += (pR - pB) * Math.log(pR / pB);
  }
  if (psi > 0.5) return 0.82;
  if (psi > 0.25) return 0.92;
  if (psi > 0.1) return 0.97;
  return 1;
}
function snapshotTierGGGGRRRRState() {
  return {
    vpinState,
    hawkesEvents: hawkesEvents$3,
    kyleSamples: kyleSamples$1,
    pinHistory,
    dmlSamples: dmlSamples.slice(-500),
    scHistory,
    ivSamples: ivSamples.slice(-500),
    rddSamples,
    calibBuckets,
    epistemicSamples,
    ensembleVar,
    oodTrain: oodTrain.slice(-500),
    oodStats,
    baselineDist,
    recentDist
  };
}
function restoreTierGGGGRRRRState(s) {
  try {
    const d = s;
    if (d.vpinState) Object.assign(vpinState, d.vpinState);
    if (d.hawkesEvents) Object.assign(hawkesEvents$3, d.hawkesEvents);
    if (d.kyleSamples) Object.assign(kyleSamples$1, d.kyleSamples);
    if (d.pinHistory) Object.assign(pinHistory, d.pinHistory);
    if (Array.isArray(d.dmlSamples)) {
      dmlSamples.length = 0;
      dmlSamples.push(...d.dmlSamples);
    }
    if (d.scHistory) Object.assign(scHistory, d.scHistory);
    if (Array.isArray(d.ivSamples)) {
      ivSamples.length = 0;
      ivSamples.push(...d.ivSamples);
    }
    if (d.rddSamples) Object.assign(rddSamples, d.rddSamples);
    if (d.calibBuckets) Object.assign(calibBuckets, d.calibBuckets);
    if (d.epistemicSamples) Object.assign(epistemicSamples, d.epistemicSamples);
    if (d.ensembleVar) Object.assign(ensembleVar, d.ensembleVar);
    if (Array.isArray(d.oodTrain)) {
      oodTrain.length = 0;
      oodTrain.push(...d.oodTrain);
    }
    if (d.oodStats) {
      oodStats.mean = d.oodStats.mean ?? [];
      oodStats.varDiag = d.oodStats.varDiag ?? [];
    }
    if (d.baselineDist) Object.assign(baselineDist, d.baselineDist);
    if (d.recentDist) Object.assign(recentDist, d.recentDist);
  } catch {
  }
}
const clamp$7 = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const mean$9 = (a) => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
const variance$7 = (a) => {
  if (a.length < 2) return 0;
  const m = mean$9(a);
  return a.reduce((s, v) => s + (v - m) * (v - m), 0) / (a.length - 1);
};
const std$5 = (a) => Math.sqrt(variance$7(a));
const dot = (a, b) => {
  const n = Math.min(a.length, b.length);
  let s = 0;
  for (let i = 0; i < n; i++) s += a[i] * b[i];
  return s;
};
const norm = (a) => Math.sqrt(dot(a, a));
const cosine = (a, b) => {
  const d = norm(a) * norm(b);
  return d === 0 ? 0 : dot(a, b) / d;
};
const sgdWeights = {};
let sgdBias = 0;
const SGD_LR = 0.01;
function recordSGDOutcomeSSSS(features, realised) {
  if (!Number.isFinite(realised)) return;
  let pred = sgdBias;
  for (const [k, v] of Object.entries(features)) {
    if (!Number.isFinite(v)) continue;
    pred += (sgdWeights[k] ?? 0) * v;
  }
  const err = realised - pred;
  const clipped = clamp$7(err, -5, 5);
  sgdBias += SGD_LR * clipped;
  for (const [k, v] of Object.entries(features)) {
    if (!Number.isFinite(v)) continue;
    sgdWeights[k] = (sgdWeights[k] ?? 0) + SGD_LR * clipped * v;
    sgdWeights[k] *= 0.9995;
  }
}
function sgdMultiplierSSSS(features, dir) {
  if (Object.keys(sgdWeights).length < 3) return 1;
  let pred = sgdBias;
  for (const [k, v] of Object.entries(features)) {
    if (!Number.isFinite(v)) continue;
    pred += (sgdWeights[k] ?? 0) * v;
  }
  const aligned = Math.sign(pred) === Math.sign(dir) && Math.sign(dir) !== 0;
  if (aligned && Math.abs(pred) > 1) return 1.05;
  if (!aligned && Math.abs(pred) > 1.5) return 0.93;
  return 1;
}
const sourceMarketReturns = [];
const symbolReturns = {};
function recordSourceReturnTTTT(ret) {
  if (!Number.isFinite(ret)) return;
  sourceMarketReturns.push(ret);
  if (sourceMarketReturns.length > 500) sourceMarketReturns.shift();
}
function recordSymbolReturnTTTT(symbol, ret) {
  if (!Number.isFinite(ret)) return;
  const a = symbolReturns[symbol] ?? (symbolReturns[symbol] = []);
  a.push(ret);
  if (a.length > 200) a.shift();
}
function transferMultiplierTTTT(symbol, dir) {
  const local = symbolReturns[symbol];
  if (sourceMarketReturns.length < 30) return 1;
  const sourceMean = mean$9(sourceMarketReturns.slice(-30));
  if (!local || local.length < 20) {
    const aligned = Math.sign(sourceMean) === Math.sign(dir) && Math.sign(dir) !== 0;
    if (aligned && Math.abs(sourceMean) > 0.3) return 1.04;
    if (!aligned && Math.abs(sourceMean) > 0.5) return 0.94;
  }
  return 1;
}
const patternBank = [];
function recordPatternTemplateUUUU(features, realised) {
  if (!features.every(Number.isFinite) || !Number.isFinite(realised)) return;
  if (Math.abs(realised) < 3) return;
  patternBank.push({ vec: features.slice(), outcome: realised });
  if (patternBank.length > 100) patternBank.shift();
}
function fewShotMultiplierUUUU(features, dir) {
  if (patternBank.length < 5 || features.length === 0) return 1;
  let bestSim = -1, bestOutcome = 0;
  for (const p of patternBank) {
    if (p.vec.length !== features.length) continue;
    const sim = cosine(p.vec, features);
    if (sim > bestSim) {
      bestSim = sim;
      bestOutcome = p.outcome;
    }
  }
  if (bestSim < 0.85) return 1;
  const aligned = Math.sign(bestOutcome) === Math.sign(dir) && Math.sign(dir) !== 0;
  if (aligned) return 1.06;
  if (!aligned) return 0.9;
  return 1;
}
const winCentroid = { sum: [], count: 0 };
const lossCentroid = { sum: [], count: 0 };
function recordContrastiveVVVV(features, won) {
  if (!features.every(Number.isFinite)) return;
  const target = won ? winCentroid : lossCentroid;
  if (target.sum.length === 0) target.sum = new Array(features.length).fill(0);
  if (target.sum.length !== features.length) return;
  for (let i = 0; i < features.length; i++) target.sum[i] += features[i];
  target.count += 1;
}
function contrastiveMultiplierVVVV(features) {
  if (winCentroid.count < 10 || lossCentroid.count < 10) return 1;
  if (winCentroid.sum.length !== features.length) return 1;
  const win = winCentroid.sum.map((v) => v / winCentroid.count);
  const loss = lossCentroid.sum.map((v) => v / lossCentroid.count);
  const simWin = cosine(features, win);
  const simLoss = cosine(features, loss);
  const margin = simWin - simLoss;
  if (margin > 0.15) return 1.05;
  if (margin < -0.15) return 0.9;
  return 1;
}
const kellyHistory = [];
function recordKellyOutcomeWWWW(won, realisedPct) {
  if (!Number.isFinite(realisedPct)) return;
  kellyHistory.push({ won, pct: realisedPct });
  if (kellyHistory.length > 500) kellyHistory.shift();
}
function kellyMultiplierWWWW() {
  if (kellyHistory.length < 30) return 1;
  const wins = kellyHistory.filter((h) => h.won);
  const losses2 = kellyHistory.filter((h) => !h.won);
  if (!wins.length || !losses2.length) return 1;
  const p = wins.length / kellyHistory.length;
  const b = mean$9(wins.map((h) => Math.abs(h.pct)));
  const a = mean$9(losses2.map((h) => Math.abs(h.pct)));
  if (a === 0) return 1;
  const f = (b * p - (1 - p) * a) / (b * a);
  if (f > 0.15) return 1.06;
  if (f > 0.05) return 1.02;
  if (f < -0.05) return 0.88;
  return 1;
}
const corrReturnsByDate = {};
function recordCorrReturnXXXX(date, symbol, ret) {
  if (!Number.isFinite(ret)) return;
  const day = corrReturnsByDate[date] ?? (corrReturnsByDate[date] = {});
  day[symbol] = ret;
  const keys = Object.keys(corrReturnsByDate);
  if (keys.length > 60) delete corrReturnsByDate[keys[0]];
}
function computeAvgPairwiseCorr() {
  const dates = Object.keys(corrReturnsByDate).sort().slice(-30);
  if (dates.length < 15) return 0;
  const symbols = /* @__PURE__ */ new Set();
  for (const d of dates) for (const s of Object.keys(corrReturnsByDate[d])) symbols.add(s);
  const syms = Array.from(symbols);
  if (syms.length < 3) return 0;
  const series = {};
  for (const s of syms) series[s] = dates.map((d) => corrReturnsByDate[d][s] ?? 0);
  let total = 0, n = 0;
  for (let i = 0; i < syms.length; i++) {
    for (let j = i + 1; j < syms.length; j++) {
      const a = series[syms[i]], b = series[syms[j]];
      const ma = mean$9(a), mb = mean$9(b);
      let num = 0, da = 0, db = 0;
      for (let k = 0; k < a.length; k++) {
        num += (a[k] - ma) * (b[k] - mb);
        da += (a[k] - ma) ** 2;
        db += (b[k] - mb) ** 2;
      }
      const denom = Math.sqrt(da * db);
      if (denom > 0) {
        total += num / denom;
        n++;
      }
    }
  }
  return n > 0 ? total / n : 0;
}
function correlationRegimeMultiplierXXXX() {
  const r = computeAvgPairwiseCorr();
  if (r > 0.7) return 0.85;
  if (r > 0.55) return 0.93;
  if (r < 0.2) return 1.03;
  return 1;
}
const cvarReturns = [];
function recordReturnYYYY(ret) {
  if (!Number.isFinite(ret)) return;
  cvarReturns.push(ret);
  if (cvarReturns.length > 500) cvarReturns.shift();
}
function cvarMultiplierYYYY() {
  if (cvarReturns.length < 30) return 1;
  const sorted = [...cvarReturns].sort((a, b) => a - b);
  const cut = Math.max(1, Math.floor(sorted.length * 0.05));
  const tail = sorted.slice(0, cut);
  const cvar = mean$9(tail);
  if (cvar < -7) return 0.82;
  if (cvar < -4) return 0.92;
  if (cvar > -1.5) return 1.02;
  return 1;
}
const regimeReturns = [];
function recordRegimeReturnZZZZ(ret) {
  if (!Number.isFinite(ret)) return;
  regimeReturns.push(ret);
  if (regimeReturns.length > 200) regimeReturns.shift();
}
function detectHmmRegimeZZZZ() {
  if (regimeReturns.length < 10) return "sideways";
  const recent = regimeReturns.slice(-20);
  const m = mean$9(recent);
  const v = std$5(recent);
  if (v > 3.5 && m < -0.5) return "crash";
  if (m > 0.3 && v < 2.5) return "bull";
  if (m < -0.3 && v < 2.5) return "bear";
  return "sideways";
}
function hmmRegimeMultiplierZZZZ(dir) {
  const r = detectHmmRegimeZZZZ();
  if (r === "crash") return 0.78;
  if (r === "bear" && dir > 0) return 0.9;
  if (r === "bear" && dir < 0) return 1.04;
  if (r === "bull" && dir > 0) return 1.05;
  if (r === "bull" && dir < 0) return 0.93;
  return 1;
}
function adversarialRobustnessMultiplierAAAAA(features, scoreFn, noiseScale = 0.05) {
  if (features.length === 0) return 1;
  try {
    const base = scoreFn(features);
    const samples = [];
    for (let t = 0; t < 8; t++) {
      const perturbed = features.map((v) => v * (1 + (Math.random() - 0.5) * 2 * noiseScale));
      samples.push(scoreFn(perturbed));
    }
    const drift = std$5(samples);
    const range = Math.max(...samples) - Math.min(...samples);
    if (!Number.isFinite(base)) return 1;
    if (drift > 8 || range > 20) return 0.85;
    if (drift > 4 || range > 12) return 0.94;
    return 1;
  } catch {
    return 1;
  }
}
const cfSamples = {};
function recordCounterfactualBBBBB(featureName, value, realised) {
  if (!Number.isFinite(value) || !Number.isFinite(realised)) return;
  const a = cfSamples[featureName] ?? (cfSamples[featureName] = []);
  a.push({ feature: value, outcome: realised });
  if (a.length > 300) a.shift();
}
function counterfactualMultiplierBBBBB(featureName, actualValue, counterfactualValue, dir) {
  const arr = cfSamples[featureName];
  if (!arr || arr.length < 20) return 1;
  const xs = arr.map((s) => s.feature);
  const ys = arr.map((s) => s.outcome);
  const mx = mean$9(xs), my = mean$9(ys);
  let num = 0, den = 0;
  for (let i = 0; i < xs.length; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  if (den === 0) return 1;
  const slope = num / den;
  const delta = (actualValue - counterfactualValue) * slope;
  const aligned = Math.sign(delta) === Math.sign(dir) && Math.sign(dir) !== 0;
  if (aligned && Math.abs(delta) > 0.5) return 1.03;
  if (!aligned && Math.abs(delta) > 1) return 0.95;
  return 1;
}
const stackHits = {};
function recordStackOutcomeCCCCC(regime, tier, won) {
  const k = `${regime}|${tier}`;
  const s = stackHits[k] ?? (stackHits[k] = { hits: 0, total: 0 });
  if (won) s.hits++;
  s.total++;
}
function stackWeightCCCCC(regime, tier) {
  const s = stackHits[`${regime}|${tier}`];
  if (!s || s.total < 8) return 1;
  const rate = s.hits / s.total;
  if (rate > 0.65) return 1.05;
  if (rate > 0.55) return 1.02;
  if (rate < 0.35) return 0.9;
  if (rate < 0.45) return 0.96;
  return 1;
}
function stackMultiplierCCCCC(regime, activeTiers) {
  if (!activeTiers.length) return 1;
  let prod = 1;
  for (const t of activeTiers) prod *= stackWeightCCCCC(regime, t);
  return clamp$7(prod, 0.8, 1.15);
}
const bmaLogLik = {};
const bmaCount = {};
function recordBMAOutcomeDDDDD(model, prediction, realised) {
  if (!Number.isFinite(prediction) || !Number.isFinite(realised)) return;
  const err = realised - prediction;
  const ll = -0.5 * (err * err) / 4 - Math.log(Math.sqrt(2 * Math.PI * 4));
  bmaLogLik[model] = (bmaLogLik[model] ?? 0) + ll;
  bmaCount[model] = (bmaCount[model] ?? 0) + 1;
}
function bmaWeightsDDDDD(models) {
  const eligible = models.filter((m) => (bmaCount[m] ?? 0) >= 5);
  if (eligible.length === 0) {
    const uniform = {};
    for (const m of models) uniform[m] = 1 / Math.max(1, models.length);
    return uniform;
  }
  const avgLL = {};
  for (const m of eligible) avgLL[m] = bmaLogLik[m] / bmaCount[m];
  const maxLL = Math.max(...Object.values(avgLL));
  const exps = {};
  let sum = 0;
  for (const m of eligible) {
    exps[m] = Math.exp(avgLL[m] - maxLL);
    sum += exps[m];
  }
  const out = {};
  for (const m of models) out[m] = sum > 0 && exps[m] !== void 0 ? exps[m] / sum : 0;
  return out;
}
function bmaMultiplierDDDDD(predictions, dir) {
  const models = Object.keys(predictions);
  if (models.length < 2) return 1;
  const w = bmaWeightsDDDDD(models);
  let combined = 0;
  for (const m of models) combined += (w[m] ?? 0) * predictions[m];
  const aligned = Math.sign(combined) === Math.sign(dir) && Math.sign(dir) !== 0;
  if (aligned && Math.abs(combined) > 1) return 1.04;
  if (!aligned && Math.abs(combined) > 1.5) return 0.94;
  return 1;
}
function snapshotTierSSSSDDDDDState() {
  return {
    sgdWeights,
    sgdBias,
    sourceMarketReturns: sourceMarketReturns.slice(-500),
    symbolReturns,
    patternBank: patternBank.slice(-100),
    winCentroid,
    lossCentroid,
    kellyHistory: kellyHistory.slice(-500),
    corrReturnsByDate,
    cvarReturns: cvarReturns.slice(-500),
    regimeReturns: regimeReturns.slice(-200),
    cfSamples,
    stackHits,
    bmaLogLik,
    bmaCount
  };
}
function restoreTierSSSSDDDDDState(s) {
  try {
    const d = s;
    if (d.sgdWeights) Object.assign(sgdWeights, d.sgdWeights);
    if (typeof d.sgdBias === "number") sgdBias = d.sgdBias;
    if (Array.isArray(d.sourceMarketReturns)) {
      sourceMarketReturns.length = 0;
      sourceMarketReturns.push(...d.sourceMarketReturns);
    }
    if (d.symbolReturns) Object.assign(symbolReturns, d.symbolReturns);
    if (Array.isArray(d.patternBank)) {
      patternBank.length = 0;
      patternBank.push(...d.patternBank);
    }
    if (d.winCentroid) {
      winCentroid.sum = d.winCentroid.sum ?? [];
      winCentroid.count = d.winCentroid.count ?? 0;
    }
    if (d.lossCentroid) {
      lossCentroid.sum = d.lossCentroid.sum ?? [];
      lossCentroid.count = d.lossCentroid.count ?? 0;
    }
    if (Array.isArray(d.kellyHistory)) {
      kellyHistory.length = 0;
      kellyHistory.push(...d.kellyHistory);
    }
    if (d.corrReturnsByDate) Object.assign(corrReturnsByDate, d.corrReturnsByDate);
    if (Array.isArray(d.cvarReturns)) {
      cvarReturns.length = 0;
      cvarReturns.push(...d.cvarReturns);
    }
    if (Array.isArray(d.regimeReturns)) {
      regimeReturns.length = 0;
      regimeReturns.push(...d.regimeReturns);
    }
    if (d.cfSamples) Object.assign(cfSamples, d.cfSamples);
    if (d.stackHits) Object.assign(stackHits, d.stackHits);
    if (d.bmaLogLik) Object.assign(bmaLogLik, d.bmaLogLik);
    if (d.bmaCount) Object.assign(bmaCount, d.bmaCount);
  } catch {
  }
}
const mean$8 = (a) => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
const variance$6 = (a) => {
  if (a.length < 2) return 0;
  const m = mean$8(a);
  return a.reduce((s, v) => s + (v - m) * (v - m), 0) / (a.length - 1);
};
const std$4 = (a) => Math.sqrt(variance$6(a));
const tftBank = {};
function recordTFTSampleEEEEE(symbol, s) {
  if (![s.short, s.medium, s.long, s.futureEvent, s.outcome].every(Number.isFinite)) return;
  const a = tftBank[symbol] ?? (tftBank[symbol] = []);
  a.push(s);
  if (a.length > 200) a.shift();
}
function tftMultiplierEEEEE(symbol, shortNow, mediumNow, longNow, futureEvent, dir) {
  const arr = tftBank[symbol];
  if (!arr || arr.length < 20) return 1;
  const score = 0.5 * shortNow + 0.3 * mediumNow + 0.15 * longNow + 0.05 * futureEvent;
  const hist = mean$8(arr.map((s) => 0.5 * s.short + 0.3 * s.medium + 0.15 * s.long + 0.05 * s.futureEvent));
  const z = (score - hist) / Math.max(0.5, std$4(arr.map((s) => s.outcome)));
  const aligned = Math.sign(z) === Math.sign(dir) && Math.sign(dir) !== 0;
  if (aligned && Math.abs(z) > 0.7) return 1.06;
  if (!aligned && Math.abs(z) > 0.9) return 0.93;
  return 1;
}
const hawkesEvents$2 = {};
function recordHawkesEventFFFFF(symbol, ts) {
  if (!Number.isFinite(ts)) return;
  const a = hawkesEvents$2[symbol] ?? (hawkesEvents$2[symbol] = []);
  a.push(ts);
  const cutoff = ts - 6 * 3600;
  while (a.length && a[0] < cutoff) a.shift();
  if (a.length > 500) a.shift();
}
function hawkesIntensityFFFFF(symbol, now) {
  const a = hawkesEvents$2[symbol];
  if (!a || a.length === 0) return 0;
  let lambda = 0;
  for (const t of a) lambda += Math.exp(-0.0016666666666666668 * Math.max(0, now - t));
  return lambda;
}
function hawkesMultiplierFFFFF(symbol, now, dir) {
  const lambda = hawkesIntensityFFFFF(symbol, now);
  if (lambda > 15 && dir > 0) return 1.05;
  if (lambda > 25) return 0.92;
  return 1;
}
function wavenetMultiplierGGGGG(series, dir) {
  if (series.length < 32) return 1;
  const last = series.slice(-64);
  const taps = [1, 2, 4, 8, 16];
  let agg = 0, w = 0;
  for (const d of taps) {
    const sample = [];
    for (let i = last.length - 1; i >= 0; i -= d) sample.push(last[i]);
    if (sample.length >= 3) {
      const slope = (sample[0] - sample[sample.length - 1]) / sample.length;
      agg += slope / d;
      w += 1 / d;
    }
  }
  if (w === 0) return 1;
  const trend = agg / w;
  const aligned = Math.sign(trend) === Math.sign(dir) && Math.sign(dir) !== 0;
  if (aligned && Math.abs(trend) > 0.1) return 1.04;
  if (!aligned && Math.abs(trend) > 0.15) return 0.94;
  return 1;
}
function nbeatsDecomposeHHHHH(series) {
  if (series.length < 10) return { trend: 0, seasonality: 0, residual: 0 };
  const n = series.length;
  let sx = 0, sy = 0, sxy = 0, sxx = 0;
  for (let i = 0; i < n; i++) {
    sx += i;
    sy += series[i];
    sxy += i * series[i];
    sxx += i * i;
  }
  const slope = (n * sxy - sx * sy) / Math.max(1e-9, n * sxx - sx * sx);
  const intercept2 = (sy - slope * sx) / n;
  const detrended = series.map((v, i) => v - (intercept2 + slope * i));
  const period = 5;
  const buckets2 = Array.from({ length: period }, () => []);
  detrended.forEach((v, i) => buckets2[i % period].push(v));
  const seasonalAvg = buckets2.map((b) => mean$8(b));
  const seasonality = seasonalAvg[(n - 1) % period] ?? 0;
  const residual = detrended[n - 1] - seasonality;
  return { trend: slope, seasonality, residual };
}
function nbeatsMultiplierHHHHH(series, dir) {
  const { trend, seasonality } = nbeatsDecomposeHHHHH(series);
  const signal = trend * 5 + seasonality * 0.3;
  const aligned = Math.sign(signal) === Math.sign(dir) && Math.sign(dir) !== 0;
  if (aligned && Math.abs(signal) > 0.2) return 1.05;
  if (!aligned && Math.abs(signal) > 0.4) return 0.93;
  return 1;
}
const quoteRates = {};
function quoteStuffingMultiplierIIIII(symbol) {
  const a = quoteRates[symbol];
  if (!a || a.length < 20) return 1;
  const baseline = mean$8(a.slice(0, -5));
  const recent = mean$8(a.slice(-5));
  if (baseline === 0) return 1;
  const ratio = recent / baseline;
  if (ratio > 5) return 0.88;
  if (ratio > 3) return 0.95;
  return 1;
}
const spoofLog = {};
function spoofingMultiplierJJJJJ(symbol, dir) {
  const a = spoofLog[symbol];
  if (!a || a.length < 20) return 1;
  const recent = a.slice(-50);
  const bigCancelled = recent.filter((e) => e.cancelled && e.size > 1e4);
  if (bigCancelled.length < 3) return 1;
  const bidSpoof = bigCancelled.filter((e) => e.side === "bid").length;
  const askSpoof = bigCancelled.filter((e) => e.side === "ask").length;
  const spoofDir = askSpoof > bidSpoof ? 1 : bidSpoof > askSpoof ? -1 : 0;
  if (spoofDir === 0) return 1;
  const aligned = spoofDir === Math.sign(dir);
  if (aligned) return 1.05;
  return 0.9;
}
const tradeSizes = {};
function recordTradeSizeKKKKK(symbol, size) {
  if (!Number.isFinite(size) || size <= 0) return;
  const a = tradeSizes[symbol] ?? (tradeSizes[symbol] = []);
  a.push(size);
  if (a.length > 1e3) a.shift();
}
function tradeSizeMixKKKKK(symbol) {
  const a = tradeSizes[symbol];
  if (!a || a.length < 30) return { retail: 0.5, institutional: 0.5 };
  const retail = a.filter((s) => s < 500 || s % 100 === 0).length;
  const inst = a.filter((s) => s >= 5e3 && s % 100 !== 0).length;
  const total = Math.max(1, retail + inst);
  return { retail: retail / total, institutional: inst / total };
}
function tradeSizeMultiplierKKKKK(symbol, dir) {
  const { institutional } = tradeSizeMixKKKKK(symbol);
  if (institutional > 0.6 && Math.abs(dir) > 0.1) return 1.04;
  if (institutional < 0.2) return 0.97;
  return 1;
}
const spreadSamples = {};
function recordSpreadSampleLLLLL(symbol, spread, priceChangeAfter) {
  if (!Number.isFinite(spread) || !Number.isFinite(priceChangeAfter)) return;
  const a = spreadSamples[symbol] ?? (spreadSamples[symbol] = []);
  a.push({ spread, priceChange: priceChangeAfter });
  if (a.length > 200) a.shift();
}
function effectiveSpreadMultiplierLLLLL(symbol) {
  const a = spreadSamples[symbol];
  if (!a || a.length < 30) return 1;
  const avgSpread = mean$8(a.map((s) => s.spread));
  const adverseShare = mean$8(a.map((s) => Math.abs(s.priceChange))) / Math.max(0.01, avgSpread);
  if (adverseShare > 0.7) return 0.9;
  if (adverseShare < 0.2) return 1.03;
  return 1;
}
const nasBySymbol = {};
function recordNASOutcomeMMMMM(symbol, activeFeatures, won) {
  const subset = [...activeFeatures].sort().slice(0, 6).join("|");
  const sym = nasBySymbol[symbol] ?? (nasBySymbol[symbol] = {});
  const r = sym[subset] ?? (sym[subset] = { subset, hits: 0, total: 0 });
  if (won) r.hits++;
  r.total++;
}
function nasBestSubsetMMMMM(symbol) {
  const sym = nasBySymbol[symbol];
  if (!sym) return null;
  let best = null;
  for (const r of Object.values(sym)) {
    if (r.total < 5) continue;
    const rate = r.hits / r.total;
    if (!best || rate > best.rate) best = { subset: r.subset, rate };
  }
  return best;
}
function nasMultiplierMMMMM(symbol, activeFeatures) {
  const best = nasBestSubsetMMMMM(symbol);
  if (!best || best.rate < 0.55) return 1;
  const current = [...activeFeatures].sort().slice(0, 6).join("|");
  if (current === best.subset) return 1.04;
  const setBest = new Set(best.subset.split("|"));
  const overlap = activeFeatures.filter((f) => setBest.has(f)).length;
  if (overlap >= 4) return 1.02;
  return 0.98;
}
const checkpoints = [];
let currentPerf = 0;
function recordCheckpointNNNNN(weights, perf) {
  if (!Number.isFinite(perf)) return;
  checkpoints.push({ ts: Date.now(), weights: { ...weights }, perf });
  if (checkpoints.length > 30) checkpoints.shift();
}
function updateCurrentPerfNNNNN(perf) {
  if (Number.isFinite(perf)) currentPerf = perf;
}
function bestCheckpointNNNNN() {
  if (!checkpoints.length) return null;
  return checkpoints.reduce((best, c) => c.perf > best.perf ? c : best, checkpoints[0]);
}
function checkpointReplayMultiplierNNNNN() {
  const best = bestCheckpointNNNNN();
  if (!best || checkpoints.length < 5) return 1;
  if (currentPerf < best.perf * 0.75) return 0.88;
  if (currentPerf < best.perf * 0.9) return 0.95;
  if (currentPerf > best.perf * 1.05) return 1.03;
  return 1;
}
const mtBank = [];
function recordMultiTaskOOOOO(s) {
  if (![s.price, s.volume, s.vol, s.direction].every(Number.isFinite)) return;
  mtBank.push(s);
  if (mtBank.length > 500) mtBank.shift();
}
function multiTaskMultiplierOOOOO(curPrice, curVolume, curVol, dir) {
  if (mtBank.length < 30) return 1;
  const recent = mtBank.slice(-50);
  const priceCorr = recent.filter((s) => Math.sign(s.price) === Math.sign(dir)).length / recent.length;
  const volCorr = recent.filter((s) => Math.sign(s.volume) === Math.sign(dir)).length / recent.length;
  const volaCorr = recent.filter((s) => Math.sign(s.vol) === Math.sign(dir)).length / recent.length;
  const agreement = (priceCorr + volCorr + volaCorr) / 3;
  if (agreement > 0.7) return 1.05;
  if (agreement < 0.3) return 0.92;
  return 1;
}
const selfPlayLog = [];
const strategyExploits = {};
function recordSelfPlayPPPPP(strategy, reward) {
  if (!Number.isFinite(reward)) return;
  selfPlayLog.push({ strategy, reward });
  if (selfPlayLog.length > 500) selfPlayLog.shift();
  if (reward < -2) strategyExploits[strategy] = (strategyExploits[strategy] ?? 0) + 1;
}
function selfPlayMultiplierPPPPP(activeStrategy) {
  const exploits = strategyExploits[activeStrategy] ?? 0;
  const recent = selfPlayLog.filter((s) => s.strategy === activeStrategy).slice(-30);
  if (recent.length < 10) return 1;
  const avg = mean$8(recent.map((s) => s.reward));
  if (exploits > 5 && avg < 0) return 0.85;
  if (avg > 1.5 && exploits < 2) return 1.06;
  if (avg < -1) return 0.92;
  return 1;
}
function snapshotTierEEEEEPPPPPState() {
  return {
    tftBank,
    hawkesEvents: hawkesEvents$2,
    quoteRates,
    spoofLog,
    tradeSizes,
    spreadSamples,
    nasBySymbol,
    checkpoints: checkpoints.slice(-30),
    currentPerf,
    mtBank: mtBank.slice(-500),
    selfPlayLog: selfPlayLog.slice(-500),
    strategyExploits
  };
}
function restoreTierEEEEEPPPPPState(s) {
  try {
    const d = s;
    if (d.tftBank) Object.assign(tftBank, d.tftBank);
    if (d.hawkesEvents) Object.assign(hawkesEvents$2, d.hawkesEvents);
    if (d.quoteRates) Object.assign(quoteRates, d.quoteRates);
    if (d.spoofLog) Object.assign(spoofLog, d.spoofLog);
    if (d.tradeSizes) Object.assign(tradeSizes, d.tradeSizes);
    if (d.spreadSamples) Object.assign(spreadSamples, d.spreadSamples);
    if (d.nasBySymbol) Object.assign(nasBySymbol, d.nasBySymbol);
    if (Array.isArray(d.checkpoints)) {
      checkpoints.length = 0;
      checkpoints.push(...d.checkpoints);
    }
    if (typeof d.currentPerf === "number") currentPerf = d.currentPerf;
    if (Array.isArray(d.mtBank)) {
      mtBank.length = 0;
      mtBank.push(...d.mtBank);
    }
    if (Array.isArray(d.selfPlayLog)) {
      selfPlayLog.length = 0;
      selfPlayLog.push(...d.selfPlayLog);
    }
    if (d.strategyExploits) Object.assign(strategyExploits, d.strategyExploits);
  } catch {
  }
}
const clamp$6 = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const mean$7 = (a) => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
const variance$5 = (a) => {
  if (a.length < 2) return 0;
  const m = mean$7(a);
  return a.reduce((s, v) => s + (v - m) * (v - m), 0) / (a.length - 1);
};
const miSamples = {};
function recordMISampleQQQQQ(feature, value, outcome) {
  if (!Number.isFinite(value) || !Number.isFinite(outcome)) return;
  const a = miSamples[feature] ?? (miSamples[feature] = []);
  a.push({ feat: value, out: outcome });
  if (a.length > 500) a.shift();
}
function discretize(vals, bins = 5) {
  if (vals.length === 0) return [];
  const sorted = [...vals].sort((a, b) => a - b);
  const thresholds = [];
  for (let i = 1; i < bins; i++) thresholds.push(sorted[Math.floor(i / bins * sorted.length)]);
  return vals.map((v) => thresholds.filter((t) => v > t).length);
}
function mutualInfoQQQQQ(feature) {
  const arr = miSamples[feature];
  if (!arr || arr.length < 30) return 0;
  const X = discretize(arr.map((s) => s.feat));
  const Y = discretize(arr.map((s) => s.out));
  const n = X.length;
  const px = {}, py = {}, pxy = {};
  for (let i = 0; i < n; i++) {
    px[X[i]] = (px[X[i]] ?? 0) + 1;
    py[Y[i]] = (py[Y[i]] ?? 0) + 1;
    pxy[`${X[i]},${Y[i]}`] = (pxy[`${X[i]},${Y[i]}`] ?? 0) + 1;
  }
  let mi = 0;
  for (const k of Object.keys(pxy)) {
    const [x, y] = k.split(",").map(Number);
    const pXY = pxy[k] / n, pX = px[x] / n, pY = py[y] / n;
    if (pXY > 0 && pX > 0 && pY > 0) mi += pXY * Math.log2(pXY / (pX * pY));
  }
  return mi;
}
function miMultiplierQQQQQ(features) {
  if (features.length === 0) return 1;
  const scores2 = features.map(mutualInfoQQQQQ).filter((s) => s > 0);
  if (scores2.length < 3) return 1;
  const avg = mean$7(scores2);
  if (avg > 0.3) return 1.04;
  if (avg < 0.05) return 0.95;
  return 1;
}
const teSeries = {};
function recordTESeriesRRRRR(symbol, ret) {
  if (!Number.isFinite(ret)) return;
  const a = teSeries[symbol] ?? (teSeries[symbol] = []);
  a.push(ret);
  if (a.length > 200) a.shift();
}
function transferEntropyRRRRR(source, target) {
  const X = teSeries[source], Y = teSeries[target];
  if (!X || !Y || X.length < 30 || Y.length < 30) return 0;
  const n = Math.min(X.length, Y.length) - 1;
  const Xs = discretize(X.slice(-n - 1, -1), 3);
  const Ys = discretize(Y.slice(-n - 1, -1), 3);
  const Yf = discretize(Y.slice(-n), 3);
  let te2 = 0;
  for (let i = 0; i < n; i++) {
    const denom = Ys.filter((_, j) => Ys[j] === Ys[i]).length;
    const num = Ys.filter((_, j) => Ys[j] === Ys[i] && Xs[j] === Xs[i] && Yf[j] === Yf[i]).length;
    if (denom > 0 && num > 0) te2 += Math.log2(num / denom || 1) / n;
  }
  return Math.abs(te2);
}
function transferEntropyMultiplierRRRRR(leader, target, leaderDir, dir) {
  const te2 = transferEntropyRRRRR(leader, target);
  if (te2 < 0.05) return 1;
  const aligned = Math.sign(leaderDir) === Math.sign(dir) && Math.sign(dir) !== 0;
  if (aligned && te2 > 0.15) return 1.05;
  if (!aligned && te2 > 0.2) return 0.93;
  return 1;
}
function snrSSSSS(series) {
  if (series.length < 10) return 1;
  const sig = [];
  for (let i = 1; i < series.length - 1; i++) sig.push((series[i - 1] + series[i] + series[i + 1]) / 3);
  const noise = sig.map((s, i) => series[i + 1] - s);
  const sigPow = variance$5(sig);
  const noisePow = variance$5(noise);
  if (noisePow === 0) return 10;
  return sigPow / noisePow;
}
function snrMultiplierSSSSS(series) {
  const snr = snrSSSSS(series);
  if (snr > 3) return 1.04;
  if (snr < 0.5) return 0.92;
  return 1;
}
function complexityTTTTT(series) {
  if (series.length < 10) return 1;
  const signs = series.slice(1).map((v, i2) => v > series[i2] ? "1" : "0").join("");
  const dict = /* @__PURE__ */ new Set();
  let i = 0, w = "";
  while (i < signs.length) {
    w += signs[i];
    if (!dict.has(w)) {
      dict.add(w);
      w = "";
    }
    i++;
  }
  return dict.size / signs.length;
}
function complexityMultiplierTTTTT(series) {
  const c = complexityTTTTT(series);
  if (c < 0.3) return 1.05;
  if (c > 0.7) return 0.93;
  return 1;
}
const LOSS_AVERSION = 2.25;
function prospectMultiplierUUUUU(recentReturns, dir) {
  if (recentReturns.length < 10) return 1;
  const last5 = recentReturns.slice(-5);
  const losses2 = last5.filter((r) => r < 0);
  const gains = last5.filter((r) => r > 0);
  const lossWeight = losses2.reduce((s, r) => s + Math.abs(r) * LOSS_AVERSION, 0);
  const gainWeight = gains.reduce((s, r) => s + r, 0);
  if (lossWeight > gainWeight * 3 && dir > 0) return 1.05;
  if (gainWeight > lossWeight * 2 && dir < 0) return 1.03;
  return 1;
}
const herdingDaily = {};
function recordHerdingVVVVV(date, symbol, ret) {
  if (!Number.isFinite(ret)) return;
  const a = herdingDaily[date] ?? (herdingDaily[date] = []);
  a.push({ symbol, ret });
  const keys = Object.keys(herdingDaily);
  if (keys.length > 40) delete herdingDaily[keys[0]];
}
function herdingMultiplierVVVVV() {
  const dates = Object.keys(herdingDaily).sort().slice(-20);
  if (dates.length < 10) return 1;
  const csads = dates.map((d) => {
    const rs = herdingDaily[d].map((x) => x.ret);
    const m = mean$7(rs);
    return mean$7(rs.map((r) => Math.abs(r - m)));
  });
  const recent = mean$7(csads.slice(-3));
  const baseline = mean$7(csads.slice(0, -3));
  if (baseline === 0) return 1;
  if (recent < baseline * 0.6) return 0.93;
  if (recent > baseline * 1.5) return 1.02;
  return 1;
}
function anchoringMultiplierWWWWW(price, high52w, low52w, dir) {
  if (!Number.isFinite(price) || high52w <= low52w) return 1;
  const range = high52w - low52w;
  const pctFromHigh = (high52w - price) / range;
  const pctFromLow = (price - low52w) / range;
  if (pctFromHigh < 0.03 && dir > 0) return 0.92;
  if (pctFromLow < 0.03 && dir < 0) return 0.92;
  if (pctFromLow < 0.05 && dir > 0) return 1.04;
  if (pctFromHigh < 0.05 && dir < 0) return 1.04;
  return 1;
}
const dispositionStats = {};
function recordDispositionXXXXX(symbol, won, sold) {
  const s = dispositionStats[symbol] ?? (dispositionStats[symbol] = { winSells: 0, lossSells: 0, winHolds: 0, lossHolds: 0 });
  if (won && sold) s.winSells++;
  else if (!won && sold) s.lossSells++;
  else s.lossHolds++;
}
function dispositionMultiplierXXXXX(symbol, dir) {
  const s = dispositionStats[symbol];
  if (!s) return 1;
  const total = s.winSells + s.lossSells + s.winHolds + s.lossHolds;
  if (total < 10) return 1;
  const pgr = s.winSells / Math.max(1, s.winSells + s.winHolds);
  const plr = s.lossSells / Math.max(1, s.lossSells + s.lossHolds);
  if (pgr - plr > 0.3 && dir > 0) return 0.95;
  if (pgr - plr > 0.3 && dir < 0) return 1.03;
  return 1;
}
const shadowResults = [];
function recordShadowYYYYY(primaryPred, shadowPred, realised) {
  if (![primaryPred, shadowPred, realised].every(Number.isFinite)) return;
  shadowResults.push({ primary: primaryPred, shadow: shadowPred, outcome: realised });
  if (shadowResults.length > 300) shadowResults.shift();
}
function shadowMultiplierYYYYY() {
  if (shadowResults.length < 30) return 1;
  const recent = shadowResults.slice(-50);
  const primaryErr = mean$7(recent.map((r) => (r.primary - r.outcome) ** 2));
  const shadowErr = mean$7(recent.map((r) => (r.shadow - r.outcome) ** 2));
  if (primaryErr === 0) return 1;
  if (shadowErr < primaryErr * 0.7) return 0.88;
  if (shadowErr < primaryErr * 0.85) return 0.95;
  return 1;
}
function latencyMultiplierZZZZZ(dataTimestamp, nowMs = Date.now()) {
  const ageMin = (nowMs - dataTimestamp) / 6e4;
  if (!Number.isFinite(ageMin) || ageMin < 0) return 1;
  if (ageMin < 5) return 1;
  if (ageMin < 15) return 0.98;
  if (ageMin < 60) return 0.93;
  if (ageMin < 240) return 0.85;
  return 0.75;
}
const dailyPnl = [];
let circuitOpen$1 = false;
let circuitOpenedAt$1 = 0;
function recordDailyPnlAAAAAA(day, pnl) {
  if (!Number.isFinite(pnl)) return;
  const existing = dailyPnl.find((d) => d.day === day);
  if (existing) existing.pnl = pnl;
  else dailyPnl.push({ day, pnl });
  if (dailyPnl.length > 30) dailyPnl.shift();
}
function checkCircuitBreakerAAAAAA() {
  if (circuitOpen$1) {
    if (Date.now() - circuitOpenedAt$1 > 864e5) circuitOpen$1 = false;
  }
  if (dailyPnl.length === 0) return circuitOpen$1;
  const today = dailyPnl[dailyPnl.length - 1];
  const last7 = dailyPnl.slice(-7).reduce((s, d) => s + d.pnl, 0);
  if (today.pnl < -5 || last7 < -12) {
    if (!circuitOpen$1) {
      circuitOpen$1 = true;
      circuitOpenedAt$1 = Date.now();
    }
  }
  return circuitOpen$1;
}
function circuitBreakerMultiplierAAAAAA() {
  return checkCircuitBreakerAAAAAA() ? 0.6 : 1;
}
const plattData = [];
let plattA = -1, plattB = 0;
function recordPlattBBBBBB(score, won) {
  if (!Number.isFinite(score)) return;
  plattData.push({ score, won });
  if (plattData.length > 1e3) plattData.shift();
  if (plattData.length % 50 === 0) fitPlattBBBBBB();
}
function fitPlattBBBBBB() {
  if (plattData.length < 50) return;
  let a = plattA, b = plattB;
  const lr = 1e-3;
  for (let iter = 0; iter < 100; iter++) {
    let gA = 0, gB = 0;
    for (const d of plattData) {
      const p = 1 / (1 + Math.exp(a * d.score + b));
      const y = d.won ? 1 : 0;
      const err = p - y;
      gA += err * d.score;
      gB += err;
    }
    a -= lr * gA / plattData.length;
    b -= lr * gB / plattData.length;
  }
  plattA = a;
  plattB = b;
}
function calibrateConfidenceBBBBBB(rawScore) {
  if (plattData.length < 50) return rawScore;
  const z = plattA * rawScore + plattB;
  const p = 1 / (1 + Math.exp(z));
  return clamp$6(p * 100, 0, 100);
}
function plattMultiplierBBBBBB(rawScore) {
  if (plattData.length < 50) return 1;
  const calibrated = calibrateConfidenceBBBBBB(rawScore);
  const ratio = calibrated / Math.max(1, rawScore);
  if (ratio < 0.85) return 0.94;
  if (ratio > 1.15) return 1.03;
  return 1;
}
function snapshotTierQQQQQBBBBBBState() {
  return {
    miSamples,
    teSeries,
    herdingDaily,
    dispositionStats,
    shadowResults: shadowResults.slice(-300),
    dailyPnl: dailyPnl.slice(-30),
    circuitOpen: circuitOpen$1,
    circuitOpenedAt: circuitOpenedAt$1,
    plattData: plattData.slice(-1e3),
    plattA,
    plattB
  };
}
function restoreTierQQQQQBBBBBBState(s) {
  try {
    const d = s;
    if (d.miSamples) Object.assign(miSamples, d.miSamples);
    if (d.teSeries) Object.assign(teSeries, d.teSeries);
    if (d.herdingDaily) Object.assign(herdingDaily, d.herdingDaily);
    if (d.dispositionStats) Object.assign(dispositionStats, d.dispositionStats);
    if (Array.isArray(d.shadowResults)) {
      shadowResults.length = 0;
      shadowResults.push(...d.shadowResults);
    }
    if (Array.isArray(d.dailyPnl)) {
      dailyPnl.length = 0;
      dailyPnl.push(...d.dailyPnl);
    }
    if (typeof d.circuitOpen === "boolean") circuitOpen$1 = d.circuitOpen;
    if (typeof d.circuitOpenedAt === "number") circuitOpenedAt$1 = d.circuitOpenedAt;
    if (Array.isArray(d.plattData)) {
      plattData.length = 0;
      plattData.push(...d.plattData);
    }
    if (typeof d.plattA === "number") plattA = d.plattA;
    if (typeof d.plattB === "number") plattB = d.plattB;
  } catch {
  }
}
const clamp$5 = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const mean$6 = (a) => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
const variance$4 = (a) => {
  if (a.length < 2) return 0;
  const m = mean$6(a);
  return a.reduce((s, v) => s + (v - m) * (v - m), 0) / (a.length - 1);
};
const std$3 = (a) => Math.sqrt(variance$4(a));
const bmaEvidence = {};
function recordBMASampleCCCCCC(model, pred, outcome) {
  if (!Number.isFinite(pred) || !Number.isFinite(outcome)) return;
  const a = bmaEvidence[model] ?? (bmaEvidence[model] = []);
  a.push({ pred, outcome });
  if (a.length > 200) a.shift();
}
function bmaWeightsCCCCCC(models) {
  const liks = {};
  for (const m of models) {
    const arr = bmaEvidence[m];
    if (!arr || arr.length < 10) {
      liks[m] = 1;
      continue;
    }
    const mse = mean$6(arr.map((s) => (s.pred - s.outcome) ** 2));
    liks[m] = Math.exp(-mse * 4);
  }
  const sum = Object.values(liks).reduce((a, b) => a + b, 0);
  if (sum === 0) return Object.fromEntries(models.map((m) => [m, 1 / models.length]));
  return Object.fromEntries(Object.entries(liks).map(([k, v]) => [k, v / sum]));
}
function bmaMultiplierCCCCCC(models) {
  const w = bmaWeightsCCCCCC(models);
  const vals = Object.values(w);
  if (vals.length < 2) return 1;
  const ent = -vals.reduce((s, p) => s + (p > 0 ? p * Math.log(p) : 0), 0);
  const maxEnt = Math.log(vals.length);
  const normEnt = ent / maxEnt;
  if (normEnt < 0.5) return 1.04;
  if (normEnt > 0.95) return 0.96;
  return 1;
}
const stackData = [];
let stackW = [];
let stackB = 0;
function recordStackedDDDDDD(featuresVec, won) {
  if (!featuresVec.every(Number.isFinite)) return;
  stackData.push({ features: featuresVec.slice(), won });
  if (stackData.length > 1e3) stackData.shift();
  if (stackData.length % 50 === 0) fitStackedDDDDDD();
}
function fitStackedDDDDDD() {
  if (stackData.length < 50) return;
  const dim = stackData[0].features.length;
  if (stackW.length !== dim) stackW = new Array(dim).fill(0);
  const lr = 0.01;
  for (let iter = 0; iter < 80; iter++) {
    const gW = new Array(dim).fill(0);
    let gB = 0;
    for (const d of stackData) {
      let z = stackB;
      for (let i = 0; i < dim; i++) z += stackW[i] * d.features[i];
      const p = 1 / (1 + Math.exp(-z));
      const err = p - (d.won ? 1 : 0);
      for (let i = 0; i < dim; i++) gW[i] += err * d.features[i];
      gB += err;
    }
    for (let i = 0; i < dim; i++) stackW[i] -= lr * gW[i] / stackData.length;
    stackB -= lr * gB / stackData.length;
  }
}
function stackedMultiplierDDDDDD(featuresVec) {
  if (stackData.length < 50 || stackW.length !== featuresVec.length) return 1;
  let z = stackB;
  for (let i = 0; i < featuresVec.length; i++) z += stackW[i] * featuresVec[i];
  const p = 1 / (1 + Math.exp(-z));
  if (p > 0.65) return 1.06;
  if (p > 0.55) return 1.02;
  if (p < 0.35) return 0.92;
  if (p < 0.45) return 0.97;
  return 1;
}
const qrfReturns = {};
function recordReturnEEEEEE(symbol, ret) {
  if (!Number.isFinite(ret)) return;
  const a = qrfReturns[symbol] ?? (qrfReturns[symbol] = []);
  a.push(ret);
  if (a.length > 250) a.shift();
}
function quantilesEEEEEE(symbol) {
  const arr = qrfReturns[symbol];
  if (!arr || arr.length < 30) return null;
  const s = [...arr].sort((a, b) => a - b);
  const q = (p) => s[Math.floor(p * s.length)];
  return { p10: q(0.1), p50: q(0.5), p90: q(0.9) };
}
function quantileMultiplierEEEEEE(symbol, dir) {
  const q = quantilesEEEEEE(symbol);
  if (!q) return 1;
  const skew = q.p90 - q.p50 - (q.p50 - q.p10);
  if (skew > 0.01 && dir > 0) return 1.04;
  if (skew < -0.01 && dir < 0) return 1.04;
  if (skew > 0.01 && dir < 0) return 0.95;
  if (skew < -0.01 && dir > 0) return 0.95;
  return 1;
}
const foldOutcomes = [];
function recordFoldFFFFFF(fold, pred, outcome, time = Date.now()) {
  if (![pred, outcome].every(Number.isFinite)) return;
  foldOutcomes.push({ fold, pred, outcome, time });
  if (foldOutcomes.length > 1e3) foldOutcomes.shift();
}
function leakageScoreFFFFFF() {
  if (foldOutcomes.length < 50) return 0;
  const folds = new Set(foldOutcomes.map((f) => f.fold));
  const perFoldAcc = [];
  for (const f of folds) {
    const sub = foldOutcomes.filter((x) => x.fold === f);
    const acc = sub.filter((x) => Math.sign(x.pred) === Math.sign(x.outcome)).length / sub.length;
    perFoldAcc.push(acc);
  }
  const v = variance$4(perFoldAcc);
  const m = mean$6(perFoldAcc);
  if (m > 0.7 && v < 5e-3) return 1;
  return 0;
}
function leakageMultiplierFFFFFF() {
  return leakageScoreFFFFFF() > 0.5 ? 0.9 : 1;
}
const vpinBuckets = {};
function recordVPINBucketGGGGGG(symbol, buyVol, sellVol) {
  if (!Number.isFinite(buyVol) || !Number.isFinite(sellVol)) return;
  const a = vpinBuckets[symbol] ?? (vpinBuckets[symbol] = []);
  a.push({ buy: buyVol, sell: sellVol });
  if (a.length > 50) a.shift();
}
function vpinV2GGGGGG(symbol) {
  const a = vpinBuckets[symbol];
  if (!a || a.length < 10) return 0;
  const recent = a.slice(-20);
  return mean$6(recent.map((b) => Math.abs(b.buy - b.sell) / Math.max(1, b.buy + b.sell)));
}
function toxicityMultiplierGGGGGG(symbol) {
  const v = vpinV2GGGGGG(symbol);
  if (v > 0.4) return 0.9;
  if (v > 0.25) return 0.96;
  return 1;
}
const llSeries = {};
function recordLLReturnHHHHHH(symbol, ret) {
  if (!Number.isFinite(ret)) return;
  const a = llSeries[symbol] ?? (llSeries[symbol] = []);
  a.push(ret);
  if (a.length > 100) a.shift();
}
function grangerScore(X, Y, lag = 1) {
  const n = Math.min(X.length, Y.length) - lag;
  if (n < 20) return 0;
  let ssrR = 0, ssrU = 0;
  for (let i = lag; i < lag + n; i++) {
    const predR = Y[i - 1];
    const predU = 0.5 * Y[i - 1] + 0.5 * X[i - 1];
    ssrR += (Y[i] - predR) ** 2;
    ssrU += (Y[i] - predU) ** 2;
  }
  if (ssrU === 0) return 0;
  return Math.max(0, (ssrR - ssrU) / ssrU);
}
function leadLagMultiplierHHHHHH(leader, target, leaderDir, dir) {
  const X = llSeries[leader], Y = llSeries[target];
  if (!X || !Y || X.length < 30) return 1;
  const g = grangerScore(X, Y);
  if (g < 0.05) return 1;
  const aligned = Math.sign(leaderDir) === Math.sign(dir) && Math.sign(dir) !== 0;
  if (aligned && g > 0.15) return 1.05;
  if (!aligned && g > 0.2) return 0.93;
  return 1;
}
let dccRegimeCorr = 0.3;
function updateDCCIIIIII(retA, retB, lambda = 0.94) {
  if (![retA, retB].every(Number.isFinite)) return;
  const instantCorr = Math.sign(retA) === Math.sign(retB) ? Math.abs(retA * retB) * 100 : -Math.abs(retA * retB) * 100;
  dccRegimeCorr = lambda * dccRegimeCorr + (1 - lambda) * clamp$5(instantCorr, -1, 1);
}
function dccMultiplierIIIIII() {
  if (dccRegimeCorr > 0.8) return 0.92;
  if (dccRegimeCorr < 0.1) return 1.03;
  return 1;
}
function twoScaleRVJJJJJJ(returns2) {
  if (returns2.length < 20) return 0;
  const slow = returns2.filter((_, i) => i % 5 === 0);
  const rvFast = returns2.reduce((s, r) => s + r * r, 0);
  const rvSlow = slow.reduce((s, r) => s + r * r, 0) * 5;
  return Math.max(0, rvSlow - (rvFast - rvSlow) * 0.2);
}
function tsrvMultiplierJJJJJJ(returns2) {
  if (returns2.length < 20) return 1;
  const tsrv = twoScaleRVJJJJJJ(returns2);
  const rv = returns2.reduce((s, r) => s + r * r, 0);
  if (rv === 0) return 1;
  const noiseRatio = 1 - tsrv / rv;
  if (noiseRatio > 0.5) return 0.95;
  if (noiseRatio < 0.15) return 1.03;
  return 1;
}
const uncertainQueue = [];
function queueUncertainKKKKKK(symbol, score, intervalWidth) {
  if (intervalWidth < 5) return;
  uncertainQueue.push({ symbol, score, width: intervalWidth, time: Date.now() });
  uncertainQueue.sort((a, b) => b.width - a.width);
  if (uncertainQueue.length > 100) uncertainQueue.length = 100;
}
function activeLearningMultiplierKKKKKK(symbol) {
  const q = uncertainQueue.find((u) => u.symbol === symbol);
  if (!q) return 1;
  return 0.96;
}
const ewcAnchors = [];
function ewcPenaltyLLLLLL(currentWeights) {
  if (ewcAnchors.length === 0) return 0;
  let penalty = 0;
  for (const anchor of ewcAnchors) {
    for (const k of Object.keys(anchor.weights)) {
      const cur = currentWeights[k] ?? 0;
      penalty += anchor.fisher[k] * (cur - anchor.weights[k]) ** 2;
    }
  }
  return penalty / ewcAnchors.length;
}
function ewcMultiplierLLLLLL(currentWeights) {
  const p = ewcPenaltyLLLLLL(currentWeights);
  if (p > 2) return 0.95;
  return 1;
}
const classBalance = { wins: 0, losses: 0 };
function recordClassMMMMMM(won) {
  if (won) classBalance.wins++;
  else classBalance.losses++;
}
function imbalanceRatioMMMMMM() {
  const total = classBalance.wins + classBalance.losses;
  if (total < 20) return 1;
  return Math.min(classBalance.wins, classBalance.losses) / Math.max(1, Math.max(classBalance.wins, classBalance.losses));
}
function smoteMultiplierMMMMMM() {
  const r = imbalanceRatioMMMMMM();
  if (r < 0.3) return 0.93;
  if (r < 0.5) return 0.98;
  return 1;
}
let curriculumLevel = 0;
const curriculumPerf = [];
function recordCurriculumPerfNNNNNN(accuracy) {
  if (!Number.isFinite(accuracy)) return;
  curriculumPerf.push(accuracy);
  if (curriculumPerf.length > 50) curriculumPerf.shift();
  if (curriculumPerf.length >= 20) {
    const recent = mean$6(curriculumPerf.slice(-20));
    if (recent > 0.65 && curriculumLevel < 2) curriculumLevel++;
    else if (recent < 0.45 && curriculumLevel > 0) curriculumLevel--;
  }
}
function curriculumMultiplierNNNNNN(volatility) {
  if (curriculumLevel === 0 && volatility > 0.04) return 0.92;
  if (curriculumLevel === 2 && volatility > 0.04) return 1.02;
  return 1;
}
const btReturns = [];
function pboOOOOOO() {
  if (btReturns.length < 4) return 0.5;
  const n = btReturns.length;
  const mid = Math.floor(btReturns[0].length / 2);
  const isSharpe = btReturns.map((r) => {
    const half = r.slice(0, mid);
    const m = mean$6(half), s = std$3(half);
    return s === 0 ? 0 : m / s;
  });
  const oosSharpe = btReturns.map((r) => {
    const half = r.slice(mid);
    const m = mean$6(half), s = std$3(half);
    return s === 0 ? 0 : m / s;
  });
  const bestIS = isSharpe.indexOf(Math.max(...isSharpe));
  const oosRank = oosSharpe.slice().sort((a, b) => b - a).indexOf(oosSharpe[bestIS]);
  return oosRank / Math.max(1, n - 1);
}
function pboMultiplierOOOOOO() {
  const p = pboOOOOOO();
  if (p > 0.7) return 0.88;
  if (p > 0.5) return 0.96;
  return 1;
}
let trialsCount = 0;
const allTrialSharpes = [];
function recordTrialSharpePPPPPP(sharpe) {
  if (!Number.isFinite(sharpe)) return;
  trialsCount++;
  allTrialSharpes.push(sharpe);
  if (allTrialSharpes.length > 500) allTrialSharpes.shift();
}
function deflatedSharpePPPPPP(observedSharpe, n = 252) {
  if (allTrialSharpes.length < 5) return observedSharpe;
  const v = variance$4(allTrialSharpes);
  const expectedMaxSR = Math.sqrt(2 * Math.log(Math.max(2, trialsCount))) * Math.sqrt(v);
  const dsr = (observedSharpe - expectedMaxSR) * Math.sqrt(n - 1);
  return dsr;
}
function deflatedSharpeMultiplierPPPPPP(observedSharpe) {
  const dsr = deflatedSharpePPPPPP(observedSharpe);
  if (dsr < 0) return 0.9;
  if (dsr > 2) return 1.04;
  return 1;
}
let backtestExpectedPnl = 0;
const liveRecentPnl = [];
function recordLivePnlQQQQQQ(pnl) {
  if (!Number.isFinite(pnl)) return;
  liveRecentPnl.push(pnl);
  if (liveRecentPnl.length > 30) liveRecentPnl.shift();
}
function divergenceScoreQQQQQQ() {
  if (liveRecentPnl.length < 10) return 0;
  const liveAvg = mean$6(liveRecentPnl);
  const sigma = std$3(liveRecentPnl) || 1;
  return Math.abs(liveAvg - backtestExpectedPnl) / sigma;
}
function divergenceMultiplierQQQQQQ() {
  const d = divergenceScoreQQQQQQ();
  if (d > 2.5) return 0.85;
  if (d > 1.5) return 0.94;
  return 1;
}
const shapHistory = [];
function recordShapSnapshotRRRRRR(importances) {
  shapHistory.push({ time: Date.now(), importances: { ...importances } });
  if (shapHistory.length > 50) shapHistory.shift();
}
function shapDriftRRRRRR() {
  if (shapHistory.length < 4) return 0;
  const oldSnap = shapHistory[0].importances;
  const newSnap = shapHistory[shapHistory.length - 1].importances;
  const keys = /* @__PURE__ */ new Set([...Object.keys(oldSnap), ...Object.keys(newSnap)]);
  let totalDiff = 0, totalMag = 0;
  for (const k of keys) {
    const a = oldSnap[k] ?? 0;
    const b = newSnap[k] ?? 0;
    totalDiff += Math.abs(a - b);
    totalMag += Math.abs(a) + Math.abs(b);
  }
  if (totalMag === 0) return 0;
  return totalDiff / totalMag;
}
function shapDriftMultiplierRRRRRR() {
  const d = shapDriftRRRRRR();
  if (d > 0.6) return 0.92;
  if (d > 0.4) return 0.97;
  return 1;
}
function snapshotTierCCCCCCRRRRRRState() {
  return {
    bmaEvidence,
    stackData: stackData.slice(-1e3),
    stackW,
    stackB,
    qrfReturns,
    foldOutcomes: foldOutcomes.slice(-1e3),
    vpinBuckets,
    llSeries,
    dccRegimeCorr,
    uncertainQueue: uncertainQueue.slice(0, 100),
    ewcAnchors,
    classBalance,
    curriculumLevel,
    curriculumPerf: curriculumPerf.slice(-50),
    btReturns: btReturns.slice(-50),
    trialsCount,
    allTrialSharpes: allTrialSharpes.slice(-500),
    backtestExpectedPnl,
    liveRecentPnl: liveRecentPnl.slice(-30),
    shapHistory: shapHistory.slice(-50)
  };
}
function restoreTierCCCCCCRRRRRRState(s) {
  try {
    const d = s;
    if (d.bmaEvidence) Object.assign(bmaEvidence, d.bmaEvidence);
    if (Array.isArray(d.stackData)) {
      stackData.length = 0;
      stackData.push(...d.stackData);
    }
    if (Array.isArray(d.stackW)) stackW = d.stackW;
    if (typeof d.stackB === "number") stackB = d.stackB;
    if (d.qrfReturns) Object.assign(qrfReturns, d.qrfReturns);
    if (Array.isArray(d.foldOutcomes)) {
      foldOutcomes.length = 0;
      foldOutcomes.push(...d.foldOutcomes);
    }
    if (d.vpinBuckets) Object.assign(vpinBuckets, d.vpinBuckets);
    if (d.llSeries) Object.assign(llSeries, d.llSeries);
    if (typeof d.dccRegimeCorr === "number") dccRegimeCorr = d.dccRegimeCorr;
    if (Array.isArray(d.uncertainQueue)) {
      uncertainQueue.length = 0;
      uncertainQueue.push(...d.uncertainQueue);
    }
    if (Array.isArray(d.ewcAnchors)) {
      ewcAnchors.length = 0;
      ewcAnchors.push(...d.ewcAnchors);
    }
    if (d.classBalance && typeof d.classBalance === "object") Object.assign(classBalance, d.classBalance);
    if (typeof d.curriculumLevel === "number") curriculumLevel = d.curriculumLevel;
    if (Array.isArray(d.curriculumPerf)) {
      curriculumPerf.length = 0;
      curriculumPerf.push(...d.curriculumPerf);
    }
    if (Array.isArray(d.btReturns)) {
      btReturns.length = 0;
      btReturns.push(...d.btReturns);
    }
    if (typeof d.trialsCount === "number") trialsCount = d.trialsCount;
    if (Array.isArray(d.allTrialSharpes)) {
      allTrialSharpes.length = 0;
      allTrialSharpes.push(...d.allTrialSharpes);
    }
    if (typeof d.backtestExpectedPnl === "number") backtestExpectedPnl = d.backtestExpectedPnl;
    if (Array.isArray(d.liveRecentPnl)) {
      liveRecentPnl.length = 0;
      liveRecentPnl.push(...d.liveRecentPnl);
    }
    if (Array.isArray(d.shapHistory)) {
      shapHistory.length = 0;
      shapHistory.push(...d.shapHistory);
    }
  } catch {
  }
}
const clamp$4 = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const mean$5 = (a) => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
const variance$3 = (a) => {
  if (a.length < 2) return 0;
  const m = mean$5(a);
  return a.reduce((s, v) => s + (v - m) * (v - m), 0) / (a.length - 1);
};
const conformalResiduals$1 = {};
function recordConformalSSSSSS(symbol, predicted, actual) {
  if (!Number.isFinite(predicted) || !Number.isFinite(actual)) return;
  const a = conformalResiduals$1[symbol] ?? (conformalResiduals$1[symbol] = []);
  a.push(Math.abs(predicted - actual));
  if (a.length > 200) a.shift();
}
function conformalQuantileSSSSSS(symbol, alpha = 0.1) {
  const a = conformalResiduals$1[symbol];
  if (!a || a.length < 20) return 0;
  const sorted = [...a].sort((x, y) => x - y);
  const idx = Math.min(sorted.length - 1, Math.ceil((1 - alpha) * (sorted.length + 1)) - 1);
  return sorted[Math.max(0, idx)];
}
function conformalMultiplierSSSSSS(symbol) {
  const a = conformalResiduals$1[symbol];
  if (!a || a.length < 20) return 1;
  const q = conformalQuantileSSSSSS(symbol, 0.1);
  if (q > 0.08) return 0.93;
  if (q < 0.02) return 1.04;
  return 1;
}
const sectorReturns = {};
const symbolToSector = {};
function recordSectorReturnTTTTTT(symbol, sector, ret) {
  if (!sector || !Number.isFinite(ret)) return;
  symbolToSector[symbol] = sector;
  const a = sectorReturns[sector] ?? (sectorReturns[sector] = []);
  a.push(ret);
  if (a.length > 300) a.shift();
}
function shrinkageMultiplierTTTTTT(symbol, signalDir) {
  const sec = symbolToSector[symbol];
  if (!sec) return 1;
  const arr = sectorReturns[sec];
  if (!arr || arr.length < 20) return 1;
  const sectorMean = mean$5(arr);
  if (Math.sign(sectorMean) === Math.sign(signalDir) && Math.abs(sectorMean) > 5e-3) return 1.03;
  if (Math.sign(sectorMean) !== Math.sign(signalDir) && Math.abs(sectorMean) > 0.01) return 0.95;
  return 1;
}
function gpUncertaintyUUUUUU(series) {
  if (series.length < 8) return 1;
  const recent = series.slice(-10);
  const v = variance$3(recent);
  const fullV = variance$3(series);
  if (fullV === 0) return 1;
  return Math.sqrt(v / fullV);
}
function gpMultiplierUUUUUU(series) {
  const u = gpUncertaintyUUUUUU(series);
  if (u > 1.5) return 0.92;
  if (u < 0.5) return 1.04;
  return 1;
}
const expertPerf = {};
function recordExpertVVVVVV(expert, won) {
  const e = expertPerf[expert] ?? (expertPerf[expert] = { wins: 0, total: 0 });
  e.total++;
  if (won) e.wins++;
}
function moeMultiplierVVVVVV(regime) {
  const e = expertPerf[regime];
  if (!e || e.total < 10) return 1;
  const wr = e.wins / e.total;
  if (wr > 0.6) return 1.05;
  if (wr < 0.4) return 0.93;
  return 1;
}
const causalSeries = {};
function recordCausalWWWWWW(name, value) {
  if (!Number.isFinite(value)) return;
  const a = causalSeries[name] ?? (causalSeries[name] = []);
  a.push(value);
  if (a.length > 200) a.shift();
}
function pearson$1(a, b) {
  const n = Math.min(a.length, b.length);
  if (n < 5) return 0;
  const ma = mean$5(a.slice(-n)), mb = mean$5(b.slice(-n));
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) {
    const x = a[a.length - n + i] - ma, y = b[b.length - n + i] - mb;
    num += x * y;
    da += x * x;
    db += y * y;
  }
  if (da === 0 || db === 0) return 0;
  return num / Math.sqrt(da * db);
}
function causalMultiplierWWWWWW(cause, effect) {
  const A = causalSeries[cause], B = causalSeries[effect];
  if (!A || !B || A.length < 30 || B.length < 30) return 1;
  const r = pearson$1(A.slice(0, -1), B.slice(1));
  const rRev = pearson$1(B.slice(0, -1), A.slice(1));
  if (Math.abs(r) > 0.3 && Math.abs(r) > Math.abs(rRev) * 1.3) return 1.04;
  return 1;
}
function counterfactualMultiplierXXXXXX(features) {
  if (features.length < 3) return 1;
  const total = features.reduce((s, f) => s + Math.abs(f), 0);
  if (total === 0) return 1;
  const maxShare = Math.max(...features.map((f) => Math.abs(f))) / total;
  if (maxShare > 0.7) return 0.93;
  if (maxShare < 0.3) return 1.03;
  return 1;
}
const hawkesEvents$1 = {};
function recordHawkesEventYYYYYY(symbol, ts = Date.now()) {
  const a = hawkesEvents$1[symbol] ?? (hawkesEvents$1[symbol] = []);
  a.push(ts);
  if (a.length > 100) a.shift();
}
function hawkesIntensityYYYYYY(symbol, now = Date.now()) {
  const a = hawkesEvents$1[symbol];
  if (!a || a.length === 0) return 0;
  return a.reduce((s, t) => s + Math.exp(-1111111111111111e-21 * (now - t)), 0);
}
function hawkesMultiplierYYYYYY(symbol) {
  const lam = hawkesIntensityYYYYYY(symbol);
  if (lam > 5) return 0.9;
  if (lam > 2) return 0.95;
  return 1;
}
function haarOnce(arr) {
  const approx = [], detail = [];
  for (let i = 0; i < arr.length - 1; i += 2) {
    approx.push((arr[i] + arr[i + 1]) / 2);
    detail.push((arr[i] - arr[i + 1]) / 2);
  }
  return { approx, detail };
}
function waveletEnergyZZZZZZ(series) {
  if (series.length < 8) return { trend: 0, cycle: 0, noise: 0 };
  const l1 = haarOnce(series);
  const l2 = haarOnce(l1.approx);
  const energy = (a) => a.reduce((s, v) => s + v * v, 0);
  return {
    trend: energy(l2.approx),
    cycle: energy(l2.detail) + energy(l1.detail.slice(0, l2.detail.length)),
    noise: energy(l1.detail.slice(l2.detail.length))
  };
}
function waveletMultiplierZZZZZZ(series) {
  const e = waveletEnergyZZZZZZ(series);
  const total = e.trend + e.cycle + e.noise;
  if (total === 0) return 1;
  const trendShare = e.trend / total;
  if (trendShare > 0.6) return 1.05;
  if (trendShare < 0.2 && e.noise / total > 0.5) return 0.92;
  return 1;
}
const symbolLR = {};
function recordMAMLAAAAAAA(symbol, won) {
  const s = symbolLR[symbol] ?? (symbolLR[symbol] = { lr: 0.1, wins: 0, total: 0 });
  s.total++;
  if (won) s.wins++;
  if (s.total % 10 === 0) {
    const wr = s.wins / s.total;
    s.lr = clamp$4(0.05 + (1 - wr) * 0.2, 0.02, 0.3);
  }
}
function mamlMultiplierAAAAAAA(symbol) {
  const s = symbolLR[symbol];
  if (!s || s.total < 5) return 1;
  const wr = s.wins / s.total;
  if (s.lr < 0.08 && wr > 0.55) return 1.04;
  if (s.lr > 0.2) return 0.94;
  return 1;
}
const ppoActionRewards = {};
function recordPPOBBBBBBB(action, reward) {
  if (!Number.isFinite(reward)) return;
  const a = ppoActionRewards[action] ?? (ppoActionRewards[action] = { reward: 0, count: 0 });
  a.reward = a.reward * 0.95 + reward * 0.05;
  a.count++;
}
function ppoMultiplierBBBBBBB(action) {
  const a = ppoActionRewards[action];
  if (!a || a.count < 10) return 1;
  if (a.reward > 0.5) return 1.05;
  if (a.reward < -0.5) return 0.93;
  return 1;
}
const ts2vecEmbeds = {};
function recordTS2VecCCCCCCC(symbol, features) {
  if (features.length === 0) return;
  const a = ts2vecEmbeds[symbol] ?? (ts2vecEmbeds[symbol] = []);
  a.push(features.slice(0, 8));
  if (a.length > 50) a.shift();
}
function cosineSim(a, b) {
  const n = Math.min(a.length, b.length);
  let dot2 = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) {
    dot2 += a[i] * b[i];
    da += a[i] ** 2;
    db += b[i] ** 2;
  }
  if (da === 0 || db === 0) return 0;
  return dot2 / Math.sqrt(da * db);
}
function ts2vecMultiplierCCCCCCC(symbol, currentFeats) {
  const arr = ts2vecEmbeds[symbol];
  if (!arr || arr.length < 5 || currentFeats.length === 0) return 1;
  const sims = arr.slice(-10).map((e) => cosineSim(e, currentFeats.slice(0, 8)));
  const avgSim = mean$5(sims);
  if (avgSim > 0.7) return 1.04;
  if (avgSim < 0.2) return 0.94;
  return 1;
}
const adversarialDeltas = [];
function recordAdversarialDDDDDDD(originalPred, noisyPred) {
  if (![originalPred, noisyPred].every(Number.isFinite)) return;
  adversarialDeltas.push(Math.abs(originalPred - noisyPred));
  if (adversarialDeltas.length > 200) adversarialDeltas.shift();
}
function adversarialMultiplierDDDDDDD() {
  if (adversarialDeltas.length < 30) return 1;
  const m = mean$5(adversarialDeltas.slice(-50));
  if (m > 10) return 0.9;
  if (m > 5) return 0.96;
  if (m < 1) return 1.04;
  return 1;
}
const ftrlWeights = {};
const FTRL_ALPHA = 0.05, FTRL_LAMBDA1 = 0.01;
function updateFTRLEEEEEEE(feature, grad) {
  if (!Number.isFinite(grad)) return;
  const s = ftrlWeights[feature] ?? (ftrlWeights[feature] = { z: 0, n: 0 });
  const sigma = (Math.sqrt(s.n + grad * grad) - Math.sqrt(s.n)) / FTRL_ALPHA;
  const wOld = Math.abs(s.z) <= FTRL_LAMBDA1 ? 0 : -(s.z - Math.sign(s.z) * FTRL_LAMBDA1) / ((Math.sqrt(s.n) + 1) / FTRL_ALPHA);
  s.z += grad - sigma * wOld;
  s.n += grad * grad;
}
function ftrlMultiplierEEEEEEE() {
  const ws = Object.values(ftrlWeights);
  if (ws.length < 3) return 1;
  const totalN = ws.reduce((s, w) => s + w.n, 0);
  if (totalN < 5) return 1;
  const activeCount = ws.filter((w) => Math.abs(w.z) > FTRL_LAMBDA1).length;
  const sparsity = 1 - activeCount / ws.length;
  if (sparsity > 0.6) return 1.03;
  if (sparsity < 0.2) return 0.96;
  return 1;
}
const banditArms = {};
function recordBanditFFFFFFF(arm, won) {
  const a = banditArms[arm] ?? (banditArms[arm] = { alpha: 1, beta: 1 });
  if (won) a.alpha += 1;
  else a.beta += 1;
}
function sampleBeta(alpha, beta2) {
  const m = alpha / (alpha + beta2);
  const v = alpha * beta2 / ((alpha + beta2) ** 2 * (alpha + beta2 + 1));
  return clamp$4(m + (Math.random() - 0.5) * 2 * Math.sqrt(v), 0, 1);
}
function banditMultiplierFFFFFFF(arm) {
  const a = banditArms[arm];
  if (!a || a.alpha + a.beta < 4) return 1;
  const p = sampleBeta(a.alpha, a.beta);
  if (p > 0.65) return 1.04;
  if (p < 0.35) return 0.94;
  return 1;
}
const cfRegrets = {};
function recordRegretGGGGGGG(strategy, takenReward, bestReward) {
  if (![takenReward, bestReward].every(Number.isFinite)) return;
  const a = cfRegrets[strategy] ?? (cfRegrets[strategy] = []);
  a.push(bestReward - takenReward);
  if (a.length > 200) a.shift();
}
function cfrMultiplierGGGGGGG(strategy) {
  const a = cfRegrets[strategy];
  if (!a || a.length < 20) return 1;
  const avgRegret = mean$5(a.slice(-50));
  if (avgRegret > 1) return 0.92;
  if (avgRegret < 0.1) return 1.04;
  return 1;
}
const distillAgreements = [];
function recordDistillationHHHHHHH(teacherPred, studentPred) {
  if (![teacherPred, studentPred].every(Number.isFinite)) return;
  distillAgreements.push(Math.abs(teacherPred - studentPred));
  if (distillAgreements.length > 200) distillAgreements.shift();
}
function distillationMultiplierHHHHHHH() {
  if (distillAgreements.length < 20) return 1;
  const m = mean$5(distillAgreements.slice(-50));
  if (m < 2) return 1.03;
  if (m > 10) return 0.94;
  return 1;
}
function snapshotTierSSSSSSHHHHHHHState() {
  return {
    conformalResiduals: conformalResiduals$1,
    sectorReturns,
    symbolToSector,
    expertPerf,
    causalSeries,
    hawkesEvents: hawkesEvents$1,
    symbolLR,
    ppoActionRewards,
    ts2vecEmbeds,
    adversarialDeltas: adversarialDeltas.slice(-200),
    ftrlWeights,
    banditArms,
    cfRegrets,
    distillAgreements: distillAgreements.slice(-200)
  };
}
function restoreTierSSSSSSHHHHHHHState(s) {
  try {
    const d = s;
    if (d.conformalResiduals) Object.assign(conformalResiduals$1, d.conformalResiduals);
    if (d.sectorReturns) Object.assign(sectorReturns, d.sectorReturns);
    if (d.symbolToSector) Object.assign(symbolToSector, d.symbolToSector);
    if (d.expertPerf) Object.assign(expertPerf, d.expertPerf);
    if (d.causalSeries) Object.assign(causalSeries, d.causalSeries);
    if (d.hawkesEvents) Object.assign(hawkesEvents$1, d.hawkesEvents);
    if (d.symbolLR) Object.assign(symbolLR, d.symbolLR);
    if (d.ppoActionRewards) Object.assign(ppoActionRewards, d.ppoActionRewards);
    if (d.ts2vecEmbeds) Object.assign(ts2vecEmbeds, d.ts2vecEmbeds);
    if (Array.isArray(d.adversarialDeltas)) {
      adversarialDeltas.length = 0;
      adversarialDeltas.push(...d.adversarialDeltas);
    }
    if (d.ftrlWeights) Object.assign(ftrlWeights, d.ftrlWeights);
    if (d.banditArms) Object.assign(banditArms, d.banditArms);
    if (d.cfRegrets) Object.assign(cfRegrets, d.cfRegrets);
    if (Array.isArray(d.distillAgreements)) {
      distillAgreements.length = 0;
      distillAgreements.push(...d.distillAgreements);
    }
  } catch {
  }
}
const mean$4 = (a) => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
const variance$2 = (a) => {
  if (a.length < 2) return 0;
  const m = mean$4(a);
  return a.reduce((s, v) => s + (v - m) * (v - m), 0) / (a.length - 1);
};
const std$2 = (a) => Math.sqrt(variance$2(a));
function neuralOdeMultiplierIIIIIII(closes) {
  if (!closes || closes.length < 6) return 1;
  const tail = closes.slice(-8);
  const d1 = [];
  for (let i = 1; i < tail.length; i++) d1.push(tail[i] - tail[i - 1]);
  const d2 = [];
  for (let i = 1; i < d1.length; i++) d2.push(d1[i] - d1[i - 1]);
  const meanAbs = mean$4(tail.map((x) => Math.abs(x))) || 1;
  const curv = std$2(d2) / meanAbs;
  if (curv < 5e-3) return 1.04;
  if (curv > 0.03) return 0.94;
  return 1;
}
function tftMultiplierJJJJJJJ(closes) {
  if (!closes || closes.length < 16) return 1;
  const short = mean$4(closes.slice(-4)) - mean$4(closes.slice(-8, -4));
  const mid = mean$4(closes.slice(-8)) - mean$4(closes.slice(-16, -8));
  const long = closes[closes.length - 1] - closes[0];
  const signs = [Math.sign(short), Math.sign(mid), Math.sign(long)];
  const agree = Math.abs(signs.reduce((a, b) => a + b, 0));
  if (agree === 3) return 1.05;
  if (agree === 1) return 0.97;
  return 1;
}
function diffusionMultiplierKKKKKKK(closes) {
  if (!closes || closes.length < 20) return 1;
  const rets = [];
  for (let i = 1; i < closes.length; i++) {
    if (closes[i - 1] > 0) rets.push((closes[i] - closes[i - 1]) / closes[i - 1]);
  }
  const sd = std$2(rets);
  const spread = sd * Math.sqrt(20);
  if (spread > 0.08) return 0.92;
  if (spread < 0.02) return 1.04;
  return 1;
}
const kalmanState = {};
function kalmanUpdateLLLLLLL(symbol, observation) {
  if (!Number.isFinite(observation)) return;
  const Q2 = 1e-4;
  const R = 0.01;
  const s = kalmanState[symbol] ?? (kalmanState[symbol] = { x: observation, p: 1 });
  s.p += Q2;
  const K2 = s.p / (s.p + R);
  s.x += K2 * (observation - s.x);
  s.p *= 1 - K2;
}
function kalmanMultiplierLLLLLLL(symbol) {
  const s = kalmanState[symbol];
  if (!s) return 1;
  if (s.p < 1e-3) return 1.03;
  if (s.p > 0.5) return 0.95;
  return 1;
}
const depthImbalance = {};
function recordDepthImbalanceMMMMMMM(symbol, bidDepth, askDepth) {
  if (!Number.isFinite(bidDepth) || !Number.isFinite(askDepth)) return;
  const total = bidDepth + askDepth;
  if (total <= 0) return;
  const imb = (bidDepth - askDepth) / total;
  const a = depthImbalance[symbol] ?? (depthImbalance[symbol] = []);
  a.push(imb);
  if (a.length > 100) a.shift();
}
function depthMultiplierMMMMMMM(symbol, signalDir) {
  const a = depthImbalance[symbol];
  if (!a || a.length < 5) return 1;
  const m = mean$4(a.slice(-20));
  if (Math.sign(m) === Math.sign(signalDir) && Math.abs(m) > 0.2) return 1.04;
  if (Math.sign(m) !== Math.sign(signalDir) && Math.abs(m) > 0.3) return 0.93;
  return 1;
}
const kyleSamples = {};
function recordKyleNNNNNNN(symbol, signedVolume, priceChange) {
  if (!Number.isFinite(signedVolume) || !Number.isFinite(priceChange) || signedVolume === 0) return;
  const lambda = priceChange / signedVolume;
  const a = kyleSamples[symbol] ?? (kyleSamples[symbol] = []);
  a.push(Math.abs(lambda));
  if (a.length > 100) a.shift();
}
function kyleMultiplierNNNNNNN(symbol) {
  const a = kyleSamples[symbol];
  if (!a || a.length < 10) return 1;
  const recent = mean$4(a.slice(-20));
  const baseline = mean$4(a);
  if (recent > baseline * 1.5) return 0.93;
  if (recent < baseline * 0.7) return 1.03;
  return 1;
}
const recentShocks = {};
function recordShockOOOOOOO(symbol, magnitude) {
  if (!Number.isFinite(magnitude) || Math.abs(magnitude) < 0.02) return;
  const a = recentShocks[symbol] ?? (recentShocks[symbol] = []);
  a.push({ ts: Date.now(), mag: magnitude });
  if (a.length > 50) a.shift();
}
function contagionMultiplierOOOOOOO(symbol) {
  const now = Date.now();
  let count = 0;
  for (const sym of Object.keys(recentShocks)) {
    if (sym === symbol) continue;
    const recent = recentShocks[sym].filter((s) => now - s.ts < 5 * 6e4);
    if (recent.length > 0) count++;
  }
  if (count >= 3) return 0.92;
  if (count >= 1) return 0.97;
  return 1;
}
const regimeHistory = {};
function recordRegimePPPPPPP(symbol, regime) {
  if (!regime) return;
  const a = regimeHistory[symbol] ?? (regimeHistory[symbol] = []);
  a.push(regime);
  if (a.length > 50) a.shift();
}
function hmmMultiplierPPPPPPP(symbol) {
  const a = regimeHistory[symbol];
  if (!a || a.length < 6) return 1;
  const last6 = a.slice(-6);
  const transitions = last6.slice(1).filter((r, i) => r !== last6[i]).length;
  if (transitions === 0) return 1.04;
  if (transitions >= 3) return 0.93;
  return 1;
}
const federatedVotes = [];
function recordFederatedVoteQQQQQQQ(localConfidence) {
  if (!Number.isFinite(localConfidence)) return;
  federatedVotes.push(localConfidence);
  if (federatedVotes.length > 100) federatedVotes.shift();
}
function federatedMultiplierQQQQQQQ(currentConfidence) {
  if (federatedVotes.length < 10) return 1;
  const consensus = mean$4(federatedVotes.slice(-20));
  const delta = Math.abs(currentConfidence - consensus);
  if (delta < 5) return 1.03;
  if (delta > 15) return 0.95;
  return 1;
}
const archPerf = { shallow: [], deep: [], wide: [] };
function recordArchPerfRRRRRRR(arch, pnl) {
  if (!archPerf[arch] || !Number.isFinite(pnl)) return;
  archPerf[arch].push(pnl);
  if (archPerf[arch].length > 50) archPerf[arch].shift();
}
function nasMultiplierRRRRRRR() {
  const scores2 = Object.entries(archPerf).map(([k, v]) => ({ k, s: v.length ? mean$4(v) : 0 }));
  scores2.sort((a, b) => b.s - a.s);
  const best = scores2[0];
  if (!best || best.s <= 0) return 1;
  if (best.s > 0.5) return 1.04;
  return 1;
}
const cpcEmbeds = {};
function recordCpcSSSSSSS(symbol, embed) {
  if (!embed || embed.length === 0) return;
  const a = cpcEmbeds[symbol] ?? (cpcEmbeds[symbol] = []);
  a.push(embed.slice(0, 6));
  if (a.length > 50) a.shift();
}
function cpcMultiplierSSSSSSS(symbol, current) {
  const a = cpcEmbeds[symbol];
  if (!a || a.length < 5 || !current?.length) return 1;
  const cur = current.slice(0, 6);
  let best = 0;
  for (const e of a.slice(-20)) {
    let dot2 = 0, na = 0, nb = 0;
    for (let i = 0; i < Math.min(e.length, cur.length); i++) {
      dot2 += e[i] * cur[i];
      na += e[i] * e[i];
      nb += cur[i] * cur[i];
    }
    const sim = dot2 / (Math.sqrt(na * nb) || 1);
    if (sim > best) best = sim;
  }
  if (best > 0.85) return 1.03;
  if (best < 0.3) return 0.96;
  return 1;
}
const lossHistory = [];
function recordLossTTTTTTT(loss) {
  if (!Number.isFinite(loss)) return;
  lossHistory.push(loss);
  if (lossHistory.length > 200) lossHistory.shift();
}
function samMultiplierTTTTTTT() {
  if (lossHistory.length < 20) return 1;
  const recent = lossHistory.slice(-20);
  const sharpness = std$2(recent) / (mean$4(recent) + 1e-6);
  if (sharpness < 0.1) return 1.03;
  if (sharpness > 0.5) return 0.94;
  return 1;
}
const adversaryActions = [];
function recordAdversaryUUUUUUU(ourSignal, marketResponse) {
  if (!Number.isFinite(ourSignal) || !Number.isFinite(marketResponse)) return;
  adversaryActions.push({ ours: ourSignal, theirs: marketResponse });
  if (adversaryActions.length > 100) adversaryActions.shift();
}
function gameTheoryMultiplierUUUUUUU() {
  if (adversaryActions.length < 20) return 1;
  const opp = adversaryActions.slice(-30).filter((a) => Math.sign(a.ours) !== Math.sign(a.theirs)).length;
  const ratio = opp / 30;
  if (ratio > 0.7) return 0.92;
  if (ratio < 0.3) return 1.03;
  return 1;
}
const causalLinks = {};
function recordCausalLinkVVVVVVV(featureName, correlation) {
  if (!Number.isFinite(correlation)) return;
  const prev = causalLinks[featureName] ?? 0;
  causalLinks[featureName] = prev * 0.95 + correlation * 0.05;
}
function causalDiscoveryMultiplierVVVVVVV(activeFeatures) {
  if (!activeFeatures?.length) return 1;
  const strengths = activeFeatures.map((f) => Math.abs(causalLinks[f] ?? 0));
  const m = mean$4(strengths);
  if (m > 0.4) return 1.04;
  if (m < 0.1) return 0.96;
  return 1;
}
function infoBottleneckMultiplierWWWWWWW(featureCount, predictiveScore) {
  if (!Number.isFinite(featureCount) || !Number.isFinite(predictiveScore) || featureCount <= 0) return 1;
  const efficiency = predictiveScore / Math.log(featureCount + 1);
  if (efficiency > 0.3) return 1.03;
  if (efficiency < 0.05) return 0.96;
  return 1;
}
const explanationConsensus = [];
function recordExplanationXXXXXXX(shap, lime, anchor) {
  if (![shap, lime, anchor].every(Number.isFinite)) return;
  const sd = std$2([shap, lime, anchor]);
  explanationConsensus.push(sd);
  if (explanationConsensus.length > 100) explanationConsensus.shift();
}
function explainabilityMultiplierXXXXXXX() {
  if (explanationConsensus.length < 10) return 1;
  const m = mean$4(explanationConsensus.slice(-20));
  if (m < 0.1) return 1.04;
  if (m > 0.5) return 0.94;
  return 1;
}
function snapshotTierIIIIIIIXXXXXXXState() {
  return {
    kalmanState,
    depthImbalance,
    kyleSamples,
    recentShocks,
    regimeHistory,
    federatedVotes: federatedVotes.slice(-100),
    archPerf,
    cpcEmbeds,
    lossHistory: lossHistory.slice(-200),
    adversaryActions: adversaryActions.slice(-100),
    causalLinks,
    explanationConsensus: explanationConsensus.slice(-100)
  };
}
function restoreTierIIIIIIIXXXXXXXState(s) {
  try {
    const d = s;
    if (d.kalmanState) Object.assign(kalmanState, d.kalmanState);
    if (d.depthImbalance) Object.assign(depthImbalance, d.depthImbalance);
    if (d.kyleSamples) Object.assign(kyleSamples, d.kyleSamples);
    if (d.recentShocks) Object.assign(recentShocks, d.recentShocks);
    if (d.regimeHistory) Object.assign(regimeHistory, d.regimeHistory);
    if (Array.isArray(d.federatedVotes)) {
      federatedVotes.length = 0;
      federatedVotes.push(...d.federatedVotes);
    }
    if (d.archPerf) Object.assign(archPerf, d.archPerf);
    if (d.cpcEmbeds) Object.assign(cpcEmbeds, d.cpcEmbeds);
    if (Array.isArray(d.lossHistory)) {
      lossHistory.length = 0;
      lossHistory.push(...d.lossHistory);
    }
    if (Array.isArray(d.adversaryActions)) {
      adversaryActions.length = 0;
      adversaryActions.push(...d.adversaryActions);
    }
    if (d.causalLinks) Object.assign(causalLinks, d.causalLinks);
    if (Array.isArray(d.explanationConsensus)) {
      explanationConsensus.length = 0;
      explanationConsensus.push(...d.explanationConsensus);
    }
  } catch {
  }
}
const clamp$3 = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const mean$3 = (a) => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
const variance$1 = (a) => {
  if (a.length < 2) return 0;
  const m = mean$3(a);
  return a.reduce((s, v) => s + (v - m) * (v - m), 0) / (a.length - 1);
};
const std$1 = (a) => Math.sqrt(variance$1(a));
const quantile$1 = (sorted, q) => {
  if (!sorted.length) return 0;
  const idx = clamp$3(Math.floor(q * (sorted.length - 1)), 0, sorted.length - 1);
  return sorted[idx];
};
function quantileRegressionMultiplierYYYYYYY(closes) {
  if (!closes || closes.length < 20) return 1;
  const rets = [];
  for (let i = 1; i < closes.length; i++) {
    if (closes[i - 1] > 0) rets.push((closes[i] - closes[i - 1]) / closes[i - 1]);
  }
  if (rets.length < 10) return 1;
  const sorted = [...rets].sort((a, b) => a - b);
  const q10 = quantile$1(sorted, 0.1);
  const q50 = quantile$1(sorted, 0.5);
  const q90 = quantile$1(sorted, 0.9);
  const width = q90 - q10;
  const skew = Math.abs(q90 - q50 - (q50 - q10)) / (width || 1e-6);
  if (width < 0.03 && skew < 0.2) return 1.04;
  if (width > 0.1 || skew > 0.5) return 0.94;
  return 1;
}
function nbeatsMultiplierZZZZZZZ(closes) {
  if (!closes || closes.length < 24) return 1;
  const tail = closes.slice(-24);
  const n = tail.length;
  const xs = Array.from({ length: n }, (_, i) => i);
  const mx = mean$3(xs), my = mean$3(tail);
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (tail[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  const slope = den ? num / den : 0;
  const recent = tail[n - 1] - tail[n - 6];
  const trendAlign = Math.sign(slope) === Math.sign(recent) ? 1 : -1;
  const fitted = xs.map((x) => my + slope * (x - mx));
  const residuals = tail.map((v, i) => v - fitted[i]);
  const resVar = variance$1(residuals) / (variance$1(tail) || 1);
  if (trendAlign > 0 && resVar < 0.3) return 1.04;
  if (trendAlign < 0 || resVar > 0.7) return 0.95;
  return 1;
}
const reservoirState = {};
function updateReservoirAAAAAAAA(symbol, input) {
  if (!Number.isFinite(input)) return;
  const size = 16;
  const s = reservoirState[symbol] ?? (reservoirState[symbol] = new Array(size).fill(0));
  for (let i = 0; i < size; i++) {
    const next = (i + 1) % size;
    s[next] = Math.tanh(s[i] * 0.9 + input * 0.1);
  }
}
function echoStateMultiplierAAAAAAAA(symbol) {
  const s = reservoirState[symbol];
  if (!s) return 1;
  const energy = mean$3(s.map((v) => v * v));
  if (energy > 0.3 && energy < 0.6) return 1.04;
  if (energy < 0.05 || energy > 0.85) return 0.95;
  return 1;
}
function tdaMultiplierBBBBBBBB(closes) {
  if (!closes || closes.length < 30) return 1;
  const tail = closes.slice(-30);
  const sd = std$1(tail);
  if (sd === 0) return 1;
  let persistent = 0;
  for (let i = 2; i < tail.length - 2; i++) {
    const isPeak = tail[i] > tail[i - 1] && tail[i] > tail[i + 1] && tail[i] > tail[i - 2] && tail[i] > tail[i + 2];
    const isTrough = tail[i] < tail[i - 1] && tail[i] < tail[i + 1] && tail[i] < tail[i - 2] && tail[i] < tail[i + 2];
    if ((isPeak || isTrough) && Math.abs(tail[i] - mean$3(tail)) > sd) persistent++;
  }
  if (persistent >= 2 && persistent <= 4) return 1.03;
  if (persistent === 0 || persistent > 6) return 0.96;
  return 1;
}
const lobQueue = {};
function recordLOBCCCCCCCC(symbol, bidSize, askSize) {
  if (!Number.isFinite(bidSize) || !Number.isFinite(askSize)) return;
  const a = lobQueue[symbol] ?? (lobQueue[symbol] = []);
  a.push({ bid: bidSize, ask: askSize, ts: Date.now() });
  if (a.length > 50) a.shift();
}
function lobDynamicsMultiplierCCCCCCCC(symbol, signalDir) {
  const a = lobQueue[symbol];
  if (!a || a.length < 5) return 1;
  const recent = a.slice(-10);
  const bidRate = recent.reduce((s, v) => s + v.bid, 0) / recent.length;
  const askRate = recent.reduce((s, v) => s + v.ask, 0) / recent.length;
  const pressure = (bidRate - askRate) / (bidRate + askRate + 1);
  if (Math.sign(pressure) === Math.sign(signalDir) && Math.abs(pressure) > 0.15) return 1.03;
  if (Math.sign(pressure) !== Math.sign(signalDir) && Math.abs(pressure) > 0.25) return 0.94;
  return 1;
}
function jumpDetectionMultiplierDDDDDDDD(closes) {
  if (!closes || closes.length < 20) return 1;
  const rets = [];
  for (let i = 1; i < closes.length; i++) {
    if (closes[i - 1] > 0) rets.push(Math.log(closes[i] / closes[i - 1]));
  }
  if (rets.length < 10) return 1;
  let bv = 0;
  for (let i = 1; i < rets.length; i++) bv += Math.abs(rets[i]) * Math.abs(rets[i - 1]);
  bv = Math.PI / 2 * bv / (rets.length - 1);
  const sigma = Math.sqrt(bv) || 1e-6;
  const lastRet = Math.abs(rets[rets.length - 1]);
  const stat = lastRet / sigma;
  if (stat > 4) return 0.92;
  if (stat < 1) return 1.03;
  return 1;
}
function realizedKernelMultiplierEEEEEEEE(closes) {
  if (!closes || closes.length < 20) return 1;
  const rets = [];
  for (let i = 1; i < closes.length; i++) {
    if (closes[i - 1] > 0) rets.push(Math.log(closes[i] / closes[i - 1]));
  }
  if (rets.length < 10) return 1;
  const H = Math.min(3, rets.length - 1);
  let rv = rets.reduce((s, r) => s + r * r, 0);
  for (let h = 1; h <= H; h++) {
    let acf = 0;
    for (let i = h; i < rets.length; i++) acf += rets[i] * rets[i - h];
    const weight = 1 - h / (H + 1);
    rv += 2 * weight * acf;
  }
  rv = Math.max(rv, 0);
  const sd = Math.sqrt(rv / rets.length);
  if (sd < 0.01) return 1.03;
  if (sd > 0.04) return 0.94;
  return 1;
}
const networkCentrality = {};
function updateCentralityFFFFFFFF(symbol, correlatedSymbols) {
  if (!symbol || !correlatedSymbols?.length) return;
  const inflow = correlatedSymbols.reduce((s, sym) => s + (networkCentrality[sym] ?? 0.15), 0) / correlatedSymbols.length;
  networkCentrality[symbol] ?? 0.15;
  networkCentrality[symbol] = 0.85 * inflow + 0.15;
}
function centralityMultiplierFFFFFFFF(symbol) {
  const c = networkCentrality[symbol];
  if (c === void 0) return 1;
  if (c > 0.6) return 1.04;
  if (c < 0.1) return 0.97;
  return 1;
}
const loraDeltas = {};
function recordLoRAGGGGGGGG(sector, residual) {
  if (!sector || !Number.isFinite(residual)) return;
  const a = loraDeltas[sector] ?? (loraDeltas[sector] = []);
  a.push(residual);
  if (a.length > 50) a.shift();
}
function loraMultiplierGGGGGGGG(sector) {
  const a = loraDeltas[sector];
  if (!a || a.length < 10) return 1;
  const m = mean$3(a.map(Math.abs));
  if (m < 0.02) return 1.03;
  if (m > 0.08) return 0.95;
  return 1;
}
const curriculumStage = { stage: 0, samplesSeen: 0 };
function recordCurriculumHHHHHHHH(complexity) {
  if (!Number.isFinite(complexity)) return;
  curriculumStage.samplesSeen++;
  if (curriculumStage.samplesSeen > 200 && curriculumStage.stage < 3) {
    curriculumStage.stage++;
    curriculumStage.samplesSeen = 0;
  }
}
function curriculumMultiplierHHHHHHHH(currentComplexity) {
  const maxComplexity = (curriculumStage.stage + 1) / 4;
  if (currentComplexity <= maxComplexity) return 1.02;
  if (currentComplexity > maxComplexity + 0.3) return 0.96;
  return 1;
}
const mixupHistory = [];
function recordMixupIIIIIIII(originalLoss, mixupLoss) {
  if (!Number.isFinite(originalLoss) || !Number.isFinite(mixupLoss)) return;
  mixupHistory.push(mixupLoss - originalLoss);
  if (mixupHistory.length > 100) mixupHistory.shift();
}
function mixupMultiplierIIIIIIII() {
  if (mixupHistory.length < 10) return 1;
  const m = mean$3(mixupHistory.slice(-30));
  if (m > 0 && m < 0.1) return 1.03;
  if (m > 0.3) return 0.95;
  return 1;
}
const lookaheadGaps = [];
function recordLookaheadJJJJJJJJ(fastWeight, slowWeight) {
  if (!Number.isFinite(fastWeight) || !Number.isFinite(slowWeight)) return;
  lookaheadGaps.push(Math.abs(fastWeight - slowWeight));
  if (lookaheadGaps.length > 100) lookaheadGaps.shift();
}
function lookaheadMultiplierJJJJJJJJ() {
  if (lookaheadGaps.length < 10) return 1;
  const m = mean$3(lookaheadGaps.slice(-30));
  if (m < 0.05) return 1.03;
  if (m > 0.3) return 0.95;
  return 1;
}
function adversarialRobustnessMultiplierKKKKKKKK(closes, confidence) {
  if (!closes || closes.length < 10 || !Number.isFinite(confidence)) return 1;
  const sd = std$1(closes.slice(-10)) / (mean$3(closes.slice(-10)) || 1);
  const robustness2 = 1 - Math.min(sd / 0.02, 1);
  if (robustness2 > 0.7 && Math.abs(confidence - 50) > 10) return 1.03;
  if (robustness2 < 0.3) return 0.95;
  return 1;
}
const calibrationBuckets = Array.from({ length: 10 }, () => []);
function recordCalibrationLLLLLLLL(predictedConfidence, wasCorrect) {
  if (!Number.isFinite(predictedConfidence)) return;
  const bucket2 = clamp$3(Math.floor(predictedConfidence / 10), 0, 9);
  calibrationBuckets[bucket2].push({ conf: predictedConfidence, correct: wasCorrect ? 1 : 0 });
  if (calibrationBuckets[bucket2].length > 50) calibrationBuckets[bucket2].shift();
}
function isotonicCalibrationMultiplierLLLLLLLL(currentConfidence) {
  const bucket2 = clamp$3(Math.floor(currentConfidence / 10), 0, 9);
  const arr = calibrationBuckets[bucket2];
  if (!arr || arr.length < 5) return 1;
  const actualAccuracy = mean$3(arr.map((x) => x.correct)) * 100;
  const predicted = currentConfidence;
  const gap = Math.abs(actualAccuracy - predicted);
  if (gap < 5) return 1.04;
  if (gap > 20) return 0.93;
  return 1;
}
const inDistributionFeatures = [];
function recordInDistMMMMMMMM(features) {
  if (!features || features.length === 0) return;
  inDistributionFeatures.push(features.slice(0, 6));
  if (inDistributionFeatures.length > 200) inDistributionFeatures.shift();
}
function mahalanobisOODMultiplierMMMMMMMM(currentFeatures) {
  if (inDistributionFeatures.length < 30 || !currentFeatures?.length) return 1;
  const dim = Math.min(currentFeatures.length, 6);
  const cur = currentFeatures.slice(0, dim);
  const means = [];
  const stds = [];
  for (let d = 0; d < dim; d++) {
    const col = inDistributionFeatures.map((f) => f[d] ?? 0);
    means.push(mean$3(col));
    stds.push(std$1(col) || 1);
  }
  let dist2 = 0;
  for (let d = 0; d < dim; d++) {
    const z = (cur[d] - means[d]) / stds[d];
    dist2 += z * z;
  }
  const dist3 = Math.sqrt(dist2);
  if (dist3 < 2) return 1.03;
  if (dist3 > 4) return 0.92;
  return 1;
}
const conceptScores = {
  trend: [],
  momentum: [],
  volatility: [],
  liquidity: [],
  sentiment: []
};
function recordConceptNNNNNNNN(concept, score) {
  if (!conceptScores[concept] || !Number.isFinite(score)) return;
  conceptScores[concept].push(score);
  if (conceptScores[concept].length > 100) conceptScores[concept].shift();
}
function conceptBottleneckMultiplierNNNNNNNN(activeConcepts) {
  if (!activeConcepts || Object.keys(activeConcepts).length === 0) return 1;
  let aligned = 0, total = 0;
  for (const [k, v] of Object.entries(activeConcepts)) {
    const hist = conceptScores[k];
    if (!hist || hist.length < 5) continue;
    const histMean = mean$3(hist.slice(-30));
    total++;
    if (Math.sign(v) === Math.sign(histMean) && Math.abs(histMean) > 0.2) aligned++;
  }
  if (total === 0) return 1;
  const ratio = aligned / total;
  if (ratio > 0.7) return 1.04;
  if (ratio < 0.3) return 0.95;
  return 1;
}
function snapshotTierYYYYYYYNNNNNNNNState() {
  return {
    reservoirState,
    lobQueue,
    networkCentrality,
    loraDeltas,
    curriculumStage: { ...curriculumStage },
    mixupHistory: mixupHistory.slice(-100),
    lookaheadGaps: lookaheadGaps.slice(-100),
    calibrationBuckets: calibrationBuckets.map((b) => b.slice(-50)),
    inDistributionFeatures: inDistributionFeatures.slice(-200),
    conceptScores
  };
}
function restoreTierYYYYYYYNNNNNNNNState(s) {
  try {
    const d = s;
    if (d.reservoirState) Object.assign(reservoirState, d.reservoirState);
    if (d.lobQueue) Object.assign(lobQueue, d.lobQueue);
    if (d.networkCentrality) Object.assign(networkCentrality, d.networkCentrality);
    if (d.loraDeltas) Object.assign(loraDeltas, d.loraDeltas);
    if (d.curriculumStage) {
      curriculumStage.stage = d.curriculumStage.stage;
      curriculumStage.samplesSeen = d.curriculumStage.samplesSeen;
    }
    if (Array.isArray(d.mixupHistory)) {
      mixupHistory.length = 0;
      mixupHistory.push(...d.mixupHistory);
    }
    if (Array.isArray(d.lookaheadGaps)) {
      lookaheadGaps.length = 0;
      lookaheadGaps.push(...d.lookaheadGaps);
    }
    if (Array.isArray(d.calibrationBuckets)) {
      for (let i = 0; i < Math.min(10, d.calibrationBuckets.length); i++) {
        calibrationBuckets[i].length = 0;
        calibrationBuckets[i].push(...d.calibrationBuckets[i]);
      }
    }
    if (Array.isArray(d.inDistributionFeatures)) {
      inDistributionFeatures.length = 0;
      inDistributionFeatures.push(...d.inDistributionFeatures);
    }
    if (d.conceptScores) Object.assign(conceptScores, d.conceptScores);
  } catch {
  }
}
const clamp$2 = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const mean$2 = (a) => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
const variance = (a) => {
  if (a.length < 2) return 0;
  const m = mean$2(a);
  return a.reduce((s, v) => s + (v - m) * (v - m), 0) / (a.length - 1);
};
const std = (a) => Math.sqrt(variance(a));
const quantile = (sorted, q) => {
  if (!sorted.length) return 0;
  const idx = clamp$2(Math.floor(q * (sorted.length - 1)), 0, sorted.length - 1);
  return sorted[idx];
};
const conformalResiduals = [];
function recordConformalOOOOOOOO(predicted, actual) {
  if (!Number.isFinite(predicted) || !Number.isFinite(actual)) return;
  conformalResiduals.push(Math.abs(predicted - actual));
  if (conformalResiduals.length > 500) conformalResiduals.shift();
}
function conformalPredictionMultiplierOOOOOOOO() {
  if (conformalResiduals.length < 20) return 1;
  const sorted = [...conformalResiduals].sort((a, b) => a - b);
  const q90 = quantile(sorted, 0.9);
  if (q90 < 0.05) return 1.04;
  if (q90 > 0.2) return 0.93;
  return 1;
}
function mixtureDensityMultiplierPPPPPPPP(closes) {
  if (!closes || closes.length < 30) return 1;
  const rets = [];
  for (let i = 1; i < closes.length; i++) {
    if (closes[i - 1] > 0) rets.push((closes[i] - closes[i - 1]) / closes[i - 1]);
  }
  if (rets.length < 20) return 1;
  const m = mean$2(rets);
  const sd = std(rets) || 1e-6;
  const sorted = [...rets].sort((a, b) => a - b);
  const tailRatio = (Math.abs(quantile(sorted, 0.95)) + Math.abs(quantile(sorted, 0.05))) / (sd * 2);
  if (Math.abs(m) / sd > 0.4 && tailRatio < 1.5) return 1.03;
  if (tailRatio > 2.5) return 0.94;
  return 1;
}
function deepGaussianProcessMultiplierQQQQQQQQ(closes) {
  if (!closes || closes.length < 20) return 1;
  const tail = closes.slice(-20);
  const windows = [];
  for (let i = 0; i + 5 <= tail.length; i++) {
    windows.push(mean$2(tail.slice(i, i + 5)));
  }
  const v = variance(windows) / (mean$2(tail) || 1);
  if (v < 5e-4) return 1.03;
  if (v > 5e-3) return 0.95;
  return 1;
}
function spectralResidualMultiplierRRRRRRRR(closes) {
  if (!closes || closes.length < 16) return 1;
  const tail = closes.slice(-16);
  const logs = tail.map((v) => Math.log(Math.max(v, 1e-6)));
  const diffs = logs.slice(1).map((v, i) => v - logs[i]);
  const avg = mean$2(diffs.map(Math.abs));
  const last = Math.abs(diffs[diffs.length - 1] ?? 0);
  const ratio = last / (avg || 1e-6);
  if (ratio > 3) return 0.92;
  if (ratio < 1.2) return 1.03;
  return 1;
}
const hawkesEvents = {};
function recordHawkesEventSSSSSSSS(symbol, ts = Date.now()) {
  const a = hawkesEvents[symbol] ?? (hawkesEvents[symbol] = []);
  a.push(ts);
  if (a.length > 100) a.shift();
}
function hawkesProcessMultiplierSSSSSSSS(symbol) {
  const a = hawkesEvents[symbol];
  if (!a || a.length < 5) return 1;
  const now = Date.now();
  const recent = a.filter((t) => now - t < 36e5).length;
  const baseline = a.length / Math.max(1, (now - a[0]) / 36e5);
  const intensity2 = recent / Math.max(baseline, 0.1);
  if (intensity2 > 2.5) return 0.93;
  if (intensity2 < 0.5) return 1.03;
  return 1;
}
function roughVolatilityMultiplierTTTTTTTT(closes) {
  if (!closes || closes.length < 32) return 1;
  const rets = [];
  for (let i = 1; i < closes.length; i++) {
    if (closes[i - 1] > 0) rets.push(Math.log(closes[i] / closes[i - 1]));
  }
  if (rets.length < 30) return 1;
  const m = mean$2(rets);
  const dev = rets.map((r) => r - m);
  const cum = dev.reduce((acc, v) => {
    acc.push((acc[acc.length - 1] ?? 0) + v);
    return acc;
  }, []);
  const R = Math.max(...cum) - Math.min(...cum);
  const S = std(rets) || 1e-6;
  const RS = R / S;
  const H = Math.log(RS) / Math.log(rets.length);
  if (H > 0.05 && H < 0.3) return 1.03;
  if (H > 0.7) return 0.95;
  return 1;
}
const crossSectionalScores = {};
function recordCrossSectionalUUUUUUUU(symbol, ret) {
  if (!Number.isFinite(ret)) return;
  const prev = crossSectionalScores[symbol] ?? 0;
  crossSectionalScores[symbol] = prev * 0.9 + ret * 0.1;
}
function crossSectionalMomentumMultiplierUUUUUUUU(symbol) {
  const score = crossSectionalScores[symbol];
  if (score === void 0) return 1;
  const all = Object.values(crossSectionalScores).sort((a, b) => a - b);
  if (all.length < 5) return 1;
  const rank = all.indexOf(score) / all.length;
  if (rank > 0.8) return 1.04;
  if (rank < 0.2) return 0.95;
  return 1;
}
function liquidityVaRMultiplierVVVVVVVV(closes, avgVolume) {
  if (!closes || closes.length < 20 || !Number.isFinite(avgVolume) || avgVolume <= 0) return 1;
  const rets = [];
  for (let i = 1; i < closes.length; i++) {
    if (closes[i - 1] > 0) rets.push((closes[i] - closes[i - 1]) / closes[i - 1]);
  }
  const sorted = [...rets].sort((a, b) => a - b);
  const var95 = Math.abs(quantile(sorted, 0.05));
  const liqAdj = var95 * (1 + 1 / Math.log10(avgVolume + 10));
  if (liqAdj < 0.02) return 1.03;
  if (liqAdj > 0.06) return 0.94;
  return 1;
}
const distillationAgreement = [];
function recordDistillationWWWWWWWW(teacherPred, studentPred) {
  if (!Number.isFinite(teacherPred) || !Number.isFinite(studentPred)) return;
  distillationAgreement.push(1 - Math.abs(teacherPred - studentPred));
  if (distillationAgreement.length > 100) distillationAgreement.shift();
}
function distillationMultiplierWWWWWWWW() {
  if (distillationAgreement.length < 10) return 1;
  const m = mean$2(distillationAgreement.slice(-30));
  if (m > 0.85) return 1.03;
  if (m < 0.5) return 0.95;
  return 1;
}
const ewcFisher = [];
function recordEWCXXXXXXXX(weightChange) {
  if (!Number.isFinite(weightChange)) return;
  ewcFisher.push(weightChange * weightChange);
  if (ewcFisher.length > 200) ewcFisher.shift();
}
function ewcMultiplierXXXXXXXX() {
  if (ewcFisher.length < 20) return 1;
  const m = mean$2(ewcFisher.slice(-50));
  if (m < 1e-3) return 1.03;
  if (m > 0.05) return 0.95;
  return 1;
}
const snapshotPredictions = [];
function recordSnapshotYYYYYYYY(prediction) {
  if (!Number.isFinite(prediction)) return;
  snapshotPredictions.push(prediction);
  if (snapshotPredictions.length > 50) snapshotPredictions.shift();
}
function selfDistillationMultiplierYYYYYYYY() {
  if (snapshotPredictions.length < 10) return 1;
  const recent = snapshotPredictions.slice(-20);
  const sd = std(recent);
  if (sd < 5) return 1.03;
  if (sd > 20) return 0.95;
  return 1;
}
const swaWeights = [];
function recordSWAZZZZZZZZ(weight) {
  if (!Number.isFinite(weight)) return;
  swaWeights.push(weight);
  if (swaWeights.length > 100) swaWeights.shift();
}
function swaMultiplierZZZZZZZZ() {
  if (swaWeights.length < 20) return 1;
  const m = mean$2(swaWeights);
  const sd = std(swaWeights);
  const cv = sd / (Math.abs(m) + 1e-6);
  if (cv < 0.1) return 1.03;
  if (cv > 0.5) return 0.95;
  return 1;
}
function counterfactualMultiplierAAAAAAAAA(closes, confidence) {
  if (!closes || closes.length < 10 || !Number.isFinite(confidence)) return 1;
  const last = closes[closes.length - 1];
  const sd = std(closes.slice(-10));
  const distToBoundary = Math.abs(confidence - 50);
  const relSd = sd / (last || 1);
  const flipDistance = distToBoundary / (relSd * 100 + 1);
  if (flipDistance > 2) return 1.04;
  if (flipDistance < 0.5) return 0.93;
  return 1;
}
function bootstrapIntervalMultiplierBBBBBBBBB(closes) {
  if (!closes || closes.length < 20) return 1;
  const rets = [];
  for (let i = 1; i < closes.length; i++) {
    if (closes[i - 1] > 0) rets.push((closes[i] - closes[i - 1]) / closes[i - 1]);
  }
  if (rets.length < 15) return 1;
  const means = [];
  for (let b = 0; b < 50; b++) {
    const sample = [];
    for (let i = 0; i < rets.length; i++) {
      sample.push(rets[Math.floor(Math.random() * rets.length)]);
    }
    means.push(mean$2(sample));
  }
  const sorted = means.sort((a, b) => a - b);
  const width = quantile(sorted, 0.975) - quantile(sorted, 0.025);
  if (width < 5e-3) return 1.03;
  if (width > 0.02) return 0.95;
  return 1;
}
const governanceChecks = { dataSheet: 0, modelCard: 0, biasAudit: 0, total: 3 };
function recordGovernanceCCCCCCCCC(field, complete) {
  if (field in governanceChecks) governanceChecks[field] = complete ? 1 : 0;
}
function modelCardMultiplierCCCCCCCCC() {
  const score = (governanceChecks.dataSheet + governanceChecks.modelCard + governanceChecks.biasAudit) / governanceChecks.total;
  if (score >= 1) return 1.02;
  if (score < 0.34) return 0.97;
  return 1;
}
function shapleyMultiplierDDDDDDDDD(contributions) {
  if (!contributions || contributions.length < 3) return 1;
  const abs = contributions.map((c) => Math.abs(c.contribution));
  const total = abs.reduce((s, v) => s + v, 0) || 1;
  const shares = abs.map((v) => v / total);
  const sortedShares = [...shares].sort((a, b) => a - b);
  let gini = 0;
  for (let i = 0; i < sortedShares.length; i++) gini += (2 * (i + 1) - sortedShares.length - 1) * sortedShares[i];
  gini = gini / (sortedShares.length * (sortedShares.reduce((s, v) => s + v, 0) || 1));
  if (Math.abs(gini) < 0.3) return 1.03;
  if (Math.abs(gini) > 0.7) return 0.95;
  return 1;
}
function snapshotTierOOOOOOOODDDDDDDDDState() {
  return {
    conformalResiduals: conformalResiduals.slice(-500),
    hawkesEvents,
    crossSectionalScores,
    distillationAgreement: distillationAgreement.slice(-100),
    ewcFisher: ewcFisher.slice(-200),
    snapshotPredictions: snapshotPredictions.slice(-50),
    swaWeights: swaWeights.slice(-100),
    governanceChecks: { ...governanceChecks }
  };
}
function restoreTierOOOOOOOODDDDDDDDDState(s) {
  try {
    const d = s;
    if (Array.isArray(d.conformalResiduals)) {
      conformalResiduals.length = 0;
      conformalResiduals.push(...d.conformalResiduals);
    }
    if (d.hawkesEvents) Object.assign(hawkesEvents, d.hawkesEvents);
    if (d.crossSectionalScores) Object.assign(crossSectionalScores, d.crossSectionalScores);
    if (Array.isArray(d.distillationAgreement)) {
      distillationAgreement.length = 0;
      distillationAgreement.push(...d.distillationAgreement);
    }
    if (Array.isArray(d.ewcFisher)) {
      ewcFisher.length = 0;
      ewcFisher.push(...d.ewcFisher);
    }
    if (Array.isArray(d.snapshotPredictions)) {
      snapshotPredictions.length = 0;
      snapshotPredictions.push(...d.snapshotPredictions);
    }
    if (Array.isArray(d.swaWeights)) {
      swaWeights.length = 0;
      swaWeights.push(...d.swaWeights);
    }
    if (d.governanceChecks) Object.assign(governanceChecks, d.governanceChecks);
  } catch {
  }
}
const clamp$1 = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const mean$1 = (a) => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
const bmaStats = {};
function recordBMASourceOutcome(source, conf, won) {
  if (!source || !Number.isFinite(conf)) return;
  const p = clamp$1(conf / 100, 0, 1);
  const b = (p - (won ? 1 : 0)) ** 2;
  const s = bmaStats[source] ?? (bmaStats[source] = { brier: 0, n: 0 });
  s.brier = (s.brier * s.n + b) / (s.n + 1);
  s.n += 1;
}
function bayesianModelAveragingMultiplier(sources) {
  const entries = Object.entries(sources || {}).filter(([, v]) => Number.isFinite(v));
  if (entries.length === 0) return 1;
  let totalW = 0, weighted = 0, knownAny = false;
  for (const [name, val] of entries) {
    const s = bmaStats[name];
    if (!s || s.n < 5) continue;
    knownAny = true;
    const w = clamp$1(1 - s.brier * 4, 0.05, 1);
    totalW += w;
    weighted += w * (val - 50);
  }
  if (!knownAny || totalW === 0) return 1;
  const adj = weighted / totalW;
  if (adj > 8) return 1.04;
  if (adj < -8) return 0.95;
  return 1;
}
const conformalCoverage = { covered: 0, total: 0 };
function recordConformalCoverage(lower, upper, realized) {
  if (![lower, upper, realized].every(Number.isFinite)) return;
  conformalCoverage.total += 1;
  if (realized >= lower && realized <= upper) conformalCoverage.covered += 1;
}
function conformalQualityMultiplier() {
  if (conformalCoverage.total < 20) return 1;
  const cov = conformalCoverage.covered / conformalCoverage.total;
  if (cov >= 0.85 && cov <= 0.95) return 1.04;
  if (cov < 0.7 || cov > 0.99) return 0.94;
  return 1;
}
const cfrStats = { aboveStrict: { hits: 0, n: 0 }, aboveLoose: { hits: 0, n: 0 } };
function recordCounterfactualReplay(conf, won) {
  if (!Number.isFinite(conf)) return;
  if (conf >= 75) {
    cfrStats.aboveStrict.n += 1;
    if (won) cfrStats.aboveStrict.hits += 1;
  }
  if (conf >= 60) {
    cfrStats.aboveLoose.n += 1;
    if (won) cfrStats.aboveLoose.hits += 1;
  }
}
function counterfactualReplayMultiplier(currentConf) {
  const s = cfrStats.aboveStrict, l = cfrStats.aboveLoose;
  if (s.n < 10 || l.n < 10) return 1;
  const strictAcc = s.hits / s.n;
  const looseAcc = l.hits / l.n;
  const lift = strictAcc - looseAcc;
  if (lift > 0.05 && currentConf >= 75) return 1.04;
  if (lift > 0.05 && currentConf < 65) return 0.96;
  if (lift < -0.05) return 0.97;
  return 1;
}
const regimeHits = {};
function recordRegimeOutcomeRAT(regime, won) {
  const r = regimeHits[regime] ?? (regimeHits[regime] = { hits: 0, n: 0 });
  r.n += 1;
  if (won) r.hits += 1;
}
function regimeAwareActivationMultiplier(regime) {
  if (!regime) return 1;
  const r = regimeHits[regime];
  if (!r || r.n < 10) return 1;
  const acc = r.hits / r.n;
  if (acc > 0.6) return 1.05;
  if (acc < 0.4) return 0.92;
  return 1;
}
const distillWeights = {};
function updateDistillation(source, signal, realized) {
  if (!source || !Number.isFinite(signal) || !Number.isFinite(realized)) return;
  const lr = 0.02;
  const e = distillWeights[source] ?? (distillWeights[source] = { w: 0, n: 0 });
  const pred = e.w * signal;
  const err = pred - realized;
  e.w -= lr * err * signal;
  e.n += 1;
}
function distillationFastMultiplier(sources) {
  let sum = 0, count = 0;
  for (const [name, val] of Object.entries(sources || {})) {
    const e = distillWeights[name];
    if (!e || e.n < 5) continue;
    sum += e.w * (val - 50);
    count += 1;
  }
  if (count === 0) return 1;
  if (sum > 3) return 1.03;
  if (sum < -3) return 0.96;
  return 1;
}
const uncertaintyBand = { hits: 0, n: 0 };
function recordUncertaintyOutcome(conf, won) {
  if (!Number.isFinite(conf)) return;
  if (conf >= 55 && conf <= 65) {
    uncertaintyBand.n += 1;
    if (won) uncertaintyBand.hits += 1;
  }
}
function activeLearningUncertaintyMultiplier(currentConf) {
  if (uncertaintyBand.n < 10) return 1;
  const acc = uncertaintyBand.hits / uncertaintyBand.n;
  if (currentConf >= 55 && currentConf <= 65 && acc < 0.45) return 0.93;
  if (currentConf >= 55 && currentConf <= 65 && acc > 0.6) return 1.03;
  return 1;
}
const stressDrawdowns = [];
function recordStressOutcome(realizedPct, isStress) {
  if (!isStress || !Number.isFinite(realizedPct)) return;
  stressDrawdowns.push(realizedPct);
  if (stressDrawdowns.length > 200) stressDrawdowns.shift();
}
function adversarialStressMultiplier() {
  if (stressDrawdowns.length < 10) return 1;
  const m = mean$1(stressDrawdowns);
  if (m < -2) return 0.92;
  if (m > 2) return 1.03;
  return 1;
}
const sectorOutcomes = {};
function recordSectorOutcomeGKT(sector, won) {
  if (!sector) return;
  const s = sectorOutcomes[sector] ?? (sectorOutcomes[sector] = { hits: 0, n: 0 });
  s.n += 1;
  if (won) s.hits += 1;
}
function graphKnowledgeTransferMultiplier(sector) {
  if (!sector) return 1;
  const s = sectorOutcomes[sector];
  if (!s || s.n < 10) return 1;
  const acc = s.hits / s.n;
  if (acc > 0.6) return 1.04;
  if (acc < 0.4) return 0.94;
  return 1;
}
function snapshotTierFrontierV3State() {
  return {
    bmaStats,
    conformalCoverage: { ...conformalCoverage },
    cfrStats: {
      aboveStrict: { ...cfrStats.aboveStrict },
      aboveLoose: { ...cfrStats.aboveLoose }
    },
    regimeHits,
    distillWeights,
    uncertaintyBand: { ...uncertaintyBand },
    stressDrawdowns: stressDrawdowns.slice(-200),
    sectorOutcomes
  };
}
function restoreTierFrontierV3State(s) {
  try {
    const d = s;
    if (d.bmaStats) Object.assign(bmaStats, d.bmaStats);
    if (d.conformalCoverage) {
      conformalCoverage.covered = d.conformalCoverage.covered;
      conformalCoverage.total = d.conformalCoverage.total;
    }
    if (d.cfrStats) {
      Object.assign(cfrStats.aboveStrict, d.cfrStats.aboveStrict);
      Object.assign(cfrStats.aboveLoose, d.cfrStats.aboveLoose);
    }
    if (d.regimeHits) Object.assign(regimeHits, d.regimeHits);
    if (d.distillWeights) Object.assign(distillWeights, d.distillWeights);
    if (d.uncertaintyBand) {
      uncertaintyBand.hits = d.uncertaintyBand.hits;
      uncertaintyBand.n = d.uncertaintyBand.n;
    }
    if (Array.isArray(d.stressDrawdowns)) {
      stressDrawdowns.length = 0;
      stressDrawdowns.push(...d.stressDrawdowns);
    }
    if (d.sectorOutcomes) Object.assign(sectorOutcomes, d.sectorOutcomes);
  } catch {
  }
}
const mlbStats = { tp: 0, sl: 0, time: 0, n: 0 };
function recordMetaLabelTripleBarrier(label) {
  mlbStats[label] += 1;
  mlbStats.n += 1;
}
function metaLabelTripleBarrierMultiplier(currentConf) {
  if (mlbStats.n < 15) return 1;
  const pTP = mlbStats.tp / mlbStats.n;
  if (pTP > 0.55 && currentConf >= 65) return 1.04;
  if (pTP < 0.35) return 0.93;
  return 1;
}
const pcvFolds = Array.from({ length: 5 }, () => ({ hits: 0, n: 0 }));
function recordPurgedFoldOutcome(foldIdx, won) {
  const i = Math.abs(foldIdx) % pcvFolds.length;
  pcvFolds[i].n += 1;
  if (won) pcvFolds[i].hits += 1;
}
function purgedCVReliabilityMultiplier() {
  const valid = pcvFolds.filter((f) => f.n >= 5);
  if (valid.length < 3) return 1;
  const accs = valid.map((f) => f.hits / f.n);
  const mean2 = accs.reduce((a, b) => a + b, 0) / accs.length;
  const variance2 = accs.reduce((s, a) => s + (a - mean2) ** 2, 0) / accs.length;
  const stable = variance2 < 0.02;
  if (stable && mean2 > 0.55) return 1.05;
  if (!stable || mean2 < 0.45) return 0.94;
  return 1;
}
const fidRolling = {};
function recordFeatureImportanceFID(name, importance) {
  if (!name || !Number.isFinite(importance)) return;
  const arr = fidRolling[name] ?? (fidRolling[name] = []);
  arr.push(importance);
  if (arr.length > 50) arr.shift();
}
function featureImportanceDriftMultiplier(activeFeatures) {
  if (!activeFeatures || activeFeatures.length === 0) return 1;
  let driftSum = 0, checked = 0;
  for (const name of activeFeatures) {
    const arr = fidRolling[name];
    if (!arr || arr.length < 20) continue;
    const early = arr.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
    const late = arr.slice(-10).reduce((a, b) => a + b, 0) / 10;
    const drift = Math.abs(late - early) / Math.max(Math.abs(early), 0.01);
    driftSum += drift;
    checked += 1;
  }
  if (checked < 2) return 1;
  const avgDrift = driftSum / checked;
  if (avgDrift > 0.5) return 0.93;
  if (avgDrift < 0.15) return 1.03;
  return 1;
}
const iceBuckets = Array.from({ length: 10 }, () => ({ hits: 0, n: 0 }));
function recordIsotonicEnsembleOutcome(conf, won) {
  const b = Math.max(0, Math.min(9, Math.floor(conf / 10)));
  iceBuckets[b].n += 1;
  if (won) iceBuckets[b].hits += 1;
}
function isotonicEnsembleCalibMultiplier(currentConf) {
  const b = Math.max(0, Math.min(9, Math.floor(currentConf / 10)));
  const bucket2 = iceBuckets[b];
  if (!bucket2 || bucket2.n < 8) return 1;
  const actualRate = bucket2.hits / bucket2.n;
  const expectedRate = (b * 10 + 5) / 100;
  const gap = actualRate - expectedRate;
  if (gap > 0.1) return 1.04;
  if (gap < -0.1) return 0.94;
  return 1;
}
const hrpClusters = {};
function recordHRPClusterReturn(cluster, ret) {
  if (!cluster || !Number.isFinite(ret)) return;
  const c = hrpClusters[cluster] ?? (hrpClusters[cluster] = { ret: [], n: 0 });
  c.ret.push(ret);
  c.n += 1;
  if (c.ret.length > 100) c.ret.shift();
}
function hrpClusterRiskMultiplier(cluster) {
  if (!cluster) return 1;
  const c = hrpClusters[cluster];
  if (!c || c.n < 10) return 1;
  const m = c.ret.reduce((a, b) => a + b, 0) / c.ret.length;
  const v = c.ret.reduce((s, r) => s + (r - m) ** 2, 0) / c.ret.length;
  const sharpe = m / Math.max(Math.sqrt(v), 0.01);
  if (sharpe > 0.5) return 1.04;
  if (sharpe < -0.5) return 0.93;
  return 1;
}
function llmJudgeContradictionMultiplier(opts) {
  const sig = (opts.signal ?? "").toLowerCase();
  const reg = (opts.regime ?? "").toLowerCase();
  const bullish = sig.includes("buy");
  const bearish = sig.includes("sell");
  const strongBear = reg.includes("down") || reg.includes("bear");
  const strongBull = reg.includes("up") || reg.includes("bull");
  if (bullish && strongBear && opts.confidence > 70) return 0.88;
  if (bearish && strongBull && opts.confidence > 70) return 0.88;
  if (bullish && strongBull || bearish && strongBear) return 1.03;
  return 1;
}
const cdvLinks = {};
function recordCausalLinkCDV(feature, signal, realized) {
  if (!feature || ![signal, realized].every(Number.isFinite)) return;
  const l = cdvLinks[feature] ?? (cdvLinks[feature] = { sumXY: 0, sumX: 0, sumY: 0, sumX2: 0, sumY2: 0, n: 0 });
  l.sumXY += signal * realized;
  l.sumX += signal;
  l.sumY += realized;
  l.sumX2 += signal * signal;
  l.sumY2 += realized * realized;
  l.n += 1;
}
function corr(l) {
  const n = l.n;
  if (n < 10) return 0;
  const num = n * l.sumXY - l.sumX * l.sumY;
  const den = Math.sqrt(Math.max(0, (n * l.sumX2 - l.sumX ** 2) * (n * l.sumY2 - l.sumY ** 2)));
  return den > 0 ? num / den : 0;
}
function causalDiscoveryMultiplier(activeFeatures) {
  if (!activeFeatures?.length) return 1;
  let causalCount = 0, totalCount = 0;
  for (const f of activeFeatures) {
    const l = cdvLinks[f];
    if (!l || l.n < 10) continue;
    totalCount += 1;
    if (Math.abs(corr(l)) > 0.2) causalCount += 1;
  }
  if (totalCount < 3) return 1;
  const ratio = causalCount / totalCount;
  if (ratio > 0.6) return 1.04;
  if (ratio < 0.25) return 0.95;
  return 1;
}
const rlpQ = {};
function rlpKey(regime, confBin) {
  return `${regime}|${confBin}`;
}
function recordRLPositionOutcome(regime, conf, realized) {
  if (!Number.isFinite(conf) || !Number.isFinite(realized)) return;
  const k = rlpKey(regime ?? "calm", Math.floor(conf / 10));
  const q = rlpQ[k] ?? (rlpQ[k] = { value: 0, n: 0 });
  q.value = (q.value * q.n + realized) / (q.n + 1);
  q.n += 1;
}
function rlPositionSizingMultiplier(regime, conf) {
  const k = rlpKey(regime ?? "calm", Math.floor(conf / 10));
  const q = rlpQ[k];
  if (!q || q.n < 8) return 1;
  if (q.value > 1) return 1.04;
  if (q.value < -1) return 0.93;
  return 1;
}
const sabStats = { primary: { hits: 0, n: 0 }, shadow: { hits: 0, n: 0 } };
function recordShadowABOutcome(primaryWon, shadowWon) {
  sabStats.primary.n += 1;
  if (primaryWon) sabStats.primary.hits += 1;
  sabStats.shadow.n += 1;
  if (shadowWon) sabStats.shadow.hits += 1;
}
function shadowABNewLayerMultiplier() {
  const p = sabStats.primary, s = sabStats.shadow;
  if (p.n < 20 || s.n < 20) return 1;
  const pAcc = p.hits / p.n, sAcc = s.hits / s.n;
  if (sAcc - pAcc > 0.05) return 1.03;
  if (pAcc - sAcc > 0.05) return 0.97;
  return 1;
}
function recordConfidenceDecomposition(symbol, contributions) {
}
function confidenceDecompositionMultiplier() {
  return 1;
}
const fedSectors = {};
function recordFederatedSectorOutcome(sector, realized) {
  if (!sector || !Number.isFinite(realized)) return;
  const s = fedSectors[sector] ?? (fedSectors[sector] = { sum: 0, n: 0 });
  s.sum += realized;
  s.n += 1;
}
function federatedSectorOutcomeMultiplier(sector) {
  if (!sector) return 1;
  const s = fedSectors[sector];
  if (!s || s.n < 5) return 1;
  const avg = s.sum / s.n;
  if (avg > 1.5) return 1.04;
  if (avg < -1.5) return 0.94;
  return 1;
}
function snapshotTierMasterIQState() {
  return {
    mlbStats: { ...mlbStats },
    pcvFolds: pcvFolds.map((f) => ({ ...f })),
    fidRolling,
    iceBuckets: iceBuckets.map((b) => ({ ...b })),
    hrpClusters,
    cdvLinks,
    rlpQ,
    sabStats: { primary: { ...sabStats.primary }, shadow: { ...sabStats.shadow } },
    fedSectors
  };
}
function restoreTierMasterIQState(s) {
  try {
    const d = s;
    if (d.mlbStats) Object.assign(mlbStats, d.mlbStats);
    if (Array.isArray(d.pcvFolds)) d.pcvFolds.forEach((f, i) => {
      if (pcvFolds[i]) Object.assign(pcvFolds[i], f);
    });
    if (d.fidRolling) Object.assign(fidRolling, d.fidRolling);
    if (Array.isArray(d.iceBuckets)) d.iceBuckets.forEach((b, i) => {
      if (iceBuckets[i]) Object.assign(iceBuckets[i], b);
    });
    if (d.hrpClusters) Object.assign(hrpClusters, d.hrpClusters);
    if (d.cdvLinks) Object.assign(cdvLinks, d.cdvLinks);
    if (d.rlpQ) Object.assign(rlpQ, d.rlpQ);
    if (d.sabStats) {
      Object.assign(sabStats.primary, d.sabStats.primary);
      Object.assign(sabStats.shadow, d.sabStats.shadow);
    }
    if (d.fedSectors) Object.assign(fedSectors, d.fedSectors);
  } catch {
  }
}
const ogbWeights = {};
function recordOGBOutcome(regime, conf, realized) {
  if (!Number.isFinite(conf) || !Number.isFinite(realized)) return;
  const k = regime ?? "calm";
  const s = ogbWeights[k] ?? (ogbWeights[k] = { w: 0, n: 0 });
  const target = realized > 0 ? 1 : -1;
  const pred = Math.tanh(s.w * (conf - 50) / 50);
  s.w += 0.02 * (target - pred) * (conf - 50) / 50;
  s.n += 1;
}
function onlineGradientBoostingMultiplier(regime, conf) {
  const s = ogbWeights[regime ?? "calm"];
  if (!s || s.n < 10) return 1;
  const pred = Math.tanh(s.w * (conf - 50) / 50);
  if (pred > 0.3) return 1.04;
  if (pred < -0.3) return 0.94;
  return 1;
}
const kelStats = { wins: 0, n: 0, sumWin: 0, sumLoss: 0 };
function recordKellyOutcomeAPEX(won, realized) {
  kelStats.n += 1;
  if (won) {
    kelStats.wins += 1;
    kelStats.sumWin += Math.abs(realized);
  } else kelStats.sumLoss += Math.abs(realized);
}
function kellyCriterionMultiplier() {
  if (kelStats.n < 15) return 1;
  const p = kelStats.wins / kelStats.n;
  const avgW = kelStats.sumWin / Math.max(kelStats.wins, 1);
  const avgL = kelStats.sumLoss / Math.max(kelStats.n - kelStats.wins, 1);
  if (avgL <= 0) return 1;
  const b = avgW / avgL;
  const kelly = p - (1 - p) / b;
  if (kelly > 0.15) return 1.05;
  if (kelly < -0.05) return 0.92;
  return 1;
}
function microstructureOFIMultiplier(ofi) {
  if (!Number.isFinite(ofi)) return 1;
  const x = ofi;
  if (x > 0.25) return 1.04;
  if (x < -0.25) return 0.95;
  return 1;
}
const wfoSamples = [];
function recordWFOSample(conf, won) {
  wfoSamples.push({ conf, won });
  if (wfoSamples.length > 200) wfoSamples.shift();
}
function walkForwardOptThresholdMultiplier(currentConf) {
  if (wfoSamples.length < 30) return 1;
  let bestThr = 60, bestAcc = 0;
  for (let thr = 55; thr <= 80; thr += 5) {
    const above = wfoSamples.filter((s) => s.conf >= thr);
    if (above.length < 8) continue;
    const acc = above.filter((s) => s.won).length / above.length;
    if (acc > bestAcc) {
      bestAcc = acc;
      bestThr = thr;
    }
  }
  if (currentConf >= bestThr && bestAcc > 0.55) return 1.04;
  if (currentConf < bestThr - 10) return 0.95;
  return 1;
}
const hmmTrans = {};
let hmmPrev = null;
function recordHMMRegime(regime) {
  if (!regime) return;
  if (hmmPrev) {
    const k = `${hmmPrev}->${regime}`;
    hmmTrans[k] = (hmmTrans[k] ?? 0) + 1;
  }
  hmmPrev = regime;
}
function hmmRegimeMultiplier(regime) {
  if (!regime || !hmmPrev) return 1;
  const stayKey = `${regime}->${regime}`;
  const stays = hmmTrans[stayKey] ?? 0;
  let total = 0;
  for (const k of Object.keys(hmmTrans)) if (k.startsWith(`${regime}->`)) total += hmmTrans[k];
  if (total < 8) return 1;
  const persistence = stays / total;
  if (persistence > 0.7) return 1.03;
  if (persistence < 0.3) return 0.95;
  return 1;
}
const cusum = { pos: 0, neg: 0, n: 0 };
function recordCUSUMReturn(ret) {
  if (!Number.isFinite(ret)) return;
  const k = 0.5;
  cusum.pos = Math.max(0, cusum.pos + ret - k);
  cusum.neg = Math.min(0, cusum.neg + ret + k);
  cusum.n += 1;
}
function changePointCUSUMMultiplier() {
  if (cusum.n < 10) return 1;
  if (cusum.pos > 5) return 1.03;
  if (cusum.neg < -5) return 0.93;
  return 1;
}
const coiSector = {};
function recordCointegrationReturn(sector, ret) {
  if (!sector || !Number.isFinite(ret)) return;
  const a = coiSector[sector] ?? (coiSector[sector] = []);
  a.push(ret);
  if (a.length > 60) a.shift();
}
function cointegrationPairsMultiplier(sector) {
  if (!sector) return 1;
  const a = coiSector[sector];
  if (!a || a.length < 20) return 1;
  const mean2 = a.reduce((x, y) => x + y, 0) / a.length;
  const variance2 = a.reduce((s, r) => s + (r - mean2) ** 2, 0) / a.length;
  const stable = variance2 < 4;
  if (stable && mean2 > 0.2) return 1.04;
  if (!stable && mean2 < -0.2) return 0.94;
  return 1;
}
let garchVar = 1;
function recordGARCHReturn(ret) {
  if (!Number.isFinite(ret)) return;
  garchVar = 0.94 * garchVar + 0.06 * ret * ret;
}
function garchVolatilityMultiplier() {
  if (garchVar > 8) return 0.94;
  if (garchVar < 1.5) return 1.03;
  return 1;
}
const nssBy = {};
function newsSentimentSentinelMultiplier(symbol, signal) {
  if (!symbol) return 1;
  const r = nssBy[symbol];
  if (!r) return 1;
  const ageH = (Date.now() - r.ts) / 36e5;
  if (ageH > 24) return 1;
  const sig = (signal ?? "").toLowerCase();
  if (sig.includes("buy") && r.score > 0.3) return 1.04;
  if (sig.includes("buy") && r.score < -0.3) return 0.93;
  if (sig.includes("sell") && r.score < -0.3) return 1.04;
  if (sig.includes("sell") && r.score > 0.3) return 0.93;
  return 1;
}
const ddSeries = [];
let ddEquity = 100, ddPeak = 100;
function recordDrawdownReturn(realized) {
  if (!Number.isFinite(realized)) return;
  ddEquity *= 1 + realized / 100;
  ddPeak = Math.max(ddPeak, ddEquity);
  ddSeries.push((ddEquity - ddPeak) / ddPeak);
  if (ddSeries.length > 50) ddSeries.shift();
}
function drawdownCircuitBreakerMultiplier() {
  if (ddSeries.length < 10) return 1;
  const current = ddSeries[ddSeries.length - 1];
  if (current < -0.15) return 0.85;
  if (current < -0.08) return 0.93;
  if (current > -0.02) return 1.02;
  return 1;
}
const todBuckets = {};
function recordTimeOfDayOutcome(hour, won) {
  const h = Math.max(0, Math.min(23, Math.floor(hour)));
  const b = todBuckets[h] ?? (todBuckets[h] = { hits: 0, n: 0 });
  b.n += 1;
  if (won) b.hits += 1;
}
function timeOfDayBucketMultiplier(hour) {
  if (!Number.isFinite(hour)) return 1;
  const b = todBuckets[Math.max(0, Math.min(23, Math.floor(hour)))];
  if (!b || b.n < 8) return 1;
  const rate = b.hits / b.n;
  if (rate > 0.6) return 1.04;
  if (rate < 0.4) return 0.94;
  return 1;
}
const tqsBy = {};
function recordTradeQuality(signalType, realized) {
  if (!signalType || !Number.isFinite(realized)) return;
  const s = tqsBy[signalType] ?? (tqsBy[signalType] = { rets: [] });
  s.rets.push(realized);
  if (s.rets.length > 80) s.rets.shift();
}
function tradeQualityScoreMultiplier(signalType) {
  if (!signalType) return 1;
  const s = tqsBy[signalType];
  if (!s || s.rets.length < 10) return 1;
  const m = s.rets.reduce((a, b) => a + b, 0) / s.rets.length;
  const v = s.rets.reduce((acc, r) => acc + (r - m) ** 2, 0) / s.rets.length;
  const sharpe = m / Math.max(Math.sqrt(v), 0.01);
  if (sharpe > 0.4) return 1.04;
  if (sharpe < -0.4) return 0.93;
  return 1;
}
const adwinWin = [];
function recordADWINOutcome(won) {
  adwinWin.push(won);
  if (adwinWin.length > 200) adwinWin.shift();
}
function adwinDriftDetectorMultiplier() {
  if (adwinWin.length < 40) return 1;
  const half = Math.floor(adwinWin.length / 2);
  const early = adwinWin.slice(0, half).filter(Boolean).length / half;
  const late = adwinWin.slice(half).filter(Boolean).length / (adwinWin.length - half);
  const delta = late - early;
  if (delta > 0.1) return 1.04;
  if (delta < -0.1) return 0.92;
  return 1;
}
const tsmRets = [];
function recordTSMReturn(ret) {
  if (!Number.isFinite(ret)) return;
  tsmRets.push(ret);
  if (tsmRets.length > 50) tsmRets.shift();
}
function transformerSequenceMultiplier() {
  const n = tsmRets.length;
  if (n < 8) return 1;
  const last3 = tsmRets.slice(-3);
  const pred = 0.5 * last3[2] + 0.3 * last3[1] + 0.2 * last3[0];
  if (pred > 1) return 1.04;
  if (pred < -1) return 0.94;
  return 1;
}
const tsbArms = {};
function recordThompsonOutcome(arm, won) {
  const x = tsbArms[arm] ?? (tsbArms[arm] = { a: 1, b: 1 });
  if (won) x.a += 1;
  else x.b += 1;
}
function betaMean(a, b) {
  return a / (a + b);
}
function thompsonSamplingBanditMultiplier(arm) {
  if (!arm) return 1;
  const x = tsbArms[arm];
  if (!x || x.a + x.b < 6) return 1;
  const m = betaMean(x.a, x.b);
  if (m > 0.6) return 1.04;
  if (m < 0.4) return 0.94;
  return 1;
}
const sbaRets = [];
function recordSBAReturn(ret) {
  if (!Number.isFinite(ret)) return;
  sbaRets.push(ret);
  if (sbaRets.length > 100) sbaRets.shift();
}
function syntheticBootstrapAugmentMultiplier() {
  const n = sbaRets.length;
  if (n < 25) return 1;
  const means = [];
  for (let i = 0; i < 100; i++) {
    let s = 0;
    for (let j = 0; j < n; j++) s += sbaRets[Math.floor(Math.random() * n)];
    means.push(s / n);
  }
  means.sort((a, b) => a - b);
  const lo = means[2], hi = means[97];
  if (lo > 0.3) return 1.04;
  if (hi < -0.3) return 0.92;
  if (hi - lo > 4) return 0.96;
  return 1;
}
function snapshotTierApexIQState() {
  return {
    ogbWeights,
    kelStats: { ...kelStats },
    wfoSamples,
    hmmTrans,
    hmmPrev,
    cusum: { ...cusum },
    coiSector,
    garchVar,
    nssBy,
    ddSeries,
    ddEquity,
    ddPeak,
    todBuckets,
    tqsBy,
    adwinWin,
    tsmRets,
    tsbArms,
    sbaRets
  };
}
function restoreTierApexIQState(s) {
  try {
    const d = s;
    if (d.ogbWeights) Object.assign(ogbWeights, d.ogbWeights);
    if (d.kelStats) Object.assign(kelStats, d.kelStats);
    if (Array.isArray(d.wfoSamples)) {
      wfoSamples.length = 0;
      wfoSamples.push(...d.wfoSamples);
    }
    if (d.hmmTrans) Object.assign(hmmTrans, d.hmmTrans);
    if (typeof d.hmmPrev === "string" || d.hmmPrev === null) hmmPrev = d.hmmPrev;
    if (d.cusum) Object.assign(cusum, d.cusum);
    if (d.coiSector) Object.assign(coiSector, d.coiSector);
    if (typeof d.garchVar === "number") garchVar = d.garchVar;
    if (d.nssBy) Object.assign(nssBy, d.nssBy);
    if (Array.isArray(d.ddSeries)) {
      ddSeries.length = 0;
      ddSeries.push(...d.ddSeries);
    }
    if (typeof d.ddEquity === "number") ddEquity = d.ddEquity;
    if (typeof d.ddPeak === "number") ddPeak = d.ddPeak;
    if (d.todBuckets) Object.assign(todBuckets, d.todBuckets);
    if (d.tqsBy) Object.assign(tqsBy, d.tqsBy);
    if (Array.isArray(d.adwinWin)) {
      adwinWin.length = 0;
      adwinWin.push(...d.adwinWin);
    }
    if (Array.isArray(d.tsmRets)) {
      tsmRets.length = 0;
      tsmRets.push(...d.tsmRets);
    }
    if (d.tsbArms) Object.assign(tsbArms, d.tsbArms);
    if (Array.isArray(d.sbaRets)) {
      sbaRets.length = 0;
      sbaRets.push(...d.sbaRets);
    }
  } catch {
  }
}
const regimeModels = {
  bull: { w: [0, 0, 0, 0], b: 0, n: 0 },
  bear: { w: [0, 0, 0, 0], b: 0, n: 0 },
  range: { w: [0, 0, 0, 0], b: 0, n: 0 },
  crisis: { w: [0, 0, 0, 0], b: 0, n: 0 }
};
const REG_LR = 0.03;
function regimeFromContext(reg) {
  if (reg === "trending_up") return "bull";
  if (reg === "trending_down") return "bear";
  if (reg === "high_vol") return "crisis";
  return "range";
}
function regimePredict(regime, x) {
  const m = regimeModels[regime];
  const f = pad(x, 4);
  let z = m.b;
  for (let i = 0; i < 4; i++) z += m.w[i] * f[i];
  return Math.tanh(z);
}
function regimeUpdate(regime, x, y) {
  const m = regimeModels[regime];
  const f = pad(x, 4);
  const yhat = regimePredict(regime, f);
  const err = yhat - Math.sign(y);
  for (let i = 0; i < 4; i++) {
    m.w[i] -= REG_LR * err * f[i];
    if (!Number.isFinite(m.w[i])) m.w[i] = 0;
  }
  m.b -= REG_LR * err;
  m.n++;
}
function regimeMultiplier(regime, x) {
  if (regimeModels[regime].n < 20) return 1;
  const p = regimePredict(regime, x);
  return 1 + Math.max(-1, Math.min(1, p)) * 0.12;
}
const moveHistory = /* @__PURE__ */ new Map();
const correlations = /* @__PURE__ */ new Map();
const HISTORY = 60;
function recordSymbolMove(symbol, ret) {
  if (!Number.isFinite(ret)) return;
  const sym = symbol.toUpperCase();
  const arr = moveHistory.get(sym) ?? [];
  arr.push({ ts: Date.now(), ret });
  if (arr.length > HISTORY) arr.shift();
  moveHistory.set(sym, arr);
}
function recomputeCorrelations(minOverlap = 20) {
  const syms = Array.from(moveHistory.keys());
  for (const a of syms) {
    const ra = moveHistory.get(a).map((m2) => m2.ret);
    const m = /* @__PURE__ */ new Map();
    for (const b of syms) {
      if (a === b) continue;
      const rb = moveHistory.get(b).map((m2) => m2.ret);
      const n = Math.min(ra.length, rb.length);
      if (n < minOverlap) continue;
      const aSlice = ra.slice(-n), bSlice = rb.slice(-n);
      const c = pearson(aSlice, bSlice);
      if (Math.abs(c) > 0.4) m.set(b, c);
    }
    correlations.set(a, m);
  }
}
function neighborPull(symbol) {
  const sym = symbol.toUpperCase();
  const corrs = correlations.get(sym);
  if (!corrs || corrs.size === 0) return 0;
  let sum = 0, wsum = 0;
  for (const [neighbor, c] of corrs) {
    const hist = moveHistory.get(neighbor);
    if (!hist || hist.length < 2) continue;
    const recent = hist[hist.length - 1].ret;
    sum += c * recent;
    wsum += Math.abs(c);
  }
  return wsum > 0 ? sum / wsum : 0;
}
function neighborMultiplier(symbol, ownSignal) {
  const pull = neighborPull(symbol);
  const agreement = Math.sign(pull) === Math.sign(ownSignal) ? 1 : -1;
  return 1 + agreement * Math.min(0.1, Math.abs(pull) * 2);
}
function pearson(a, b) {
  const n = a.length;
  if (n < 2) return 0;
  const ma = mean(a), mb = mean(b);
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) {
    const xa = a[i] - ma, xb = b[i] - mb;
    num += xa * xb;
    da += xa * xa;
    db += xb * xb;
  }
  const denom = Math.sqrt(da * db);
  return denom > 0 ? num / denom : 0;
}
function microstructure(candles) {
  if (candles.length < 5) return { amihud: 0, kyleLambda: 0, rollSpread: 0 };
  const rets = [];
  const signedFlow = [];
  for (let i = 1; i < candles.length; i++) {
    const r = (candles[i].close - candles[i - 1].close) / candles[i - 1].close;
    rets.push(r);
    signedFlow.push(Math.sign(r) * candles[i].volume);
  }
  let amihud = 0, an = 0;
  for (let i = 0; i < rets.length; i++) {
    const v = candles[i + 1].volume;
    if (v > 0) {
      amihud += Math.abs(rets[i]) / v;
      an++;
    }
  }
  amihud = an > 0 ? amihud / an * 1e6 : 0;
  const kyleLambda = simpleSlope(signedFlow, rets);
  const dp = [];
  for (let i = 1; i < candles.length; i++) dp.push(candles[i].close - candles[i - 1].close);
  let cov = 0;
  for (let i = 1; i < dp.length; i++) cov += dp[i] * dp[i - 1];
  cov /= Math.max(1, dp.length - 1);
  const rollSpread = cov < 0 ? 2 * Math.sqrt(-cov) : 0;
  return { amihud, kyleLambda, rollSpread };
}
function microMultiplier(mf, signal) {
  let mult = 1;
  if (mf.amihud > 50) mult *= 0.9;
  if (Math.sign(mf.kyleLambda) === Math.sign(signal) && Math.abs(mf.kyleLambda) > 1e-9) {
    mult *= 1.05;
  }
  if (mf.rollSpread > 0.02) mult *= 0.95;
  return mult;
}
function simpleSlope(x, y) {
  const n = Math.min(x.length, y.length);
  if (n < 3) return 0;
  const mx = mean(x.slice(0, n)), my = mean(y.slice(0, n));
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (x[i] - mx) * (y[i] - my);
    den += (x[i] - mx) ** 2;
  }
  return den > 0 ? num / den : 0;
}
const trainDist = /* @__PURE__ */ new Map();
const recentBuf = /* @__PURE__ */ new Map();
const RECENT_MAX = 100;
function recordTrainSample(feature, value) {
  if (!Number.isFinite(value)) return;
  const d = trainDist.get(feature) ?? { mean: 0, std: 0, n: 0 };
  const nNew = d.n + 1;
  const meanNew = d.mean + (value - d.mean) / nNew;
  const varAcc = d.std * d.std * d.n + (value - d.mean) * (value - meanNew);
  trainDist.set(feature, { mean: meanNew, std: Math.sqrt(varAcc / nNew), n: nNew });
}
function recordRecentSample(feature, value) {
  if (!Number.isFinite(value)) return;
  const arr = recentBuf.get(feature) ?? [];
  arr.push(value);
  if (arr.length > RECENT_MAX) arr.shift();
  recentBuf.set(feature, arr);
}
function driftScore(feature) {
  const d = trainDist.get(feature);
  const r = recentBuf.get(feature);
  if (!d || !r || d.n < 30 || r.length < 20 || d.std === 0) return 0;
  const rMean = mean(r);
  return Math.abs(rMean - d.mean) / d.std;
}
function globalDriftMultiplier() {
  const features = Array.from(trainDist.keys());
  if (features.length === 0) return 1;
  let sum = 0, n = 0;
  for (const f of features) {
    sum += driftScore(f);
    n++;
  }
  const avg = n > 0 ? sum / n : 0;
  if (avg > 0.6) return 0.75;
  if (avg > 0.3) return 0.9;
  return 1;
}
const eventHistory = [];
function expectedEventCAR(type, horizonDays = 5) {
  const matches = eventHistory.filter((e) => e.type === type && e.car.length >= horizonDays);
  if (matches.length < 5) return 0;
  const vals = matches.map((e) => e.car[Math.min(horizonDays - 1, e.car.length - 1)]);
  return mean(vals);
}
function eventMultiplier(type, signal) {
  const expected = expectedEventCAR(type);
  if (Math.abs(expected) < 5e-3) return 1;
  return 1 + (Math.sign(expected) === Math.sign(signal) ? 1 : -1) * Math.min(0.08, Math.abs(expected) * 2);
}
function pad(a, n) {
  const out = a.slice(0, n).map((v) => Number.isFinite(v) ? Math.max(-3, Math.min(3, v)) : 0);
  while (out.length < n) out.push(0);
  return out;
}
function mean(a) {
  if (a.length === 0) return 0;
  let s = 0;
  for (const v of a) s += v;
  return s / a.length;
}
function snapshotTierBState() {
  return {
    regimeModels,
    correlations: Array.from(correlations.entries()).map(([k, m]) => [k, Array.from(m.entries())]),
    trainDist: Array.from(trainDist.entries()),
    eventHistory: eventHistory.slice(-200)
  };
}
function restoreTierBState(s) {
  try {
    const obj = s;
    if (obj?.regimeModels) {
      for (const k of Object.keys(regimeModels)) {
        const m = obj.regimeModels[k];
        if (m && Array.isArray(m.w)) {
          regimeModels[k].w = m.w.slice(0, 4);
          while (regimeModels[k].w.length < 4) regimeModels[k].w.push(0);
          regimeModels[k].b = Number(m.b ?? 0);
          regimeModels[k].n = Number(m.n ?? 0);
        }
      }
    }
    if (Array.isArray(obj?.correlations)) {
      for (const [k, entries] of obj.correlations) {
        correlations.set(k, new Map(entries));
      }
    }
    if (Array.isArray(obj?.trainDist)) {
      for (const [k, v] of obj.trainDist) trainDist.set(k, v);
    }
    if (Array.isArray(obj?.eventHistory)) {
      eventHistory.push(...obj.eventHistory);
    }
  } catch {
  }
}
const bandits = {};
const symRet = {};
const symKalman = {};
const ofiHist = {};
const newsHash = [];
const sectorRet = {};
const knobs = {};
const cfBuckets = {};
const adwin = {};
function armKey(regime, confBucket, module) {
  return `${regime}|${confBucket}|${module}`;
}
function banditMultiplier(regime, confidence, modules) {
  const bucket2 = Math.floor(confidence / 10);
  let bonus = 0, n = 0;
  for (const m of modules) {
    const k = armKey(regime, bucket2, m);
    const b = bandits[k];
    if (!b || b.n < 3) continue;
    const ucb = b.mean + Math.sqrt(2 * Math.log(Math.max(1, totalPulls())) / b.n);
    bonus += Math.tanh(ucb * 4);
    n++;
  }
  if (n === 0) return 1;
  const avg = bonus / n;
  return Math.max(0.85, Math.min(1.2, 1 + avg * 0.15));
}
let _pulls = 0;
function totalPulls() {
  return Math.max(1, _pulls);
}
function banditUpdate(regime, confidence, modules, realisedPct) {
  const bucket2 = Math.floor(confidence / 10);
  const reward = Math.tanh(realisedPct * 8);
  for (const m of modules) {
    const k = armKey(regime, bucket2, m);
    const b = bandits[k] ?? (bandits[k] = { n: 0, mean: 0 });
    b.n += 1;
    _pulls += 1;
    b.mean += (reward - b.mean) / b.n;
  }
}
function kalmanBetaUpdate(symbol, stockRet, indexRet) {
  const st = symKalman[symbol] ?? (symKalman[symbol] = { beta: 1, p: 1 });
  const q = 1e-4, r = 0.01;
  st.p += q;
  const k = st.p * indexRet / (indexRet * st.p * indexRet + r);
  st.beta += k * (stockRet - st.beta * indexRet);
  st.p = (1 - k * indexRet) * st.p;
  return st.beta;
}
function kalmanDecoupleMultiplier(symbol) {
  const st = symKalman[symbol];
  if (!st) return 1;
  return Math.max(0.9, Math.min(1.15, 1 + (Math.abs(st.beta - 1) - 0.3) * 0.1));
}
function ofiProxy(symbol, closes, volumes) {
  const n = Math.min(closes.length, volumes.length);
  if (n < 10) return 0;
  let buy = 0, sell = 0;
  for (let i = 1; i < n; i++) {
    const dir = Math.sign(closes[i] - closes[i - 1]);
    if (dir > 0) buy += volumes[i];
    else if (dir < 0) sell += volumes[i];
  }
  const imb = (buy - sell) / Math.max(1, buy + sell);
  const hist = ofiHist[symbol] ?? (ofiHist[symbol] = []);
  hist.push(imb);
  if (hist.length > 50) hist.shift();
  return imb;
}
function ofiMultiplier(symbol, sigDir) {
  const hist = ofiHist[symbol];
  if (!hist || hist.length < 5 || sigDir === 0) return 1;
  const last = hist[hist.length - 1];
  const align = last * sigDir;
  return Math.max(0.9, Math.min(1.12, 1 + align * 0.2));
}
function lexicalHash(text) {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = h * 31 + text.charCodeAt(i) | 0;
  return h;
}
function newsSimilarityMultiplier(headline, sigDir) {
  if (!headline || sigDir === 0 || newsHash.length < 5) return 1;
  const h = lexicalHash(headline.toLowerCase().slice(0, 200));
  let best = 0, impact = 0;
  for (const n of newsHash) {
    const common = 32 - popcount(h ^ n.hash);
    const sim = common / 32;
    if (sim > best) {
      best = sim;
      impact = n.impact;
    }
  }
  if (best < 0.6) return 1;
  const align = Math.sign(impact) === sigDir ? 1 : -1;
  return Math.max(0.9, Math.min(1.15, 1 + align * Math.min(0.15, Math.abs(impact))));
}
function popcount(x) {
  x = x - (x >> 1 & 1431655765);
  x = (x & 858993459) + (x >> 2 & 858993459);
  return (x + (x >> 4) & 252645135) * 16843009 >> 24;
}
function recordSectorReturn(sector, ret) {
  if (!sector) return;
  const arr = sectorRet[sector] ?? (sectorRet[sector] = []);
  arr.push(ret);
  if (arr.length > 60) arr.shift();
}
function sectorRotationMultiplier(sector, sigDir) {
  if (!sector || sigDir === 0) return 1;
  const own = sectorRet[sector];
  if (!own || own.length < 10) return 1;
  const ownAvg = own.slice(-20).reduce((s, x) => s + x, 0) / Math.min(20, own.length);
  let market = 0, k = 0;
  for (const s of Object.keys(sectorRet)) {
    const v = sectorRet[s];
    if (v.length < 5) continue;
    market += v.slice(-20).reduce((a, b) => a + b, 0) / Math.min(20, v.length);
    k++;
  }
  if (k === 0) return 1;
  const rel = ownAvg - market / k;
  const align = Math.sign(rel) === sigDir ? 1 : -1;
  return Math.max(0.9, Math.min(1.12, 1 + align * Math.min(0.12, Math.abs(rel) * 20)));
}
function recordKnob(name, value, reward) {
  const k = knobs[name] ?? (knobs[name] = { samples: [], best: value });
  k.samples.push({ x: value, y: reward });
  if (k.samples.length > 200) k.samples.shift();
  const buckets2 = /* @__PURE__ */ new Map();
  for (const s of k.samples) {
    const bk = Math.round(s.x * 10) / 10;
    const b = buckets2.get(bk) ?? { n: 0, sum: 0 };
    b.n++;
    b.sum += s.y;
    buckets2.set(bk, b);
  }
  let bestVal = k.best, bestScore = -Infinity;
  for (const [bk, b] of buckets2) {
    if (b.n < 3) continue;
    const score = b.sum / b.n;
    if (score > bestScore) {
      bestScore = score;
      bestVal = bk;
    }
  }
  k.best = bestVal;
}
function recordCounterfactualBucket(confidence, realisedPct) {
  const bk = `b${Math.floor(confidence / 5) * 5}`;
  const b = cfBuckets[bk] ?? (cfBuckets[bk] = { n: 0, sum: 0 });
  b.n += 1;
  b.sum += realisedPct;
}
function adwinUpdate(name, value) {
  const a = adwin[name] ?? (adwin[name] = { window: [], mean: 0 });
  a.window.push(value);
  if (a.window.length > 200) a.window.shift();
  if (a.window.length < 30) return false;
  const half = Math.floor(a.window.length / 2);
  const left = a.window.slice(0, half);
  const right = a.window.slice(half);
  const ml = left.reduce((s, x) => s + x, 0) / left.length;
  const mr = right.reduce((s, x) => s + x, 0) / right.length;
  const sd = Math.sqrt(a.window.reduce((s, x) => s + (x - a.mean) ** 2, 0) / a.window.length);
  a.mean = (ml + mr) / 2;
  const drift = Math.abs(mr - ml) > 2 * Math.max(1e-6, sd) / Math.sqrt(half);
  if (drift) a.window = right.slice();
  return drift;
}
function driftSeverity(name) {
  const a = adwin[name];
  if (!a || a.window.length < 20) return 0;
  const half = Math.floor(a.window.length / 2);
  const ml = a.window.slice(0, half).reduce((s, x) => s + x, 0) / half;
  const mr = a.window.slice(half).reduce((s, x) => s + x, 0) / (a.window.length - half);
  return Math.abs(mr - ml);
}
function adwinMultiplier(name) {
  const sev = driftSeverity(name);
  if (sev === 0) return 1;
  return Math.max(0.8, 1 - Math.min(0.2, sev));
}
function pushSymbolReturn(symbol, ret) {
  const arr = symRet[symbol] ?? (symRet[symbol] = []);
  arr.push({ ret, ts: Date.now() });
  if (arr.length > 120) arr.shift();
}
function snapshotTierCDEState() {
  return { bandits, _pulls, symKalman, ofiHist, newsHash, sectorRet, knobs, cfBuckets, adwin, symRet };
}
function restoreTierCDEState(s) {
  if (!s || typeof s !== "object") return;
  const obj = s;
  try {
    if (obj.bandits) Object.assign(bandits, obj.bandits);
    if (typeof obj._pulls === "number") _pulls = obj._pulls;
    if (obj.symKalman) Object.assign(symKalman, obj.symKalman);
    if (obj.ofiHist) Object.assign(ofiHist, obj.ofiHist);
    if (Array.isArray(obj.newsHash)) {
      newsHash.length = 0;
      newsHash.push(...obj.newsHash);
    }
    if (obj.sectorRet) Object.assign(sectorRet, obj.sectorRet);
    if (obj.knobs) Object.assign(knobs, obj.knobs);
    if (obj.cfBuckets) Object.assign(cfBuckets, obj.cfBuckets);
    if (obj.adwin) Object.assign(adwin, obj.adwin);
    if (obj.symRet) Object.assign(symRet, obj.symRet);
  } catch {
  }
}
const featureStore = [];
const stackL2 = { w: {}, n: 0 };
const recentOutcomes = [];
let circuitOpen = false;
let circuitOpenedAt = 0;
function snapshotFeatures(symbol, feats) {
  featureStore.push({ ts: Date.now(), symbol, feats });
  if (featureStore.length > 5e3) featureStore.shift();
}
function stackL2Multiplier(tierScores) {
  let dot2 = 0, abs = 0;
  for (const k of Object.keys(tierScores)) {
    const w = stackL2.w[k] ?? 0;
    dot2 += w * tierScores[k];
    abs += Math.abs(w);
  }
  if (abs === 0 || stackL2.n < 10) return 1;
  const z = Math.tanh(dot2 / Math.max(1, abs));
  return Math.max(0.85, Math.min(1.18, 1 + z * 0.15));
}
function stackL2Update(tierScores, won) {
  const y = won ? 1 : -1;
  const lr = 0.02;
  for (const k of Object.keys(tierScores)) {
    const w = stackL2.w[k] ?? 0;
    stackL2.w[k] = w + lr * (y - Math.tanh(w * tierScores[k])) * tierScores[k];
  }
  stackL2.n++;
}
function waveletDivergence(closes) {
  if (closes.length < 16) return 0;
  const n = Math.min(64, closes.length - closes.length % 8);
  let x = closes.slice(-n);
  const energies = [];
  for (let lvl = 0; lvl < 3 && x.length >= 2; lvl++) {
    const avg = [], det = [];
    for (let i = 0; i + 1 < x.length; i += 2) {
      avg.push((x[i] + x[i + 1]) / 2);
      det.push((x[i] - x[i + 1]) / 2);
    }
    energies.push(det.reduce((s, d) => s + d * d, 0) / det.length);
    x = avg;
  }
  const ratio = energies[0] / Math.max(1e-9, energies[energies.length - 1]);
  return Math.tanh(Math.log(Math.max(1e-9, ratio)));
}
function waveletMultiplier(closes) {
  const d = waveletDivergence(closes);
  return Math.max(0.92, Math.min(1.1, 1 + (0.5 - Math.abs(d)) * 0.15));
}
function hurstExponent(series) {
  if (series.length < 20) return 0.5;
  const n = series.length;
  const mean2 = series.reduce((a, b) => a + b, 0) / n;
  const dev = series.map((x) => x - mean2);
  const cum = [];
  let s = 0;
  for (const d of dev) {
    s += d;
    cum.push(s);
  }
  const R = Math.max(...cum) - Math.min(...cum);
  const S = Math.sqrt(dev.reduce((a, b) => a + b * b, 0) / n);
  if (S === 0) return 0.5;
  const h = Math.log(R / S) / Math.log(n);
  return Math.max(0, Math.min(1, h));
}
function hurstMultiplier(closes, sigDir) {
  if (sigDir === 0 || closes.length < 20) return 1;
  const rets = [];
  for (let i = 1; i < closes.length; i++) rets.push((closes[i] - closes[i - 1]) / closes[i - 1]);
  const h = hurstExponent(rets);
  const trending = h > 0.55, reverting = h < 0.45;
  const recentDir = Math.sign(rets.slice(-5).reduce((a, b) => a + b, 0));
  if (trending && recentDir === sigDir) return 1.1;
  if (reverting && recentDir !== sigDir) return 1.08;
  return 1;
}
function volumeBars(closes, volumes, bucket2) {
  const n = Math.min(closes.length, volumes.length);
  const out = [];
  let acc = 0, open = closes[0] ?? 0, hi = -Infinity, lo = Infinity, vol = 0;
  for (let i = 0; i < n; i++) {
    acc += volumes[i];
    vol += volumes[i];
    hi = Math.max(hi, closes[i]);
    lo = Math.min(lo, closes[i]);
    if (acc >= bucket2) {
      out.push({ open, close: closes[i], high: hi, low: lo, vol });
      open = closes[i];
      hi = -Infinity;
      lo = Infinity;
      vol = 0;
      acc = 0;
    }
  }
  return out;
}
function volumeBarMultiplier(closes, volumes, sigDir) {
  if (sigDir === 0 || closes.length < 20) return 1;
  const totalVol = volumes.reduce((a, b) => a + b, 0);
  const bars = volumeBars(closes, volumes, Math.max(1, totalVol / 10));
  if (bars.length < 3) return 1;
  const last = bars[bars.length - 1];
  const trend = Math.sign(last.close - bars[0].open);
  return trend === sigDir ? 1.05 : 0.97;
}
function shapAttribution(signals) {
  const base = signals.reduce((s, x) => s + x.value * (x.weight ?? 1), 0) / Math.max(1, signals.length);
  const out = signals.map((s) => ({
    name: s.name,
    contribution: Math.abs(s.value * (s.weight ?? 1) - base)
  }));
  out.sort((a, b) => b.contribution - a.contribution);
  return out.slice(0, 5);
}
function ensembleUncertainty(signals) {
  if (signals.length === 0) return { mean: 0, std: 0, multiplier: 1 };
  const mean2 = signals.reduce((a, b) => a + b, 0) / signals.length;
  const v = signals.reduce((a, b) => a + (b - mean2) ** 2, 0) / signals.length;
  const std2 = Math.sqrt(v);
  const mul = Math.max(0.75, 1 - Math.min(0.25, std2));
  return { mean: mean2, std: std2, multiplier: mul };
}
function recordTradeOutcome(won, pct) {
  recentOutcomes.push({ ts: Date.now(), won, pct });
  if (recentOutcomes.length > 50) recentOutcomes.shift();
  if (recentOutcomes.length >= 10) {
    const last10 = recentOutcomes.slice(-10);
    const losses2 = last10.filter((x) => !x.won).length;
    if (losses2 >= 7 && !circuitOpen) {
      circuitOpen = true;
      circuitOpenedAt = Date.now();
    }
  }
  if (circuitOpen) {
    const sinceOpen = Date.now() - circuitOpenedAt;
    const last3 = recentOutcomes.slice(-3);
    if (sinceOpen > 864e5 || last3.length === 3 && last3.every((x) => x.won)) {
      circuitOpen = false;
    }
  }
}
function circuitBreakerMultiplier() {
  return circuitOpen ? 0.5 : 1;
}
function isCircuitOpen() {
  return circuitOpen;
}
function snapshotTierFGHState() {
  return {
    featureStore: featureStore.slice(-1e3),
    stackL2,
    recentOutcomes: recentOutcomes.slice(-50),
    circuitOpen,
    circuitOpenedAt
  };
}
function restoreTierFGHState(s) {
  if (!s || typeof s !== "object") return;
  const o = s;
  try {
    if (Array.isArray(o.featureStore)) {
      featureStore.length = 0;
      featureStore.push(...o.featureStore);
    }
    if (o.stackL2 && typeof o.stackL2 === "object") {
      const x = o.stackL2;
      stackL2.w = x.w ?? {};
      stackL2.n = x.n ?? 0;
    }
    if (Array.isArray(o.recentOutcomes)) {
      recentOutcomes.length = 0;
      recentOutcomes.push(...o.recentOutcomes);
    }
    if (typeof o.circuitOpen === "boolean") circuitOpen = o.circuitOpen;
    if (typeof o.circuitOpenedAt === "number") circuitOpenedAt = o.circuitOpenedAt;
  } catch {
  }
}
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const memBank = createBank(256);
const onlineModels = /* @__PURE__ */ new Map();
const provenanceLog = [];
function dailyReturns(candles) {
  const r = [];
  for (let i = 1; i < candles.length; i++) {
    const prev = candles[i - 1].close;
    if (prev > 0) r.push((candles[i].close - prev) / prev);
  }
  return r;
}
async function runAutoModules(ctx, weights = {}) {
  const signals = [];
  const candles = ctx.candles ?? [];
  const rets = candles.length > 1 ? dailyReturns(candles) : [];
  const anomaly = anomalyCheck(candles);
  if (!anomaly.ok) {
    return {
      adjustedConfidence: ctx.baseConfidence,
      rawConfidence: ctx.baseConfidence,
      signals: [],
      contributions: [],
      regime: "calm",
      diversity: 0,
      stability: 0,
      flags: { anomaly: anomaly.reason }
    };
  }
  runModule("vpin", () => {
    if (candles.length < 20) return void 0;
    const recent = candles.slice(-30);
    const trades = recent.map((c, i) => ({
      price: c.close,
      volume: c.volume,
      prevPrice: i > 0 ? recent[i - 1].close : c.open
    }));
    const avgVol = trades.reduce((s, t) => s + t.volume, 0) / trades.length;
    const buckets2 = bucketize(trades, Math.max(1, avgVol * 2));
    const v = vpin(buckets2);
    const tox = toxicityLabel(v);
    signals.push({
      name: "vpin",
      value: tox === "high" ? -0.6 : tox === "elevated" ? -0.25 : 0.1,
      confidence: Math.min(1, buckets2.length / 10)
    });
    return true;
  });
  runModule("realized_vol", () => {
    if (rets.length < 20) return void 0;
    const rv = realizedVolatility(rets);
    const sv = realizedSemivariance(rets);
    const skew = sv > 0 ? Math.min(1, sv / Math.max(1e-9, rv)) : 0;
    signals.push({
      name: "realized_vol",
      value: -Math.min(0.5, rv * 8) + (0.5 - skew) * 0.4,
      confidence: 0.7
    });
    return true;
  });
  runModule("mamba_ssm", () => {
    if (rets.length < 30) return void 0;
    const state2 = createSSM(8);
    const future = forecast(state2, rets.slice(-60));
    const meanFuture = future.reduce((s, x) => s + x, 0) / future.length;
    signals.push({
      name: "mamba_ssm",
      value: Math.max(-1, Math.min(1, meanFuture * 30)),
      confidence: 0.55
    });
    return true;
  });
  runModule("mixture_density", () => {
    if (rets.length < 30) return void 0;
    const sorted = [...rets].sort((a, b) => a - b);
    const q = (p) => sorted[Math.floor(p * (sorted.length - 1))];
    const mus = [q(0.15), q(0.5), q(0.85)];
    const std2 = Math.sqrt(rets.reduce((s, x) => s + x * x, 0) / rets.length) || 1e-6;
    const comps = buildMixture([1, 2, 1], mus, [std2, std2, std2]);
    const ev = expectedValue(comps);
    const variance2 = variance$a(comps);
    signals.push({
      name: "mixture_density",
      value: Math.max(-1, Math.min(1, ev * 40)),
      confidence: Math.max(0.2, Math.min(0.8, 1 - variance2 * 50))
    });
    return true;
  });
  runModule("diffusion_paths", () => {
    if (!(rets.length >= 20 && ctx.indicators.close > 0)) return void 0;
    const mu = rets.reduce((s, x) => s + x, 0) / rets.length;
    const sigma = Math.sqrt(rets.reduce((s, x) => s + (x - mu) ** 2, 0) / rets.length) || 1e-6;
    const paths = generatePaths(
      ctx.indicators.close,
      { steps: 10, horizon: 10, drift: mu, vol: sigma },
      40
    );
    const stats2 = pathStats(paths);
    const meanEnd = stats2.mean[stats2.mean.length - 1] ?? ctx.indicators.close;
    const expectedRet = (meanEnd - ctx.indicators.close) / ctx.indicators.close;
    signals.push({
      name: "diffusion_paths",
      value: Math.max(-1, Math.min(1, expectedRet * 20)),
      confidence: 0.5
    });
    return true;
  });
  runModule("ood_detector", () => {
    if (candles.length < 40) return void 0;
    const samples = candles.slice(-40, -5).map((c, i, arr) => {
      const prev2 = i > 0 ? arr[i - 1].close : c.close;
      const ret = prev2 > 0 ? (c.close - prev2) / prev2 : 0;
      const range = (c.high - c.low) / Math.max(1e-9, c.close);
      const volR = c.volume / Math.max(1, ctx.indicators.volAvg20 ?? 1);
      return [ret, range, volR];
    });
    const stats2 = fitDistribution(samples);
    const last = candles[candles.length - 1];
    const prev = candles[candles.length - 2] ?? last;
    const x = [
      prev.close > 0 ? (last.close - prev.close) / prev.close : 0,
      (last.high - last.low) / Math.max(1e-9, last.close),
      last.volume / Math.max(1, ctx.indicators.volAvg20 ?? 1)
    ];
    const ood = isOOD(x, stats2, 3.5);
    signals.push({ name: "ood_detector", value: ood ? -0.5 : 0.1, confidence: 0.6 });
    return true;
  });
  runModule("pattern_memory", () => {
    if (rets.length < 10) return void 0;
    const query = rets.slice(-10);
    const recall = read(memBank, query, 3);
    if (recall.neighbors.length > 0) {
      signals.push({
        name: "pattern_memory",
        value: Math.max(-1, Math.min(1, recall.prediction)),
        confidence: Math.min(0.7, recall.neighbors.length / 3)
      });
    }
    write(memBank, { key: query, value: 0, ts: Date.now() });
    return true;
  });
  runModule("garch_vol", () => {
    if (rets.length < 30) return void 0;
    const params = fitGARCH(rets);
    const volForecast = forecastVolatility(params, rets, 5);
    const avgFutureVol = volForecast.reduce((s, x) => s + x, 0) / volForecast.length;
    const currentVol = Math.sqrt(rets.reduce((s, x) => s + x * x, 0) / rets.length) || 1e-9;
    const volChange = (avgFutureVol - currentVol) / currentVol;
    signals.push({
      name: "garch_vol",
      value: Math.max(-0.8, Math.min(0.5, -volChange)),
      confidence: 0.6
    });
    return true;
  });
  runModule("hawkes_events", () => {
    if (rets.length < 30) return void 0;
    const threshold = 2 * Math.sqrt(rets.reduce((s, x) => s + x * x, 0) / rets.length);
    const eventTimes = [];
    rets.forEach((r, i) => {
      if (Math.abs(r) > threshold) eventTimes.push(i);
    });
    if (eventTimes.length < 3) return void 0;
    const params = fitHawkes(eventTimes, rets.length);
    const ratio = branchingRatio(params);
    signals.push({
      name: "hawkes_events",
      value: Math.max(-0.6, Math.min(0.2, -(ratio - 0.5) * 1)),
      confidence: 0.5
    });
    return true;
  });
  runModule("gbm_mc", () => {
    if (candles.length < 30) return void 0;
    const prices = candles.slice(-60).map((c) => c.close);
    const params = estimateGBMParams(prices);
    const result = monteCarloGBM(ctx.indicators.close, params, 10, 300);
    signals.push({
      name: "gbm_mc",
      value: Math.max(-1, Math.min(1, (result.probUp - 0.5) * 2)),
      confidence: 0.55
    });
    return true;
  });
  runModule("jump_diffusion", () => {
    if (candles.length < 40) return void 0;
    const prices = candles.slice(-80).map((c) => c.close);
    const params = estimateJumpParams(prices);
    let upCount = 0;
    const N = 200;
    for (let i = 0; i < N; i++) {
      const p = simulateJumpPath(ctx.indicators.close, params, 10);
      if (p[p.length - 1] > ctx.indicators.close) upCount++;
    }
    signals.push({
      name: "jump_diffusion",
      value: Math.max(-1, Math.min(1, (upCount / N - 0.5) * 2)),
      confidence: 0.5
    });
    return true;
  });
  runModule("agent_market", () => {
    if (candles.length < 20) return void 0;
    const fundamental = ctx.indicators.sma50 ?? ctx.indicators.close;
    const agents = createDiverseAgents(40);
    const sim = simulateAgentMarket(ctx.indicators.close, fundamental, agents, 20);
    const finalP = sim.prices[sim.prices.length - 1];
    const tilt = (finalP - ctx.indicators.close) / ctx.indicators.close;
    signals.push({
      name: "agent_market",
      value: Math.max(-1, Math.min(1, tilt * 15)),
      confidence: 0.35
    });
    return true;
  });
  runModule("bootstrap_robustness", () => {
    if (rets.length < 30) return void 0;
    const synth = generateSyntheticReturns(rets, 30);
    const synthMean = synth.reduce((s, x) => s + x, 0) / synth.length;
    const realMean = rets.slice(-30).reduce((s, x) => s + x, 0) / 30;
    const agree = Math.sign(synthMean) === Math.sign(realMean);
    signals.push({
      name: "bootstrap_robustness",
      value: agree ? Math.max(-0.5, Math.min(0.5, realMean * 30)) : 0,
      confidence: 0.4
    });
    return true;
  });
  runModule("auto_features", () => {
    if (candles.length < 20) return void 0;
    const cacheKey = {
      entity: ctx.symbol,
      feature: "auto_composite",
      version: "v1",
      bucket: candles[candles.length - 1].date
    };
    const cached = globalFeatureStore.get(cacheKey);
    let composite;
    if (typeof cached === "number") {
      composite = cached;
    } else {
      const af = generateFeatures(candles.slice(-200));
      const ts = tsfreshFeatures(rets.slice(-60));
      const r5 = af.return_5 ?? 0;
      const r20 = af.return_20 ?? 0;
      const pmaRatio = (af.price_to_ma_20 ?? 1) - 1;
      const skew = ts.skew ?? 0;
      composite = 0.4 * Math.tanh(r5 * 25) + 0.35 * Math.tanh(r20 * 10) + 0.2 * Math.tanh(pmaRatio * 8) + 0.05 * Math.tanh(skew);
      globalFeatureStore.set(cacheKey, composite);
    }
    signals.push({
      name: "auto_features",
      value: Math.max(-1, Math.min(1, composite)),
      confidence: 0.65
    });
    return true;
  });
  runModule("online_model", () => {
    if (rets.length < 20) return void 0;
    const dim = 5;
    const x = [
      Math.tanh((rets[rets.length - 1] ?? 0) * 50),
      Math.tanh((rets[rets.length - 2] ?? 0) * 50),
      Math.tanh(rets.slice(-5).reduce((s, r) => s + r, 0) * 20),
      Math.tanh(((ctx.indicators.rsi14 ?? 50) - 50) / 50),
      Math.tanh((ctx.indicators.volRatio ?? 1) - 1)
    ];
    let model = onlineModels.get(ctx.symbol);
    if (!model) {
      model = initOnlineModel(dim, 0.02, 1e-4);
      onlineModels.set(ctx.symbol, model);
    }
    const pred = predictOnline(model, x);
    const y = Math.sign(rets[rets.length - 1] ?? 0);
    onlineModels.set(ctx.symbol, partialFit(model, x, y));
    signals.push({
      name: "online_model",
      value: Math.max(-1, Math.min(1, pred)),
      confidence: 0.45
    });
    return true;
  });
  runModule("volume_profile", () => {
    const vp = volumeProfile(candles.slice(-60));
    if (!vp) return void 0;
    signals.push({ name: "volume_profile", value: vp.value, confidence: 0.55 });
    return true;
  });
  runModule("seasonality", () => {
    const s = seasonalTilt(candles);
    if (s.samples < 3) return void 0;
    signals.push({ name: "seasonality", value: s.value, confidence: 0.35 });
    return true;
  });
  runModule("smart_money", () => {
    const sm = smartMoneyFlow(candles);
    if (candles.length < 22) return void 0;
    signals.push({ name: "smart_money", value: sm.value, confidence: 0.5 });
    return true;
  });
  runModule("sgd_online", () => {
    if (rets.length < 10) return void 0;
    const x = [
      Math.tanh((rets[rets.length - 1] ?? 0) * 50),
      Math.tanh(rets.slice(-5).reduce((s, r) => s + r, 0) * 20),
      Math.tanh(((ctx.indicators.rsi14 ?? 50) - 50) / 50),
      Math.tanh((ctx.indicators.volRatio ?? 1) - 1)
    ];
    const pred = sgdPredict(ctx.symbol, x);
    signals.push({ name: "sgd_online", value: pred, confidence: 0.45 });
    return true;
  });
  runModule("ob_imbalance", () => {
    if (candles.length < 5) return void 0;
    signals.push({ name: "ob_imbalance", value: obImbalance(candles), confidence: 0.5 });
    return true;
  });
  runModule("lead_lag", () => {
    if (rets.length < 20) return void 0;
    const mkt = [];
    for (let i = 5; i < rets.length; i++) {
      const w = rets.slice(i - 5, i);
      mkt.push(w.reduce((s, x) => s + x, 0) / w.length);
    }
    const sym = rets.slice(5);
    const ll = leadLagScore(sym, mkt, 1);
    signals.push({ name: "lead_lag", value: Math.max(-1, Math.min(1, ll)), confidence: 0.4 });
    return true;
  });
  runModule("sector_graph", () => {
    const nb = neighborConsensus(ctx.sector ?? null);
    if (nb.n < 2) return void 0;
    signals.push({ name: "sector_graph", value: nb.value, confidence: Math.min(0.6, nb.n / 10) });
    return true;
  });
  const regime = detectRegime(candles);
  const learnedW = getWeightMultipliers();
  const regimeW = regimeWeights(regime);
  const symbolW = getSymbolWeightOverlay(ctx.symbol);
  const sectorW = getSectorWeightOverlay(ctx.sector);
  const finalWeights = mergeWeights(
    mergeWeights(mergeWeights(mergeWeights(weights, learnedW), regimeW), symbolW),
    sectorW
  );
  const res = integrateSignals(ctx.baseConfidence, signals, finalWeights, 0.3);
  const div = diversity(signals);
  let delta = res.adjustedConfidence - ctx.baseConfidence;
  delta *= div.multiplier;
  const rob = robustness(ctx.baseConfidence, signals, finalWeights);
  delta *= rob.multiplier;
  const mtf = multiTimeframeAgreement(candles);
  delta *= mtf.bonus;
  const psi = driftPSI(ctx.symbol, rets.slice(-60));
  delta *= driftMultiplier(psi);
  const cp = clusterPenalty(ctx.symbol, ctx.sector ?? null);
  delta *= cp;
  const rawAdjusted = Math.max(0, Math.min(100, ctx.baseConfidence + delta));
  const interval = bayesianInterval(signals, rawAdjusted);
  delta *= interval.trust;
  let conformal;
  try {
    conformal = conformalInterval(ctx.symbol, rawAdjusted, 0.1);
  } catch {
  }
  try {
    const stackMul = stackMultiplier(signals.map((s) => ({ name: s.name, value: s.value })));
    delta *= stackMul;
  } catch {
  }
  try {
    const bma = bmaMultiplier(signals.map((s) => ({ name: s.name, value: s.value })));
    delta *= bma;
  } catch {
  }
  try {
    const rawAdj = Math.max(0, Math.min(100, ctx.baseConfidence + delta));
    const dir = ctx.signal === "buy" || ctx.signal === "strong_buy" ? 1 : ctx.signal === "sell" ? -1 : 0;
    const regimeBull = regime === "trending_up" ? 1 : regime === "trending_down" ? -1 : 0;
    const regimeVol = regime === "high_vol" ? 1 : 0;
    const feats = [(rawAdj - 50) / 50, dir, 0, regimeBull, regimeVol];
    delta *= metaMultiplier(feats);
  } catch {
  }
  try {
    const reg = regimeFromContext(regime);
    const x = [
      Math.tanh((rets[rets.length - 1] ?? 0) * 50),
      Math.tanh(rets.slice(-5).reduce((s, r) => s + r, 0) * 20),
      Math.tanh(((ctx.indicators.rsi14 ?? 50) - 50) / 50),
      Math.tanh((ctx.indicators.volRatio ?? 1) - 1)
    ];
    delta *= regimeMultiplier(reg, x);
    recordRecentSample("rsi", ctx.indicators.rsi14 ?? 50);
    recordRecentSample("volRatio", ctx.indicators.volRatio ?? 1);
  } catch {
  }
  try {
    const lastRet = rets[rets.length - 1] ?? 0;
    recordSymbolMove(ctx.symbol, lastRet);
    const sigDir2 = ctx.signal === "buy" || ctx.signal === "strong_buy" ? 1 : ctx.signal === "sell" ? -1 : 0;
    delta *= neighborMultiplier(ctx.symbol, sigDir2);
  } catch {
  }
  try {
    if (candles.length >= 10) {
      const mf = microstructure(candles.slice(-30));
      const sigDir2 = ctx.signal === "buy" || ctx.signal === "strong_buy" ? 1 : ctx.signal === "sell" ? -1 : 0;
      delta *= microMultiplier(mf, sigDir2);
    }
  } catch {
  }
  try {
    delta *= globalDriftMultiplier();
  } catch {
  }
  try {
    const sigDir2 = ctx.signal === "buy" || ctx.signal === "strong_buy" ? 1 : ctx.signal === "sell" ? -1 : 0;
    delta *= banditMultiplier(
      regime,
      ctx.baseConfidence + delta,
      signals.map((s) => s.name)
    );
    const lastRet = rets[rets.length - 1] ?? 0;
    kalmanBetaUpdate(ctx.symbol, lastRet, (ctx.indexTrendPct ?? 0) / 100);
    delta *= kalmanDecoupleMultiplier(ctx.symbol);
    pushSymbolReturn(ctx.symbol, lastRet);
    if (candles.length >= 10) {
      const closes = candles.map((c) => c.close);
      const vols = candles.map((c) => c.volume);
      ofiProxy(ctx.symbol, closes, vols);
      delta *= ofiMultiplier(ctx.symbol, sigDir2);
    }
    delta *= newsSimilarityMultiplier(ctx.newsHeadline ?? null, sigDir2);
    delta *= sectorRotationMultiplier(ctx.sector ?? null, sigDir2);
    adwinUpdate(`ret:${ctx.symbol}`, lastRet);
    delta *= adwinMultiplier(`ret:${ctx.symbol}`);
  } catch {
  }
  try {
    const sigDir2 = ctx.signal === "buy" || ctx.signal === "strong_buy" ? 1 : ctx.signal === "sell" ? -1 : 0;
    const closes = candles.map((c) => c.close);
    const vols = candles.map((c) => c.volume);
    if (closes.length >= 20) {
      delta *= waveletMultiplier(closes);
      delta *= hurstMultiplier(closes, sigDir2);
      delta *= volumeBarMultiplier(closes, vols, sigDir2);
    }
    const tierScores = {
      base: (ctx.baseConfidence - 50) / 50,
      delta: Math.tanh(delta / 20),
      regime_code: regime === "trending_up" ? 1 : regime === "trending_down" ? -1 : 0
    };
    delta *= stackL2Multiplier(tierScores);
    const unc = ensembleUncertainty(signals.map((s) => s.value));
    delta *= unc.multiplier;
    delta *= circuitBreakerMultiplier();
    snapshotFeatures(ctx.symbol, {
      base: ctx.baseConfidence,
      delta,
      regime_code: tierScores.regime_code,
      rsi: ctx.indicators.rsi14 ?? 50,
      volRatio: ctx.indicators.volRatio ?? 1
    });
  } catch {
  }
  try {
    if (cusumChangePoint(rets)) delta *= 0.8;
  } catch {
  }
  try {
    delta *= contagionMultiplier(ctx.sector ?? null);
  } catch {
  }
  let hmm;
  try {
    const st = hmmState(rets);
    hmm = st;
    delta *= hmmMultiplier(st);
  } catch {
  }
  try {
    const edge = counterfactualEdge();
    if (edge < -5e-3) delta *= 0.9;
    else if (edge > 5e-3) delta *= 1.05;
  } catch {
  }
  try {
    const lastRet = rets[rets.length - 1] ?? 0;
    recordSectorMove(ctx.sector ?? null, lastRet);
  } catch {
  }
  try {
    let impAvg = 0, n = 0;
    for (const s of signals) {
      const m = importanceMultiplier(s.name);
      impAvg += m;
      n++;
    }
    if (n > 0) {
      const avg = impAvg / n;
      delta *= Math.max(0.6, Math.min(1.25, avg));
    }
  } catch {
  }
  let earningsDays = null;
  try {
    const ed = await nextEarningsDate(ctx.symbol);
    if (ed) {
      earningsDays = daysBetween(/* @__PURE__ */ new Date(), ed);
      delta *= earningsMultiplier(earningsDays);
    }
  } catch {
  }
  try {
    if (earningsDays !== null && earningsDays >= 0 && earningsDays <= 5) {
      const sigDir2 = ctx.signal === "buy" || ctx.signal === "strong_buy" ? 1 : ctx.signal === "sell" ? -1 : 0;
      delta *= eventMultiplier("earnings", sigDir2);
    }
  } catch {
  }
  let llmVerdict;
  if (ctx.useLLM && ctx.signal) {
    try {
      const llm = await sanityCheck({
        symbol: ctx.symbol,
        signal: ctx.signal,
        confidence: ctx.baseConfidence + delta,
        regime,
        signals
      });
      llmVerdict = llm.verdict;
      delta *= llm.multiplier;
    } catch {
    }
    try {
      const dbg = await multiAgentDebate({
        symbol: ctx.symbol,
        signal: ctx.signal,
        confidence: ctx.baseConfidence + delta,
        regime,
        signals: signals.map((s) => ({ name: s.name, value: s.value }))
      });
      llmVerdict = `${llmVerdict ?? ""}|debate:${dbg.verdict}`;
      delta *= dbg.multiplier;
    } catch {
    }
  }
  const finalRaw = Math.max(0, Math.min(100, ctx.baseConfidence + delta));
  const calibrated = calibratedConfidence(finalRaw);
  let blended = calibrated;
  try {
    const iso = isotonicCalibrate(finalRaw) * 100;
    blended = Math.max(0, Math.min(100, (calibrated + iso) / 2));
  } catch {
  }
  let dowAdjusted = blended;
  try {
    const mult = dowMultiplier(/* @__PURE__ */ new Date());
    dowAdjusted = Math.max(0, Math.min(100, blended * mult));
  } catch {
  }
  try {
    if (res.contributions.length > 0) {
      let mult = 1, n = 0;
      for (const c of res.contributions.slice(0, 5)) {
        mult += regimeStackWeight(regime, c.name) - 1;
        n++;
      }
      if (n > 0) {
        const adjusted = dowAdjusted * (1 + (mult - 1) / n * 0.3);
        dowAdjusted = Math.max(0, Math.min(100, adjusted));
      }
    }
  } catch {
  }
  try {
    if (res.contributions.length > 0) {
      const feats = {};
      for (const c of res.contributions.slice(0, 8)) {
        feats[c.name] = c.contribution ?? 0;
      }
      const nudge = await olScoreNudge(feats);
      dowAdjusted = Math.max(0, Math.min(100, dowAdjusted + nudge));
    }
  } catch {
  }
  try {
    const recentHeadline = ctx.latestHeadline;
    if (recentHeadline) {
      const rag = await ragQuerySimilarNews(ctx.symbol, recentHeadline);
      if (rag.count >= 3 && rag.confidence > 0.4) {
        const adj = Math.max(-12, Math.min(12, rag.avgOutcomePct * rag.confidence));
        dowAdjusted = Math.max(0, Math.min(100, dowAdjusted + adj));
      }
    }
  } catch {
  }
  try {
    const mtf2 = multiTimeframeConfirm(ctx.candles);
    if (mtf2.nudge !== 0) {
      dowAdjusted = Math.max(0, Math.min(100, dowAdjusted + mtf2.nudge));
    }
  } catch {
  }
  try {
    if (ctx.candles && ctx.candles.length >= 6 && ctx.sector) {
      const closes = ctx.candles.map((c) => c.close);
      const last = closes[closes.length - 1];
      const ref = closes[closes.length - 6];
      if (ref > 0) recordSectorReturn$1(ctx.sector, (last - ref) / ref * 100);
      const mult = sectorRotationMultiplier$1(ctx.sector);
      if (mult !== 1) {
        const adjusted = 50 + (dowAdjusted - 50) * mult;
        dowAdjusted = Math.max(0, Math.min(100, adjusted));
      }
    }
  } catch {
  }
  try {
    const patternNames = (ctx.indicators.patterns ?? []).map((p) => p.name);
    notePendingPatterns(ctx.symbol, patternNames);
    const mult = patternOutcomeMultiplier(patternNames);
    if (mult !== 1) {
      const adjusted = 50 + (dowAdjusted - 50) * mult;
      dowAdjusted = Math.max(0, Math.min(100, adjusted));
    }
  } catch {
  }
  try {
    const mult = regimeAwareMultiplier(ctx.signal, ctx.indexTrendPct);
    if (mult !== 1) {
      const adjusted = 50 + (dowAdjusted - 50) * mult;
      dowAdjusted = Math.max(0, Math.min(100, adjusted));
    }
  } catch {
  }
  try {
    const a = anomalyOutlierFilter(ctx.candles);
    if (a.multiplier !== 1) {
      const adjusted = 50 + (dowAdjusted - 50) * a.multiplier;
      dowAdjusted = Math.max(0, Math.min(100, adjusted));
    }
  } catch {
  }
  try {
    const isPick = ctx.signal === "buy" || ctx.signal === "strong_buy";
    if (isPick) {
      const mult = sectorConcentrationMultiplier(ctx.sector);
      if (mult !== 1) {
        const adjusted = 50 + (dowAdjusted - 50) * mult;
        dowAdjusted = Math.max(0, Math.min(100, adjusted));
      }
      noteSectorPick(ctx.sector);
    }
  } catch {
  }
  try {
    const mult = dowLearnedMultiplier(/* @__PURE__ */ new Date());
    if (mult !== 1) {
      dowAdjusted = Math.max(0, Math.min(100, dowAdjusted * mult));
    }
  } catch {
  }
  try {
    const mult = earningsProximityGuard(earningsDays);
    if (mult !== 1) {
      const adjusted = 50 + (dowAdjusted - 50) * mult;
      dowAdjusted = Math.max(0, Math.min(100, adjusted));
    }
  } catch {
  }
  try {
    const fromCtx = ctx;
    const mult = metaWeightedMultiplier({
      technical: fromCtx.technicalScore,
      fundamental: fromCtx.fundamentalScore,
      sentiment: fromCtx.sentimentScore,
      macro: fromCtx.macroScore,
      sector: fromCtx.sectorScore
    });
    if (mult !== 1) {
      const adjusted = 50 + (dowAdjusted - 50) * mult;
      dowAdjusted = Math.max(0, Math.min(100, adjusted));
    }
  } catch {
  }
  try {
    dowAdjusted = reliabilityCalibrate(dowAdjusted);
  } catch {
  }
  let kellyFrac = 0;
  try {
    const patternNames = (ctx.indicators.patterns ?? []).map((p) => p.name);
    kellyFrac = kellyFraction(patternNames);
  } catch {
  }
  try {
    const liq = liquidityMultiplier(ctx.candles);
    const sus = suspensionPenalty(ctx.candles);
    const m = liq * sus;
    if (m !== 1) {
      const adjusted = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adjusted));
    }
  } catch {
  }
  try {
    const m = decayMultiplier("auto-orchestrator-v2");
    if (m !== 1) {
      const adjusted = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adjusted));
    }
  } catch {
  }
  let stratFamily = "other";
  try {
    stratFamily = classifyStrategy({
      rsi: ctx.indicators.rsi14,
      close: ctx.indicators.close,
      sma50: ctx.indicators.sma50,
      bbUpper: ctx.indicators.bbUpper,
      bbLower: ctx.indicators.bbLower
    });
    const m = strategyBMAMultiplier(stratFamily);
    if (m !== 1) {
      const adjusted = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adjusted));
    }
  } catch {
  }
  try {
    recordUniverseScore(dowAdjusted);
    const m = crossSectionalMultiplier(dowAdjusted);
    if (m !== 1) {
      const adjusted = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adjusted));
    }
  } catch {
  }
  let conformalP = null;
  try {
    const hw = conformalHalfWidth(regime, 0.9);
    if (hw !== null) {
      conformalP = {
        lower: Math.max(0, dowAdjusted - hw),
        upper: Math.min(100, dowAdjusted + hw),
        halfWidth: hw
      };
    }
  } catch {
  }
  try {
    const dir = ctx.signal === "buy" || ctx.signal === "strong_buy" ? 1 : ctx.signal === "sell" ? -1 : 0;
    recordSectorSignal(ctx.sector ?? null, dir * (dowAdjusted - 50) / 50);
  } catch {
  }
  let hmmQState = "sideways";
  try {
    hmmQState = hmmRegimeQ(rets);
    const m = hmmMultiplierQ(hmmQState);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {
  }
  try {
    const rawPatterns = ctx.indicators.patterns ?? [];
    const patterns = rawPatterns.map((p) => typeof p === "string" ? p : p?.name ?? "").filter(Boolean);
    if (patterns.length) {
      const m = bayesShrinkMultiplierQ(patterns);
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {
  }
  try {
    const names = signals.map((s) => s.name);
    const m = featureImpactMultiplierQ(names);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {
  }
  try {
    for (const s of signals) recordProdFeatureQ(s.name, s.value);
    const m = driftAlarmMultiplierQ();
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {
  }
  try {
    recordConfidenceSampleQ(dowAdjusted);
    dowAdjusted = winsorizedConfidenceQ(dowAdjusted);
  } catch {
  }
  let horizons = null;
  try {
    horizons = multiHorizonForecastQ(rets);
  } catch {
  }
  let knnInfo = null;
  try {
    const featVec = signals.slice(0, 8).map((s) => Math.tanh(s.value));
    knnInfo = knnSimilarityMultiplierQ(featVec, 5);
    if (knnInfo.multiplier !== 1) {
      const adj = 50 + (dowAdjusted - 50) * knnInfo.multiplier;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {
  }
  const tierRMults = [];
  try {
    const fam = classifyStrategy({
      rsi: ctx.indicators.rsi14,
      close: ctx.indicators.close,
      sma50: ctx.indicators.sma50,
      bbUpper: ctx.indicators.bbUpper,
      bbLower: ctx.indicators.bbLower
    });
    const arm = `${fam}:${regime}`;
    const m = thompsonMultiplierR(arm);
    tierRMults.push(m);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {
  }
  try {
    const m = ipwMultiplierR(dowAdjusted);
    tierRMults.push(m);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {
  }
  try {
    const m = sectorMomentumMultiplierR(ctx.sector ?? null);
    tierRMults.push(m);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {
  }
  try {
    const ed = earningsDays !== null ? new Date(Date.now() + earningsDays * 864e5).toISOString() : null;
    const m = earningsProximityMultiplierR(ed);
    tierRMults.push(m);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {
  }
  try {
    const dev = anchoredVwapDevR(candles, 30);
    const m = anchoredVwapMultiplierR(dev?.deviationPct ?? null);
    tierRMults.push(m);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {
  }
  try {
    const fromCtx = ctx;
    if (typeof fromCtx.sentimentScore === "number") {
      recordSentimentR(ctx.symbol, fromCtx.sentimentScore);
    }
    const m = sentimentVelocityMultiplierR(ctx.symbol);
    tierRMults.push(m);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {
  }
  try {
    const vp = volumeProfileR(candles, 24);
    const m = volumeProfileMultiplierR(ctx.indicators.close, vp);
    tierRMults.push(m);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {
  }
  try {
    const m = ensembleDisagreementR(tierRMults);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {
  }
  const sigDir = ctx.signal === "buy" || ctx.signal === "strong_buy" ? 1 : ctx.signal === "sell" ? -1 : 0;
  try {
    const closes = candles.map((c) => c.close);
    if (closes.length >= 10) {
      const k = kalmanTrendS(closes);
      const m = kalmanTrendMultiplierS(ctx.indicators.close, k);
      if (m !== 1) {
        const adj = 50 + (dowAdjusted - 50) * m;
        dowAdjusted = Math.max(0, Math.min(100, adj));
      }
    }
  } catch {
  }
  try {
    const h = hurstS(rets);
    const m = hurstMultiplierS(h, sigDir);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {
  }
  try {
    const changed = cusumChangeS(rets);
    const m = cusumMultiplierS(changed);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {
  }
  try {
    const m = icMultiplierS(signals.map((s) => s.name));
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {
  }
  try {
    const m = volTargetMultiplierS(rets);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {
  }
  try {
    cachePriceForPairsS(ctx.symbol, ctx.indicators.close);
  } catch {
  }
  try {
    const last = candles[candles.length - 1];
    if (last && typeof last.open === "number") {
      const ofi = orderFlowImbalanceS({
        open: last.open,
        high: last.high,
        low: last.low,
        close: last.close
      });
      const m = orderFlowMultiplierS(ofi, sigDir);
      if (m !== 1) {
        const adj = 50 + (dowAdjusted - 50) * m;
        dowAdjusted = Math.max(0, Math.min(100, adj));
      }
    }
  } catch {
  }
  try {
    const regimeCode = regime === "trending_up" ? 1 : regime === "trending_down" ? -1 : regime === "high_vol" ? 2 : regime === "mean_reverting" ? 0.5 : 0;
    const feats = [
      (dowAdjusted - 50) / 50,
      regimeCode,
      div.agreement,
      Math.min(1, signals.length / 10)
    ];
    const m = metaConfidenceS(feats);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {
  }
  try {
    recordHmmStateT(rets);
    const m = hmmTransitionMultiplierT(rets);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {
  }
  try {
    const m = garchVolMultiplierT(rets);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {
  }
  try {
    const fam = sigDir > 0 ? "long" : sigDir < 0 ? "short" : "flat";
    const arm = `${fam}:${regime}`;
    const m = betaMultiplierT(arm);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {
  }
  try {
    const m = concentrationMultiplierT(signals.map((s) => s.value));
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {
  }
  try {
    const rsi = ctx.indicators.rsi14 ?? 50;
    const vr = ctx.indicators.volRatio ?? 1;
    recordFeatureDistT("rsi", rsi, false);
    recordFeatureDistT("volRatio", vr, false);
    const m1 = ksDriftMultiplierT("rsi");
    const m2 = ksDriftMultiplierT("volRatio");
    const m = m1 * m2;
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {
  }
  try {
    const m = permImportanceMultiplierT(signals.map((s) => s.name));
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {
  }
  try {
    const m = mwEnsembleMultiplierT(signals.map((s) => s.name));
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {
  }
  try {
    dowAdjusted = plattCalibrateT(dowAdjusted);
  } catch {
  }
  try {
    const lastRet = rets[rets.length - 1] ?? 0;
    bocpdUpdateU(lastRet);
    const m = bocpdMultiplierU();
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {
  }
  try {
    for (const s of signals) recordModuleSignalU(s.name, s.value);
    const m = transferEntropyLeaderMultiplierU(signals.map((s) => s.name));
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {
  }
  try {
    const regimeCode = regime === "trending_up" ? 1 : regime === "trending_down" ? -1 : regime === "high_vol" ? 2 : regime === "mean_reverting" ? 0.5 : 0;
    const feats = [
      (dowAdjusted - 50) / 50,
      regimeCode,
      Math.tanh((rets[rets.length - 1] ?? 0) * 50),
      Math.tanh(((ctx.indicators.rsi14 ?? 50) - 50) / 50)
    ];
    const m = sgldUncertaintyMultiplierU(feats);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {
  }
  try {
    const m = evtTailMultiplierU();
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {
  }
  try {
    const m = symbolAdaptiveMultiplierU(ctx.symbol);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {
  }
  try {
    const m = oofRegularizerMultiplierU();
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {
  }
  try {
    const m = conformalWidthMultiplierU((dowAdjusted - 50) / 50);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {
  }
  try {
    dowAdjusted = isotonicCalibrateU(dowAdjusted);
  } catch {
  }
  try {
    const tierSigs = res.contributions.slice(0, 10).map((c) => ({
      name: c.name,
      signal: c.weight > 0 ? c.contribution / c.weight : 0
    }));
    const m = tierMetaMultiplierV(regime, tierSigs);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {
  }
  try {
    const feats = {};
    for (const s of signals.slice(0, 10)) feats[s.name] = s.value;
    const m = causalLiftMultiplierW(feats);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {
  }
  try {
    const m = adversarialRobustnessMultiplierX(dowAdjusted, signals.map((s) => ({
      name: s.name,
      value: s.value,
      weight: 1
    })));
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {
  }
  try {
    const vol = ctx.indicators.atr14 && ctx.indicators.close ? ctx.indicators.atr14 / ctx.indicators.close : 0.02;
    const m = curriculumMultiplierY(vol);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {
  }
  try {
    const feats = {};
    for (const s of signals.slice(0, 12)) feats[s.name] = s.value;
    const m = imitationMultiplierZ(feats);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {
  }
  try {
    const m = hierarchicalShrinkageMultiplierAA(ctx.symbol, ctx.sector ?? "unknown");
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {
  }
  try {
    const m = sortinoMultiplierBB();
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {
  }
  try {
    const risk = ctx.indicators.atr14 && ctx.indicators.close ? Math.min(1, ctx.indicators.atr14 / ctx.indicators.close * 30) : 0.3;
    const m = paretoMultiplierCC(risk, 0.3);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {
  }
  try {
    const m = explainabilityMultiplierDD(res.contributions);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {
  }
  try {
    const m = driftMultiplierEE();
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {
  }
  try {
    const sigs = signals.map((s) => ({ name: s.name, value: s.value }));
    const m = ensembleDisagreementMultiplierFF(sigs);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {
  }
  try {
    const feats = {};
    for (const s of signals.slice(0, 15)) feats[s.name] = s.value;
    const m = featureDecayMultiplierGG(feats);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {
  }
  try {
    const m = counterfactualMultiplierHH(dowAdjusted);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {
  }
  try {
    const m = multiTimeframeConfluenceMultiplierII(
      signals.map((s) => ({ name: s.name, value: s.value }))
    );
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {
  }
  try {
    const m = microstructureMultiplierJJ(
      ctx.indicators.atr14 ?? 0,
      ctx.indicators.close ?? 0,
      ctx.indicators.volume ?? 0,
      ctx.indicators.avgVolume ?? 0
    );
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {
  }
  try {
    const m = selfDiagnosticMultiplierKK(regime);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {
  }
  try {
    const m = hyperparamMultiplierLL();
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {
  }
  try {
    const m = selfDiagnosticAgentMultiplierMM(regime, dowAdjusted);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {
  }
  try {
    const m = regimeSwitchingMultiplierOO(regime);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {
  }
  try {
    const m = sentimentVelocityMultiplierPP(ctx.symbol);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {
  }
  try {
    const m = orderBookReplayMultiplierQQ(
      ctx.indicators.close ?? 0,
      ctx.indicators.atr14 ?? 0,
      ctx.indicators.volume ?? 0,
      ctx.indicators.avgVolume ?? 0
    );
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {
  }
  try {
    const vec = signals.slice(0, 12).map((s) => s.value);
    const m = anomalyAutoQuarantineMultiplierRR(vec);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {
  }
  try {
    const m = rlOverWeightsMultiplierSS();
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {
  }
  try {
    const m = backtestingInProductionMultiplierTT();
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {
  }
  try {
    const dir = (dowAdjusted - 50) / 50;
    const m = llmMetaAnalystMultiplierUU(regime, dir);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {
  }
  try {
    const m = walkForwardICMultiplierVV();
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {
  }
  try {
    const m = crossAssetCorrelationMultiplierWW(ctx.symbol);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {
  }
  try {
    const m = optionsFlowMultiplierXX(ctx.symbol);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {
  }
  try {
    const cluster = `${ctx.sector ?? "unknown"}:${regime}`;
    const m = narrativeClusteringMultiplierYY(cluster);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {
  }
  try {
    const m = executionQualityMultiplierZZ();
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {
  }
  try {
    const sigs = signals.map((s) => ({ name: s.name, value: s.value }));
    const m = metaLearnerStackingMultiplierAAA(sigs);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {
  }
  try {
    const m = humanFeedbackMultiplierBBB(ctx.symbol);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {
  }
  try {
    const m = bayesianModelAveragingMultiplierCCC(
      regime,
      signals.map((s) => ({ name: s.name, value: s.value }))
    );
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {
  }
  try {
    const m = conformalMultiplierDDD(dowAdjusted);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {
  }
  try {
    const m = featureImportanceMultiplierEEE(
      signals.map((s) => ({ name: s.name, value: s.value }))
    );
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {
  }
  try {
    const dir = (dowAdjusted - 50) / 50;
    const m = microstructureTickMultiplierFFF(ctx.symbol, dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {
  }
  try {
    const dir = (dowAdjusted - 50) / 50;
    const events = ctx.activeEvents ?? [];
    const m = eventStudyMultiplierGGG(events, dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {
  }
  try {
    const dir = (dowAdjusted - 50) / 50;
    const price = ctx.price ?? 0;
    if (price > 0) {
      const m = kalmanTrendMultiplierHHH(ctx.symbol, price, dir);
      if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
    }
  } catch {
  }
  try {
    const m = garchVolMultiplierIII(ctx.symbol);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {
  }
  try {
    const feats = signals.slice(0, 8).map((s) => s.value);
    const m = clusterRegimeMultiplierJJJ(feats);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {
  }
  try {
    const dir = (dowAdjusted - 50) / 50;
    const m = transformerSeqMultiplierKKK(dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {
  }
  try {
    const dir = (dowAdjusted - 50) / 50;
    const sentSig = signals.find((s) => /sent|news/i.test(s.name))?.value ?? 0;
    const m = causalInferenceMultiplierLLL(sentSig, dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {
  }
  try {
    const m = adversarialRobustnessMultiplierMMM(
      signals.map((s) => ({ name: s.name, value: s.value, weight: s.confidence ?? 1 }))
    );
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {
  }
  try {
    const m = continualLearningMultiplierNNN(
      signals.map((s) => ({ name: s.name, value: s.value }))
    );
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {
  }
  try {
    const dir = (dowAdjusted - 50) / 50;
    const tf = ctx.timeframes ?? {};
    const m = multiTimeframeFusionMultiplierOOO(tf, dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {
  }
  try {
    const m = portfolioRiskParityMultiplierPPP(ctx.symbol, ctx.sector ?? "unknown");
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {
  }
  try {
    const dir = (dowAdjusted - 50) / 50;
    const m = alternativeDataFusionMultiplierQQQ(ctx.symbol, dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {
  }
  try {
    const dir = (dowAdjusted - 50) / 50;
    const m = insiderActivityMultiplierRRR(ctx.symbol, dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {
  }
  try {
    const dir = (dowAdjusted - 50) / 50;
    const m = analystRevisionMultiplierSSS(ctx.symbol, dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {
  }
  try {
    const dir = (dowAdjusted - 50) / 50;
    const m = darkPoolFlowMultiplierTTT(ctx.symbol, dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {
  }
  try {
    const dir = (dowAdjusted - 50) / 50;
    const feats = signals.slice(0, 12).map((s) => s.value);
    const m = vectorRAGMultiplierUUU(feats, dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {
  }
  try {
    const dir = (dowAdjusted - 50) / 50;
    const input = signals[0]?.value ?? dir;
    const m = lstmDeepLearningMultiplierVVV(ctx.symbol, input, dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {
  }
  try {
    const dir = (dowAdjusted - 50) / 50;
    const feats = signals.slice(0, 12).map((s) => s.value);
    const m = geneticAlgoMultiplierWWW(feats, dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {
  }
  try {
    const m = quantumInspiredMultiplierXXX(0.05, 0.05, 0.2);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {
  }
  try {
    const m = autoMLMultiplierYYY("min_confidence", 60, 60);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {
  }
  try {
    const m = multiArmedBanditMultiplierZZZ(
      regime,
      signals.map((s) => ({ name: s.name, value: s.value }))
    );
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {
  }
  try {
    const expRet = ctx.expectedGainPct ?? 3;
    const vol = 2.5;
    const horizon = ctx.timeframeDays ?? 5;
    const m = simulationPlanningMultiplierAAAA(expRet, vol, horizon);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {
  }
  try {
    const dir = (dowAdjusted - 50) / 50;
    const m = chainOfThoughtMultiplierBBBB(dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {
  }
  try {
    const m = circuitBreakerMultiplierCCCC();
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {
  }
  try {
    checkCriticalSignalFFFF(ctx.symbol, dowAdjusted, 1.04, 2);
  } catch {
  }
  try {
    const dir = (dowAdjusted - 50) / 50;
    const m = vpinMultiplierGGGG(ctx.symbol, dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {
  }
  try {
    const dir = (dowAdjusted - 50) / 50;
    const m = hawkesMultiplierHHHH(ctx.symbol, dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {
  }
  try {
    const m = kyleLambdaMultiplierIIII(ctx.symbol);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {
  }
  try {
    const dir = (dowAdjusted - 50) / 50;
    const m = pinMultiplierJJJJ(ctx.symbol, dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {
  }
  try {
    const dir = (dowAdjusted - 50) / 50;
    const treatment = signals.find((s) => s.name.toLowerCase().includes("sentiment"))?.value ?? 0;
    const m = doubleMLMultiplierKKKK(treatment, dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {
  }
  try {
    const dir = (dowAdjusted - 50) / 50;
    const m = syntheticControlMultiplierLLLL(ctx.symbol, dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {
  }
  try {
    const dir = (dowAdjusted - 50) / 50;
    const endo = signals.find((s) => s.name.toLowerCase().includes("sentiment"))?.value ?? 0;
    const m = ivMultiplierMMMM(endo, dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {
  }
  try {
    const dir = (dowAdjusted - 50) / 50;
    const running = ctx.indicators.rsi14 ?? 50;
    const m = rddMultiplierNNNN(ctx.symbol, running, dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {
  }
  try {
    const m = metacognitiveMultiplierOOOO(regime ?? "default", dowAdjusted);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {
  }
  try {
    const m = uncertaintyMultiplierPPPP(regime ?? "default");
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {
  }
  try {
    const feats = signals.slice(0, 8).map((s) => s.value);
    if (feats.length === 8) {
      recordOODTrainingQQQQ(feats);
      const m = oodMultiplierQQQQ(feats);
      if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
    }
  } catch {
  }
  try {
    recordDistributionRRRR("confidence", dowAdjusted, false);
    const m = modelDecayMultiplierRRRR("confidence");
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {
  }
  try {
    const dir = (dowAdjusted - 50) / 50;
    const feats = {};
    for (const s of signals.slice(0, 12)) feats[s.name] = s.value;
    const m = sgdMultiplierSSSS(feats, dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {
  }
  try {
    const dir = (dowAdjusted - 50) / 50;
    const m = transferMultiplierTTTT(ctx.symbol, dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {
  }
  try {
    const dir = (dowAdjusted - 50) / 50;
    const feats = signals.slice(0, 8).map((s) => s.value);
    const m = fewShotMultiplierUUUU(feats, dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {
  }
  try {
    const feats = signals.slice(0, 8).map((s) => s.value);
    const m = contrastiveMultiplierVVVV(feats);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {
  }
  try {
    const m = kellyMultiplierWWWW();
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {
  }
  try {
    const m = correlationRegimeMultiplierXXXX();
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {
  }
  try {
    const m = cvarMultiplierYYYY();
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {
  }
  try {
    const dir = (dowAdjusted - 50) / 50;
    const m = hmmRegimeMultiplierZZZZ(dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {
  }
  try {
    const feats = signals.slice(0, 8).map((s) => s.value);
    if (feats.length >= 3) {
      const m = adversarialRobustnessMultiplierAAAAA(
        feats,
        (pf) => 50 + pf.reduce((a, b) => a + b, 0)
      );
      if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
    }
  } catch {
  }
  try {
    const dir = (dowAdjusted - 50) / 50;
    const sentiment = signals.find((s) => s.name.toLowerCase().includes("sentiment"))?.value ?? 0;
    const m = counterfactualMultiplierBBBBB("sentiment", sentiment, 0, dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {
  }
  try {
    const activeTiers = signals.slice(0, 12).map((s) => s.name);
    const m = stackMultiplierCCCCC(regime ?? "default", activeTiers);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {
  }
  try {
    const dir = (dowAdjusted - 50) / 50;
    const preds = {};
    for (const s of signals.slice(0, 6)) preds[s.name] = s.value;
    const m = bmaMultiplierDDDDD(preds, dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {
  }
  try {
    const dir = (dowAdjusted - 50) / 50;
    const ind = ctx.indicators;
    const shortNow = (ind.rsi14 ?? 50) - 50;
    const mediumNow = ind.macd ?? 0;
    const longNow = (ctx.indicators.sma50 ?? 0) - (ctx.indicators.sma200 ?? 0);
    const m = tftMultiplierEEEEE(ctx.symbol, shortNow, mediumNow, longNow, 0, dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {
  }
  try {
    const dir = (dowAdjusted - 50) / 50;
    const now = Math.floor(Date.now() / 1e3);
    recordHawkesEventFFFFF(ctx.symbol, now);
    const m = hawkesMultiplierFFFFF(ctx.symbol, now, dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {
  }
  try {
    const dir = (dowAdjusted - 50) / 50;
    const series = (ctx.candles ?? []).slice(-64).map((c) => c.close);
    const m = wavenetMultiplierGGGGG(series, dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {
  }
  try {
    const dir = (dowAdjusted - 50) / 50;
    const series = (ctx.candles ?? []).slice(-60).map((c) => c.close);
    const m = nbeatsMultiplierHHHHH(series, dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {
  }
  try {
    const m = quoteStuffingMultiplierIIIII(ctx.symbol);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {
  }
  try {
    const dir = (dowAdjusted - 50) / 50;
    const m = spoofingMultiplierJJJJJ(ctx.symbol, dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {
  }
  try {
    const dir = (dowAdjusted - 50) / 50;
    const m = tradeSizeMultiplierKKKKK(ctx.symbol, dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {
  }
  try {
    const m = effectiveSpreadMultiplierLLLLL(ctx.symbol);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {
  }
  try {
    const active = signals.slice(0, 8).map((s) => s.name);
    const m = nasMultiplierMMMMM(ctx.symbol, active);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {
  }
  try {
    const m = checkpointReplayMultiplierNNNNN();
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {
  }
  try {
    const dir = (dowAdjusted - 50) / 50;
    const ind = ctx.indicators;
    const m = multiTaskMultiplierOOOOO(dir, ind.volume ?? 0, ind.atr14 ?? 0, dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {
  }
  try {
    const m = selfPlayMultiplierPPPPP(regime ?? "default");
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {
  }
  try {
    const feats = signals.slice(0, 8).map((s) => s.name);
    const m = miMultiplierQQQQQ(feats);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {
  }
  try {
    const dir = (dowAdjusted - 50) / 50;
    const m = transferEntropyMultiplierRRRRR("MARKET", ctx.symbol, dir, dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {
  }
  try {
    const series = (ctx.candles ?? []).slice(-60).map((c) => c.close);
    const m = snrMultiplierSSSSS(series);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {
  }
  try {
    const series = (ctx.candles ?? []).slice(-60).map((c) => c.close);
    const m = complexityMultiplierTTTTT(series);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {
  }
  try {
    const dir = (dowAdjusted - 50) / 50;
    const recentRets = (ctx.candles ?? []).slice(-10).map(
      (c, i, arr) => i === 0 ? 0 : (c.close - arr[i - 1].close) / arr[i - 1].close * 100
    );
    const m = prospectMultiplierUUUUU(recentRets, dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {
  }
  try {
    const m = herdingMultiplierVVVVV();
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {
  }
  try {
    const dir = (dowAdjusted - 50) / 50;
    const ind = ctx.indicators;
    if (ind.high52w && ind.low52w && ind.price) {
      const m = anchoringMultiplierWWWWW(ind.price, ind.high52w, ind.low52w, dir);
      if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
    }
  } catch {
  }
  try {
    const dir = (dowAdjusted - 50) / 50;
    const m = dispositionMultiplierXXXXX(ctx.symbol, dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {
  }
  try {
    const m = shadowMultiplierYYYYY();
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {
  }
  try {
    const candles2 = ctx.candles ?? [];
    if (candles2.length > 0) {
      const last = candles2[candles2.length - 1];
      const ts = (last.time ?? last.t ?? 0) * 1e3;
      if (ts > 0) {
        const m = latencyMultiplierZZZZZ(ts);
        if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
      }
    }
  } catch {
  }
  try {
    const m = circuitBreakerMultiplierAAAAAA();
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {
  }
  try {
    const m = plattMultiplierBBBBBB(dowAdjusted);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {
  }
  try {
    const models = res.contributions.slice(0, 8).map((c) => c.name);
    const m = bmaMultiplierCCCCCC(models);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const feats = res.contributions.slice(0, 6).map((c) => c.contribution / Math.max(0.01, c.weight));
    while (feats.length < 6) feats.push(0);
    const m = stackedMultiplierDDDDDD(feats);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const dir = (dowAdjusted - 50) / 50;
    const m = quantileMultiplierEEEEEE(ctx.symbol, dir);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const m = leakageMultiplierFFFFFF();
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const m = toxicityMultiplierGGGGGG(ctx.symbol);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const dir = (dowAdjusted - 50) / 50;
    const m = leadLagMultiplierHHHHHH("MARKET", ctx.symbol, ctx.indexTrendPct ?? 0, dir);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const m = dccMultiplierIIIIII();
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const candles2 = ctx.candles ?? [];
    if (candles2.length > 20) {
      const returns2 = [];
      for (let i = 1; i < candles2.length; i++) {
        const a = candles2[i - 1];
        const b = candles2[i];
        const pa = a.close ?? a.c ?? 0, pb = b.close ?? b.c ?? 0;
        if (pa > 0) returns2.push((pb - pa) / pa);
      }
      const m = tsrvMultiplierJJJJJJ(returns2);
      if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
    }
  } catch {
  }
  try {
    const m = activeLearningMultiplierKKKKKK(ctx.symbol);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const w = {};
    for (const c of res.contributions) w[c.name] = c.weight;
    const m = ewcMultiplierLLLLLL(w);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const m = smoteMultiplierMMMMMM();
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const vol = ctx.indicators.atr14 ?? 0.02;
    const m = curriculumMultiplierNNNNNN(vol);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const m = pboMultiplierOOOOOO();
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const observed = (dowAdjusted - 50) / 25;
    const m = deflatedSharpeMultiplierPPPPPP(observed);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const m = divergenceMultiplierQQQQQQ();
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const m = shapDriftMultiplierRRRRRR();
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const width = conformal ? conformal.upper - conformal.lower : interval.halfWidth * 2;
    queueUncertainKKKKKK(ctx.symbol, dowAdjusted, width);
  } catch {
  }
  try {
    const m = conformalMultiplierSSSSSS(ctx.symbol);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const dir = (dowAdjusted - 50) / 50;
    const m = shrinkageMultiplierTTTTTT(ctx.symbol, dir);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const candles2 = ctx.candles ?? [];
    if (candles2.length > 8) {
      const closes = candles2.map((c) => c.close ?? c.c ?? 0).filter((x) => x > 0);
      const m = gpMultiplierUUUUUU(closes);
      if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
    }
  } catch {
  }
  try {
    const m = moeMultiplierVVVVVV(regime);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const m = causalMultiplierWWWWWW("MARKET", ctx.symbol);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const feats = res.contributions.slice(0, 8).map((c) => c.contribution);
    const m = counterfactualMultiplierXXXXXX(feats);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const m = hawkesMultiplierYYYYYY(ctx.symbol);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const candles2 = ctx.candles ?? [];
    if (candles2.length >= 8) {
      const closes = candles2.map((c) => c.close ?? c.c ?? 0).filter((x) => x > 0);
      const m = waveletMultiplierZZZZZZ(closes);
      if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
    }
  } catch {
  }
  try {
    const m = mamlMultiplierAAAAAAA(ctx.symbol);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const action = dowAdjusted > 55 ? "buy" : dowAdjusted < 45 ? "sell" : "hold";
    const m = ppoMultiplierBBBBBBB(action);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const feats = res.contributions.slice(0, 8).map((c) => c.contribution / Math.max(0.01, c.weight));
    const m = ts2vecMultiplierCCCCCCC(ctx.symbol, feats);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const m = adversarialMultiplierDDDDDDD();
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const m = ftrlMultiplierEEEEEEE();
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const m = banditMultiplierFFFFFFF(regime);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const m = cfrMultiplierGGGGGGG(regime);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const m = distillationMultiplierHHHHHHH();
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const candles2 = ctx.candles ?? [];
    const closes = candles2.map((c) => c.close ?? c.c ?? 0).filter((x) => x > 0);
    if (closes.length >= 6) {
      const m = neuralOdeMultiplierIIIIIII(closes);
      if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
    }
    if (closes.length >= 16) {
      const m = tftMultiplierJJJJJJJ(closes);
      if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
    }
    if (closes.length >= 20) {
      const m = diffusionMultiplierKKKKKKK(closes);
      if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
    }
    if (closes.length > 0) {
      kalmanUpdateLLLLLLL(ctx.symbol, closes[closes.length - 1]);
    }
  } catch {
  }
  try {
    const m = kalmanMultiplierLLLLLLL(ctx.symbol);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const dir = (dowAdjusted - 50) / 50;
    const m = depthMultiplierMMMMMMM(ctx.symbol, dir);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const m = kyleMultiplierNNNNNNN(ctx.symbol);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const m = contagionMultiplierOOOOOOO(ctx.symbol);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    recordRegimePPPPPPP(ctx.symbol, regime);
    const m = hmmMultiplierPPPPPPP(ctx.symbol);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const m = federatedMultiplierQQQQQQQ(dowAdjusted);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
    recordFederatedVoteQQQQQQQ(dowAdjusted);
  } catch {
  }
  try {
    const m = nasMultiplierRRRRRRR();
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const feats = res.contributions.slice(0, 6).map((c) => c.contribution);
    const m = cpcMultiplierSSSSSSS(ctx.symbol, feats);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const m = samMultiplierTTTTTTT();
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const m = gameTheoryMultiplierUUUUUUU();
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const featNames = res.contributions.slice(0, 8).map((c) => c.name);
    const m = causalDiscoveryMultiplierVVVVVVV(featNames);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const activeCount = res.contributions.length;
    const predScore = Math.abs(dowAdjusted - 50) / 50;
    const m = infoBottleneckMultiplierWWWWWWW(activeCount, predScore);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const m = explainabilityMultiplierXXXXXXX();
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const candles2 = ctx.candles ?? [];
    const closes = candles2.map((c) => c.close ?? c.c ?? 0).filter((x) => x > 0);
    if (closes.length >= 20) {
      const m = quantileRegressionMultiplierYYYYYYY(closes);
      if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
    }
    if (closes.length >= 24) {
      const m = nbeatsMultiplierZZZZZZZ(closes);
      if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
    }
    if (closes.length > 1) {
      const lastRet = (closes[closes.length - 1] - closes[closes.length - 2]) / (closes[closes.length - 2] || 1);
      updateReservoirAAAAAAAA(ctx.symbol, lastRet);
    }
    const m1 = echoStateMultiplierAAAAAAAA(ctx.symbol);
    if (m1 !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m1, 0, 100);
    if (closes.length >= 30) {
      const m = tdaMultiplierBBBBBBBB(closes);
      if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
    }
  } catch {
  }
  try {
    const dir = (dowAdjusted - 50) / 50;
    const m = lobDynamicsMultiplierCCCCCCCC(ctx.symbol, dir);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const candles2 = ctx.candles ?? [];
    const closes = candles2.map((c) => c.close ?? c.c ?? 0).filter((x) => x > 0);
    if (closes.length >= 20) {
      const m = jumpDetectionMultiplierDDDDDDDD(closes);
      if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
    }
    if (closes.length >= 20) {
      const m = realizedKernelMultiplierEEEEEEEE(closes);
      if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
    }
  } catch {
  }
  try {
    const m = centralityMultiplierFFFFFFFF(ctx.symbol);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const sector = ctx.sector ?? "default";
    const m = loraMultiplierGGGGGGGG(sector);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const complexity = Math.min(1, res.contributions.length / 20);
    recordCurriculumHHHHHHHH(complexity);
    const m = curriculumMultiplierHHHHHHHH(complexity);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const m = mixupMultiplierIIIIIIII();
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const m = lookaheadMultiplierJJJJJJJJ();
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const candles2 = ctx.candles ?? [];
    const closes = candles2.map((c) => c.close ?? c.c ?? 0).filter((x) => x > 0);
    const m = adversarialRobustnessMultiplierKKKKKKKK(closes, dowAdjusted);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const m = isotonicCalibrationMultiplierLLLLLLLL(dowAdjusted);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const feats = res.contributions.slice(0, 6).map((c) => c.contribution);
    const m = mahalanobisOODMultiplierMMMMMMMM(feats);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const concepts = {};
    for (const c of res.contributions.slice(0, 5)) {
      const name = c.name.toLowerCase();
      if (name.includes("trend")) concepts.trend = c.contribution;
      else if (name.includes("momentum") || name.includes("rsi")) concepts.momentum = c.contribution;
      else if (name.includes("vol")) concepts.volatility = c.contribution;
      else if (name.includes("volume") || name.includes("liquid")) concepts.liquidity = c.contribution;
      else if (name.includes("sentiment") || name.includes("news")) concepts.sentiment = c.contribution;
    }
    const m = conceptBottleneckMultiplierNNNNNNNN(concepts);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const m = conformalPredictionMultiplierOOOOOOOO();
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const candles2 = ctx.candles ?? [];
    const closes = candles2.map((c) => c.close ?? c.c ?? 0).filter((x) => x > 0);
    if (closes.length >= 30) {
      const m = mixtureDensityMultiplierPPPPPPPP(closes);
      if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
    }
    if (closes.length >= 20) {
      const m = deepGaussianProcessMultiplierQQQQQQQQ(closes);
      if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
    }
    if (closes.length >= 16) {
      const m = spectralResidualMultiplierRRRRRRRR(closes);
      if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
    }
    if (closes.length >= 32) {
      const m = roughVolatilityMultiplierTTTTTTTT(closes);
      if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
    }
    if (closes.length >= 20) {
      const m = bootstrapIntervalMultiplierBBBBBBBBB(closes);
      if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
    }
    if (closes.length >= 10) {
      const m = counterfactualMultiplierAAAAAAAAA(closes, dowAdjusted);
      if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
    }
    const avgVol = ctx.avgVolume ?? 1e5;
    if (closes.length >= 20) {
      const m = liquidityVaRMultiplierVVVVVVVV(closes, avgVol);
      if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
    }
  } catch {
  }
  try {
    const m = hawkesProcessMultiplierSSSSSSSS(ctx.symbol);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const m = crossSectionalMomentumMultiplierUUUUUUUU(ctx.symbol);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const m = distillationMultiplierWWWWWWWW();
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const m = ewcMultiplierXXXXXXXX();
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    recordSnapshotYYYYYYYY(dowAdjusted);
    const m = selfDistillationMultiplierYYYYYYYY();
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const m = swaMultiplierZZZZZZZZ();
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const m = modelCardMultiplierCCCCCCCCC();
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const m = shapleyMultiplierDDDDDDDDD(res.contributions);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    if (Math.abs(dowAdjusted - 50) > 20) recordHawkesEventSSSSSSSS(ctx.symbol);
  } catch {
  }
  try {
    const sources = {};
    for (const s of signals.slice(0, 12)) {
      if (Number.isFinite(s.value)) sources[s.name] = clamp(50 + s.value * 25, 0, 100);
    }
    const m = bayesianModelAveragingMultiplier(sources);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
    const m2 = distillationFastMultiplier(sources);
    if (m2 !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m2, 0, 100);
  } catch {
  }
  try {
    const m = conformalQualityMultiplier();
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const m = counterfactualReplayMultiplier(dowAdjusted);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const m = regimeAwareActivationMultiplier(regime);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const m = activeLearningUncertaintyMultiplier(dowAdjusted);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const m = adversarialStressMultiplier();
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const sector = ctx.sector;
    const m = graphKnowledgeTransferMultiplier(sector);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const m = metaLabelTripleBarrierMultiplier(dowAdjusted);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const m = purgedCVReliabilityMultiplier();
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const active = signals.slice(0, 12).map((s) => s.name);
    const m = featureImportanceDriftMultiplier(active);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const m = isotonicEnsembleCalibMultiplier(dowAdjusted);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const sector = ctx.sector;
    const cluster = `${sector ?? "unknown"}:${regime}`;
    const m = hrpClusterRiskMultiplier(cluster);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const m = llmJudgeContradictionMultiplier({ signal: ctx.signal, regime, confidence: dowAdjusted });
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const active = signals.slice(0, 12).map((s) => s.name);
    const m = causalDiscoveryMultiplier(active);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const m = rlPositionSizingMultiplier(regime, dowAdjusted);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const m = shadowABNewLayerMultiplier();
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    void confidenceDecompositionMultiplier();
    const contributions = {};
    for (const s of signals.slice(0, 12)) contributions[s.name] = s.value;
    recordConfidenceDecomposition(ctx.symbol, contributions);
  } catch {
  }
  try {
    const sector = ctx.sector;
    const m = federatedSectorOutcomeMultiplier(sector);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    recordHMMRegime(regime);
  } catch {
  }
  try {
    const m = onlineGradientBoostingMultiplier(regime, dowAdjusted);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const m = kellyCriterionMultiplier();
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const ofi = ctx.ofi;
    const m = microstructureOFIMultiplier(ofi);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const m = walkForwardOptThresholdMultiplier(dowAdjusted);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const m = hmmRegimeMultiplier(regime);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const m = changePointCUSUMMultiplier();
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const sector = ctx.sector;
    const m = cointegrationPairsMultiplier(sector);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const m = garchVolatilityMultiplier();
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const m = newsSentimentSentinelMultiplier(ctx.symbol, ctx.signal);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const m = drawdownCircuitBreakerMultiplier();
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const hour = (/* @__PURE__ */ new Date()).getUTCHours();
    const m = timeOfDayBucketMultiplier(hour);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const m = tradeQualityScoreMultiplier(ctx.signal);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const m = adwinDriftDetectorMultiplier();
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const m = transformerSequenceMultiplier();
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const arm = `${ctx.sector ?? "unk"}:${regime}`;
    const m = thompsonSamplingBanditMultiplier(arm);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const m = syntheticBootstrapAugmentMultiplier();
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {
  }
  try {
    const width = conformal ? conformal.upper - conformal.lower : interval.halfWidth * 2;
    maybeQueueForLabel(ctx.symbol, calibrated, width);
  } catch {
  }
  let rlAction;
  try {
    rlAction = suggestAction(regime, calibrated);
  } catch {
  }
  try {
    const shadowWeights = mergeWeights(mergeWeights(weights, learnedW), symbolW);
    const shadowRes = integrateSignals(ctx.baseConfidence, signals, shadowWeights, 0.3);
    recordShadow(ctx.symbol, dowAdjusted, shadowRes.adjustedConfidence);
  } catch {
  }
  let riskPlan;
  if (ctx.signal === "buy" || ctx.signal === "strong_buy") {
    riskPlan = buildRiskPlan(ctx.indicators, 1, dowAdjusted);
  } else if (ctx.signal === "sell") {
    riskPlan = buildRiskPlan(ctx.indicators, -1, dowAdjusted);
  }
  if (riskPlan && kellyFrac > 0) {
    riskPlan.kellyFraction = kellyFrac;
  }
  try {
    provenanceLog.push(
      buildRecord({
        symbol: ctx.symbol,
        action: ctx.signal === "buy" || ctx.signal === "strong_buy" ? "buy" : ctx.signal === "sell" ? "sell" : "hold",
        baseConfidence: ctx.baseConfidence,
        adjustedConfidence: dowAdjusted,
        features: {
          regime_code: regime === "trending_up" ? 1 : regime === "trending_down" ? -1 : regime === "high_vol" ? 2 : regime === "mean_reverting" ? 0.5 : 0,
          diversity: div.agreement,
          stability: rob.stability
        },
        contributingModules: res.contributions.map((c) => ({
          name: c.name,
          weight: c.weight,
          signal: c.weight > 0 ? c.contribution / c.weight : 0
        })),
        rationale: res.contributions.slice(0, 3).map((c) => `${c.name}:${c.contribution.toFixed(2)}`).join(" | "),
        modelVersion: "auto-orchestrator-v2"
      })
    );
    if (provenanceLog.length > 5e3) provenanceLog.splice(0, provenanceLog.length - 2500);
  } catch {
  }
  return {
    adjustedConfidence: dowAdjusted,
    rawConfidence: finalRaw,
    signals,
    contributions: res.contributions,
    regime,
    diversity: div.agreement,
    stability: rob.stability,
    interval: { lower: interval.lower, upper: interval.upper, halfWidth: interval.halfWidth },
    riskPlan,
    flags: {
      drift: psi,
      earningsInDays: earningsDays,
      multiTimeframeAgree: mtf.agree,
      clusterPenalty: cp,
      llmVerdict: [llmVerdict, rlAction && `rl:${rlAction}`, hmm && `hmm:${hmm}`].filter(Boolean).join("|") || void 0,
      // H.7 SHAP-lite top contributors (stringified for log).
      ...signals.length > 0 ? { shap: shapAttribution(signals.map((s) => ({ name: s.name, value: s.value }))).map((x) => `${x.name}:${x.contribution.toFixed(2)}`).join(",") } : {},
      ...isCircuitOpen() ? { circuitBreaker: "open" } : {}
    }
  };
}
export {
  regimeUpdate as $,
  recordMetaConfidenceS as A,
  recordBetaOutcomeT as B,
  recordMWOutcomeT as C,
  recordPermSampleT as D,
  recordFeatureDistT as E,
  recordPlattOutcomeT as F,
  recordIsotonicOutcomeU as G,
  recordOOFSampleU as H,
  recordQuantileResidualU as I,
  recordLossU as J,
  recordSymbolTradeU as K,
  sgldUpdateU as L,
  recordModelOutcome as M,
  recordStrategyOutcome as N,
  addConformalResidual as O,
  isotonicAdd as P,
  dowRecord as Q,
  recordOutcome as R,
  recordFeatureOutcome as S,
  stackUpdate as T,
  sgdUpdate as U,
  recordResidual as V,
  recordCounterfactual as W,
  bmaUpdate as X,
  metaUpdate as Y,
  tripleBarrierLabel as Z,
  regimeFromContext as _,
  getHealthSummary as a,
  recordReturnYYYY as a$,
  recordTrainSample as a0,
  rewardAction as a1,
  banditUpdate as a2,
  recordCounterfactualBucket as a3,
  recordSectorReturn as a4,
  recordKnob as a5,
  stackL2Update as a6,
  regimeStackUpdate as a7,
  recordTradeOutcome as a8,
  recordTierMetaOutcomeV as a9,
  updateGarchIII as aA,
  recordClusterRegimeJJJ as aB,
  recordDecisionKKK as aC,
  recordCausalSampleLLL as aD,
  recordEWCSampleNNN as aE,
  recordTimeframeOutcomeOOO as aF,
  recordPatternUUU as aG,
  trainLstmVVV as aH,
  trainGeneticAlgoWWW as aI,
  recordThresholdOutcomeYYY as aJ,
  recordTierBanditZZZ as aK,
  recordBreakerOutcomeCCCC as aL,
  recordABSampleDDDD as aM,
  recordDoubleMLKKKK as aN,
  recordReturnLLLL as aO,
  recordIVMMMM as aP,
  recordRDDNNNN as aQ,
  recordCalibrationOOOO as aR,
  recordUncertaintyPPPP as aS,
  recordDistributionRRRR as aT,
  recordSGDOutcomeSSSS as aU,
  recordSourceReturnTTTT as aV,
  recordSymbolReturnTTTT as aW,
  recordPatternTemplateUUUU as aX,
  recordContrastiveVVVV as aY,
  recordKellyOutcomeWWWW as aZ,
  recordCorrReturnXXXX as a_,
  recordCausalSampleW as aa,
  recordWinnerPatternZ as ab,
  recordCurriculumSampleY as ac,
  recordHierarchicalOutcomeAA as ad,
  recordReturnBB as ae,
  recordParetoPointCC as af,
  recordPredictionErrorEE as ag,
  recordFeatureOutcomeGG as ah,
  recordReplayHH as ai,
  recordRegimeOutcomeKK as aj,
  recordHyperparamOutcomeLL as ak,
  recordDecisionMM as al,
  recordRegimeTransitionOO as am,
  recordFeatureVectorRR as an,
  recordRLWeightsOutcomeSS as ao,
  recordBacktestOutcomeTT as ap,
  recordTierICVV as aq,
  recordReturnsWW as ar,
  recordRangeXX as as,
  recordClusterSentimentYY as at,
  recordExecutionGapZZ as au,
  trainStackingAAA as av,
  recordTierOutcomeCCC as aw,
  recordConformalSampleDDD as ax,
  recordShapSampleEEE as ay,
  updateKalmanHHH as az,
  resetAllModules as b,
  recordDistillationWWWWWWWW as b$,
  recordRegimeReturnZZZZ as b0,
  recordCounterfactualBBBBB as b1,
  recordStackOutcomeCCCCC as b2,
  recordBMAOutcomeDDDDD as b3,
  recordTFTSampleEEEEE as b4,
  recordTradeSizeKKKKK as b5,
  recordSpreadSampleLLLLL as b6,
  recordNASOutcomeMMMMM as b7,
  recordCheckpointNNNNN as b8,
  updateCurrentPerfNNNNN as b9,
  recordMAMLAAAAAAA as bA,
  recordPPOBBBBBBB as bB,
  recordTS2VecCCCCCCC as bC,
  recordAdversarialDDDDDDD as bD,
  updateFTRLEEEEEEE as bE,
  recordBanditFFFFFFF as bF,
  recordRegretGGGGGGG as bG,
  recordDistillationHHHHHHH as bH,
  recordShockOOOOOOO as bI,
  recordArchPerfRRRRRRR as bJ,
  recordCpcSSSSSSS as bK,
  recordLossTTTTTTT as bL,
  recordAdversaryUUUUUUU as bM,
  recordCausalLinkVVVVVVV as bN,
  recordExplanationXXXXXXX as bO,
  recordDepthImbalanceMMMMMMM as bP,
  recordKyleNNNNNNN as bQ,
  recordLOBCCCCCCCC as bR,
  updateCentralityFFFFFFFF as bS,
  recordLoRAGGGGGGGG as bT,
  recordMixupIIIIIIII as bU,
  recordLookaheadJJJJJJJJ as bV,
  recordCalibrationLLLLLLLL as bW,
  recordInDistMMMMMMMM as bX,
  recordConceptNNNNNNNN as bY,
  recordConformalOOOOOOOO as bZ,
  recordCrossSectionalUUUUUUUU as b_,
  recordMultiTaskOOOOO as ba,
  recordSelfPlayPPPPP as bb,
  recordMISampleQQQQQ as bc,
  recordTESeriesRRRRR as bd,
  recordHerdingVVVVV as be,
  recordDispositionXXXXX as bf,
  recordShadowYYYYY as bg,
  recordDailyPnlAAAAAA as bh,
  recordPlattBBBBBB as bi,
  recordBMASampleCCCCCC as bj,
  recordStackedDDDDDD as bk,
  recordReturnEEEEEE as bl,
  recordFoldFFFFFF as bm,
  recordVPINBucketGGGGGG as bn,
  recordLLReturnHHHHHH as bo,
  updateDCCIIIIII as bp,
  recordClassMMMMMM as bq,
  recordCurriculumPerfNNNNNN as br,
  recordLivePnlQQQQQQ as bs,
  recordTrialSharpePPPPPP as bt,
  recordShapSnapshotRRRRRR as bu,
  recordConformalSSSSSS as bv,
  recordSectorReturnTTTTTT as bw,
  recordExpertVVVVVV as bx,
  recordCausalWWWWWW as by,
  recordHawkesEventYYYYYY as bz,
  calibrationState as c,
  restoreLDPState as c$,
  recordEWCXXXXXXXX as c0,
  recordSWAZZZZZZZZ as c1,
  recordGovernanceCCCCCCCCC as c2,
  recordBMASourceOutcome as c3,
  updateDistillation as c4,
  recordConformalCoverage as c5,
  recordCounterfactualReplay as c6,
  recordRegimeOutcomeRAT as c7,
  recordUncertaintyOutcome as c8,
  recordStressOutcome as c9,
  snapshotTierBState as cA,
  snapshotTierCDEState as cB,
  snapshotTierFGHState as cC,
  snapshotTierQState as cD,
  snapshotTierRState as cE,
  snapshotTierSState as cF,
  snapshotTierTState as cG,
  snapshotTierUState as cH,
  snapshotTierVWXState as cI,
  snapshotTierEELMState as cJ,
  snapshotTierMMTTState as cK,
  snapshotTierUUBBBState as cL,
  snapshotTierCCCPPPState as cM,
  snapshotTierQQQFFFFState as cN,
  snapshotTierGGGGRRRRState as cO,
  snapshotTierSSSSDDDDDState as cP,
  snapshotTierEEEEEPPPPPState as cQ,
  snapshotTierQQQQQBBBBBBState as cR,
  snapshotTierCCCCCCRRRRRRState as cS,
  snapshotTierSSSSSSHHHHHHHState as cT,
  snapshotTierIIIIIIIXXXXXXXState as cU,
  snapshotTierYYYYYYYNNNNNNNNState as cV,
  snapshotTierOOOOOOOODDDDDDDDDState as cW,
  snapshotTierFrontierV3State as cX,
  snapshotTierMasterIQState as cY,
  snapshotTierApexIQState as cZ,
  restoreV2State as c_,
  recordSectorOutcomeGKT as ca,
  recordMetaLabelTripleBarrier as cb,
  recordPurgedFoldOutcome as cc,
  recordFeatureImportanceFID as cd,
  recordIsotonicEnsembleOutcome as ce,
  recordHRPClusterReturn as cf,
  recordCausalLinkCDV as cg,
  recordRLPositionOutcome as ch,
  recordShadowABOutcome as ci,
  recordFederatedSectorOutcome as cj,
  recordOGBOutcome as ck,
  recordKellyOutcomeAPEX as cl,
  recordWFOSample as cm,
  recordCUSUMReturn as cn,
  recordCointegrationReturn as co,
  recordGARCHReturn as cp,
  recordDrawdownReturn as cq,
  recordTimeOfDayOutcome as cr,
  recordTradeQuality as cs,
  recordADWINOutcome as ct,
  recordTSMReturn as cu,
  recordThompsonOutcome as cv,
  recordSBAReturn as cw,
  snapshotV2State as cx,
  snapshotLDPState as cy,
  recomputeCorrelations as cz,
  resetClusterTracking as d,
  restoreTierBState as d0,
  restoreTierCDEState as d1,
  restoreTierFGHState as d2,
  restoreTierQState as d3,
  restoreTierRState as d4,
  restoreTierSState as d5,
  restoreTierTState as d6,
  restoreTierUState as d7,
  restoreTierVWXState as d8,
  restoreTierEELMState as d9,
  restoreTierMMTTState as da,
  restoreTierUUBBBState as db,
  restoreTierCCCPPPState as dc,
  restoreTierQQQFFFFState as dd,
  restoreTierGGGGRRRRState as de,
  restoreTierSSSSDDDDDState as df,
  restoreTierEEEEEPPPPPState as dg,
  restoreTierQQQQQBBBBBBState as dh,
  restoreTierCCCCCCRRRRRRState as di,
  restoreTierSSSSSSHHHHHHHState as dj,
  restoreTierIIIIIIIXXXXXXXState as dk,
  restoreTierYYYYYYYNNNNNNNNState as dl,
  restoreTierOOOOOOOODDDDDDDDDState as dm,
  restoreTierFrontierV3State as dn,
  restoreTierMasterIQState as dp,
  restoreTierApexIQState as dq,
  sanityCheck as e,
  runAutoModules as f,
  getAllScores as g,
  recordPatternOutcomeN as h,
  consumePendingPatterns as i,
  recordKellyOutcome as j,
  recordBayesOutcomeQ as k,
  recordFeatureContributionQ as l,
  recordTrainFeatureQ as m,
  recordHistoricalCaseQ as n,
  recordHmmOutcomeQ as o,
  provenanceLog as p,
  hmmRegimeQ as q,
  resetModule as r,
  shadowStats as s,
  recordDowOutcome as t,
  updateCalibration as u,
  recordCalibration as v,
  recordArmOutcomeR as w,
  recordIpwR as x,
  recordSectorReturnR as y,
  recordICSampleS as z
};
