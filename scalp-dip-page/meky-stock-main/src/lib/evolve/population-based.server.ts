/**
 * Population-Based Training — N agents train in parallel, periodically
 * exploit (copy from best) and explore (perturb hyperparameters).
 */
export interface PBTMember<H extends Record<string, number>> {
  hyperparams: H;
  score: number;
  weights: number[];
}

export function exploit<H extends Record<string, number>>(pop: PBTMember<H>[]): PBTMember<H>[] {
  const sorted = [...pop].sort((a, b) => b.score - a.score);
  const topQ = sorted.slice(0, Math.max(1, Math.floor(pop.length / 4)));
  const botQ = sorted.slice(-Math.max(1, Math.floor(pop.length / 4)));
  return pop.map((m) => {
    if (botQ.includes(m)) {
      const winner = topQ[Math.floor(Math.random() * topQ.length)];
      return { ...m, hyperparams: { ...winner.hyperparams }, weights: [...winner.weights] };
    }
    return m;
  });
}

export function explore<H extends Record<string, number>>(
  member: PBTMember<H>,
  perturbFactors: number[] = [0.8, 1.25],
): PBTMember<H> {
  const next: H = { ...member.hyperparams };
  for (const k of Object.keys(next) as Array<keyof H>) {
    const factor = perturbFactors[Math.floor(Math.random() * perturbFactors.length)];
    (next as Record<keyof H, number>)[k] = (next[k] as number) * factor;
  }
  return { ...member, hyperparams: next };
}

export function pbtStep<H extends Record<string, number>>(pop: PBTMember<H>[]): PBTMember<H>[] {
  return exploit(pop).map((m) => explore(m));
}