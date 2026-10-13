/**
 * Model versioning + A/B testing: route traffic, measure performance.
 */

export interface ModelVersion<TFeatures, TPred> {
  id: string;
  version: string;
  predict: (f: TFeatures) => TPred;
  trafficShare: number; // 0-1
}

export interface ABResult {
  modelId: string;
  correct: number;
  total: number;
  accuracy: number;
  avgLatencyMs: number;
}

export class ABTestRouter<TFeatures, TPred> {
  private models: ModelVersion<TFeatures, TPred>[];
  private stats = new Map<string, { correct: number; total: number; latencySum: number }>();

  constructor(models: ModelVersion<TFeatures, TPred>[]) {
    const totalShare = models.reduce((s, m) => s + m.trafficShare, 0);
    this.models = models.map((m) => ({ ...m, trafficShare: m.trafficShare / totalShare }));
    for (const m of this.models) this.stats.set(m.id, { correct: 0, total: 0, latencySum: 0 });
  }

  /** Route a request to a model based on traffic share. */
  route(): ModelVersion<TFeatures, TPred> {
    const r = Math.random();
    let cum = 0;
    for (const m of this.models) {
      cum += m.trafficShare;
      if (r <= cum) return m;
    }
    return this.models[this.models.length - 1];
  }

  predict(features: TFeatures): { modelId: string; prediction: TPred } {
    const model = this.route();
    const start = performance.now();
    const prediction = model.predict(features);
    const latency = performance.now() - start;
    const s = this.stats.get(model.id)!;
    s.latencySum += latency;
    return { modelId: model.id, prediction };
  }

  recordOutcome(modelId: string, wasCorrect: boolean): void {
    const s = this.stats.get(modelId);
    if (!s) return;
    s.total++;
    if (wasCorrect) s.correct++;
  }

  getResults(): ABResult[] {
    return Array.from(this.stats.entries()).map(([modelId, s]) => ({
      modelId,
      correct: s.correct,
      total: s.total,
      accuracy: s.total === 0 ? 0 : s.correct / s.total,
      avgLatencyMs: s.total === 0 ? 0 : s.latencySum / s.total,
    }));
  }

  /** Statistical significance via two-proportion z-test. */
  isWinnerSignificant(idA: string, idB: string, alpha: number = 0.05): { winner: string | null; pValue: number } {
    const a = this.stats.get(idA);
    const b = this.stats.get(idB);
    if (!a || !b || a.total < 30 || b.total < 30) return { winner: null, pValue: 1 };
    const p1 = a.correct / a.total;
    const p2 = b.correct / b.total;
    const p = (a.correct + b.correct) / (a.total + b.total);
    const se = Math.sqrt(p * (1 - p) * (1 / a.total + 1 / b.total));
    if (se === 0) return { winner: null, pValue: 1 };
    const z = Math.abs(p1 - p2) / se;
    // Approx p-value from normal cdf
    const pValue = 2 * (1 - 0.5 * (1 + Math.tanh(z * 0.79788)));
    if (pValue >= alpha) return { winner: null, pValue };
    return { winner: p1 > p2 ? idA : idB, pValue };
  }
}