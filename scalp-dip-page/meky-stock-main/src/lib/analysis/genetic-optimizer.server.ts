import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { MetaWeights } from "@/lib/analysis/meta-learner.server";
import { windowStartISO } from "@/lib/analysis/training-window.server";

/**
 * Genetic Algorithm refinement of meta-learner weights.
 *
 * Starts from the SGD-trained MetaWeights, then evolves a population
 * via mutation + crossover, optimizing log-loss on closed recommendations.
 * Returns the best individual if it beats the seed; otherwise returns seed.
 *
 * Fully automatic, no user input required.
 */

type Individual = { w: [number, number, number, number, number]; b: number };

const POP = 30;
const GENERATIONS = 40;
const MUT_RATE = 0.15;
const MUT_STD = 0.08;
const ELITE = 4;

function sigmoid(z: number) {
  return 1 / (1 + Math.exp(-z));
}

function logLoss(ind: Individual, X: number[][], y: number[]): number {
  let s = 0;
  for (let i = 0; i < X.length; i++) {
    const z = X[i].reduce((acc, v, k) => acc + v * ind.w[k], ind.b);
    const p = Math.max(1e-6, Math.min(1 - 1e-6, sigmoid(z)));
    s += -(y[i] * Math.log(p) + (1 - y[i]) * Math.log(1 - p));
  }
  return s / Math.max(1, X.length);
}

function rand(mean: number, std: number) {
  // Box–Muller
  const u = Math.max(1e-9, Math.random());
  const v = Math.max(1e-9, Math.random());
  return mean + std * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function mutate(ind: Individual): Individual {
  const w = ind.w.map((v) => (Math.random() < MUT_RATE ? v + rand(0, MUT_STD) : v)) as Individual["w"];
  const b = Math.random() < MUT_RATE ? ind.b + rand(0, MUT_STD) : ind.b;
  return { w, b };
}

function crossover(a: Individual, b: Individual): Individual {
  const w = a.w.map((v, k) => (Math.random() < 0.5 ? v : b.w[k])) as Individual["w"];
  const bias = Math.random() < 0.5 ? a.b : b.b;
  return { w, b: bias };
}

function normalize(ind: Individual): Individual {
  const sumPos = ind.w.reduce((s, v) => s + Math.max(0, v), 0) || 1;
  const w = ind.w.map((v) => +(Math.max(0, v) / sumPos).toFixed(4)) as Individual["w"];
  return { w, b: +ind.b.toFixed(4) };
}

export async function optimizeWeightsGA(seed: MetaWeights): Promise<MetaWeights> {
  const { data } = await supabaseAdmin
    .from("recommendations")
    .select("technical_score, fundamental_score, sentiment_score, macro_score, sector_score, outcome, realized_pct")
    .in("outcome", ["target_hit", "stop_hit", "expired"])
    .in("signal", ["buy", "strong_buy"])
    .gte("created_at", windowStartISO())
    .limit(3000);

  const rows = (data ?? []).filter(
    (r) => r.technical_score != null && r.sentiment_score != null && r.macro_score != null && r.sector_score != null,
  );
  if (rows.length < 80) return seed;

  const X = rows.map((r) => [
    Number(r.technical_score) / 100,
    Number(r.fundamental_score ?? r.technical_score) / 100,
    Number(r.sentiment_score) / 100,
    Number(r.macro_score) / 100,
    Number(r.sector_score) / 100,
  ]);
  const y = rows.map((r) =>
    r.outcome === "target_hit" || (r.realized_pct != null && Number(r.realized_pct) > 0) ? 1 : 0,
  );

  // Initial population: seed + jittered copies
  let pop: Individual[] = [{ w: [...seed.w] as Individual["w"], b: seed.b }];
  for (let i = 1; i < POP; i++) {
    pop.push(mutate({ w: [...seed.w] as Individual["w"], b: seed.b }));
  }

  let bestEver: Individual = pop[0];
  let bestLoss = logLoss(bestEver, X, y);

  for (let g = 0; g < GENERATIONS; g++) {
    const scored = pop
      .map((ind) => ({ ind, loss: logLoss(ind, X, y) }))
      .sort((a, b) => a.loss - b.loss);

    if (scored[0].loss < bestLoss) {
      bestLoss = scored[0].loss;
      bestEver = scored[0].ind;
    }

    const elites = scored.slice(0, ELITE).map((s) => s.ind);
    const next: Individual[] = [...elites];
    while (next.length < POP) {
      const a = elites[Math.floor(Math.random() * elites.length)];
      const b = scored[Math.floor(Math.random() * Math.min(scored.length, 10))].ind;
      next.push(mutate(crossover(a, b)));
    }
    pop = next;
  }

  const seedLoss = logLoss({ w: [...seed.w] as Individual["w"], b: seed.b }, X, y);
  if (bestLoss >= seedLoss) return seed;

  const best = normalize(bestEver);

  // Accuracy
  let correct = 0;
  for (let i = 0; i < X.length; i++) {
    const z = X[i].reduce((s, v, k) => s + v * best.w[k], best.b);
    if ((sigmoid(z) >= 0.5 ? 1 : 0) === y[i]) correct++;
  }

  return {
    w: best.w,
    b: best.b,
    fitted: true,
    sampleSize: rows.length,
    accuracy: +(correct / rows.length).toFixed(3),
  };
}