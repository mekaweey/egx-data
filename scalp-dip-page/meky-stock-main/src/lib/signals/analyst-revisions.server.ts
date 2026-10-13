/**
 * Analyst Revisions Momentum.
 */
export interface AnalystAction {
  date: string;
  type: "upgrade" | "downgrade" | "init_buy" | "init_sell" | "target_up" | "target_down";
  delta?: number;
}

export function revisionMomentum(actions: AnalystAction[], windowDays: number = 60): number {
  const cutoff = Date.now() - windowDays * 86400_000;
  const recent = actions.filter((a) => new Date(a.date).getTime() >= cutoff);
  let score = 0;
  for (const a of recent) {
    switch (a.type) {
      case "upgrade":
      case "init_buy":
        score += 1;
        break;
      case "downgrade":
      case "init_sell":
        score -= 1;
        break;
      case "target_up":
        score += Math.min(2, (a.delta ?? 5) / 5);
        break;
      case "target_down":
        score -= Math.min(2, Math.abs(a.delta ?? 5) / 5);
        break;
    }
  }
  return Math.tanh(score / 5);
}