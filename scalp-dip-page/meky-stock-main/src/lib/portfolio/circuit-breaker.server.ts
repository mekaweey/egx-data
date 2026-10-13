// Max drawdown circuit breaker
export type CircuitState = {
  triggered: boolean;
  currentDDPct: number;
  thresholdPct: number;
  shouldHaltNewPicks: boolean;
  shouldReduceSize: boolean;
  sizeMultiplier: number;
  reason: string;
};

export function checkCircuitBreaker(
  recentReturns: number[],
  thresholdPct = 15
): CircuitState {
  const state: CircuitState = {
    triggered: false, currentDDPct: 0, thresholdPct,
    shouldHaltNewPicks: false, shouldReduceSize: false, sizeMultiplier: 1,
    reason: 'normal'
  };
  if (recentReturns.length < 5) return state;
  // Build equity curve
  let equity = 100, peak = 100, maxDD = 0;
  for (const r of recentReturns) {
    equity *= (1 + r);
    if (equity > peak) peak = equity;
    const dd = ((peak - equity) / peak) * 100;
    if (dd > maxDD) maxDD = dd;
  }
  state.currentDDPct = +maxDD.toFixed(2);
  if (maxDD >= thresholdPct) {
    state.triggered = true; state.shouldHaltNewPicks = true;
    state.sizeMultiplier = 0; state.reason = `drawdown ${maxDD.toFixed(1)}% breached ${thresholdPct}%`;
  } else if (maxDD >= thresholdPct * 0.7) {
    state.shouldReduceSize = true;
    state.sizeMultiplier = 0.5; state.reason = `drawdown ${maxDD.toFixed(1)}% nearing limit`;
  } else if (maxDD >= thresholdPct * 0.5) {
    state.sizeMultiplier = 0.75; state.reason = `cautious - DD ${maxDD.toFixed(1)}%`;
  }
  return state;
}
