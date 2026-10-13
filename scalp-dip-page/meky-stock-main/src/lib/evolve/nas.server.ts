/**
 * Neural Architecture Search (NAS) — random/evolutionary search over
 * candidate architectures (layer count, units, activation, dropout).
 */
export interface Architecture {
  layers: number;
  units: number[];
  activation: "relu" | "tanh" | "gelu";
  dropout: number;
}

export interface ArchScore {
  arch: Architecture;
  score: number;
}

const ACTS: Architecture["activation"][] = ["relu", "tanh", "gelu"];

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function sampleArchitecture(inputDim: number): Architecture {
  const layers = randInt(1, 5);
  const units: number[] = [];
  let prev = inputDim;
  for (let i = 0; i < layers; i++) {
    const next = Math.max(4, Math.round(prev * (0.4 + Math.random() * 0.8)));
    units.push(next);
    prev = next;
  }
  return {
    layers,
    units,
    activation: ACTS[randInt(0, 2)],
    dropout: Math.random() * 0.5,
  };
}

export function mutate(a: Architecture): Architecture {
  const next: Architecture = { ...a, units: [...a.units] };
  const r = Math.random();
  if (r < 0.25 && next.units.length < 6) next.units.push(randInt(4, 64));
  else if (r < 0.5 && next.units.length > 1) next.units.pop();
  else if (r < 0.75) next.dropout = Math.min(0.6, Math.max(0, next.dropout + (Math.random() - 0.5) * 0.2));
  else next.activation = ACTS[randInt(0, 2)];
  next.layers = next.units.length;
  return next;
}

export async function search(
  inputDim: number,
  evaluator: (a: Architecture) => Promise<number> | number,
  generations: number = 10,
  population: number = 8,
): Promise<ArchScore> {
  let pop = Array.from({ length: population }, () => sampleArchitecture(inputDim));
  let best: ArchScore = { arch: pop[0], score: -Infinity };
  for (let g = 0; g < generations; g++) {
    const scored: ArchScore[] = [];
    for (const a of pop) scored.push({ arch: a, score: await evaluator(a) });
    scored.sort((x, y) => y.score - x.score);
    if (scored[0].score > best.score) best = scored[0];
    const elites = scored.slice(0, Math.max(2, Math.floor(population / 4)));
    pop = [...elites.map((e) => e.arch), ...elites.flatMap((e) => [mutate(e.arch), mutate(e.arch), mutate(e.arch)])].slice(0, population);
  }
  return best;
}