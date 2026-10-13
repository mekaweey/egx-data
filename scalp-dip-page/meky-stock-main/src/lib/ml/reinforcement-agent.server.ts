/**
 * #3 Reinforcement Learning Agent (Q-learning مبسط).
 * الحالات: regime + RSI bucket. الأفعال: BUY/HOLD/SELL.
 * يتعلم من P&L كـ reward.
 */
export type RLAction = "BUY" | "HOLD" | "SELL";
export interface RLState { regime: string; rsiBucket: number }

export class RLAgent {
  private q = new Map<string, Record<RLAction, number>>();
  constructor(private alpha = 0.1, private gamma = 0.95, private epsilon = 0.1) {}

  private key(s: RLState) { return `${s.regime}|${s.rsiBucket}` }
  private get(s: RLState): Record<RLAction, number> {
    const k = this.key(s);
    if (!this.q.has(k)) this.q.set(k, { BUY: 0, HOLD: 0, SELL: 0 });
    return this.q.get(k)!;
  }

  act(s: RLState): RLAction {
    if (Math.random() < this.epsilon) {
      const acts: RLAction[] = ["BUY", "HOLD", "SELL"];
      return acts[Math.floor(Math.random() * 3)];
    }
    const qs = this.get(s);
    return (Object.entries(qs).sort((a, b) => b[1] - a[1])[0][0]) as RLAction;
  }

  update(s: RLState, a: RLAction, reward: number, next: RLState) {
    const qs = this.get(s);
    const nextMax = Math.max(...Object.values(this.get(next)));
    qs[a] = qs[a] + this.alpha * (reward + this.gamma * nextMax - qs[a]);
  }

  export() { return Object.fromEntries(this.q) }
  load(data: Record<string, Record<RLAction, number>>) {
    this.q.clear();
    Object.entries(data).forEach(([k, v]) => this.q.set(k, v));
  }
}