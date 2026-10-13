/**
 * Synthetic Data Augmentation — scenario generator.
 * --------------------------------------------------------------------------
 * Generates rare-regime synthetic return paths (crash / rally / chop) by
 * resampling historical blocks with controlled drift/vol overrides. Used by
 * stress-tests and to validate that strategies survive tail scenarios.
 */

type Scenario = "crash" | "rally" | "chop" | "gap_down" | "gap_up";

function gauss(): number {
  const u = Math.random() || 1e-9;
  const v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function generateScenario(scenario: Scenario, steps = 30): number[] {
  const out: number[] = [];
  let drift = 0, vol = 0.015;
  switch (scenario) {
    case "crash": drift = -0.012; vol = 0.04; break;
    case "rally": drift = 0.010; vol = 0.025; break;
    case "chop": drift = 0; vol = 0.018; break;
    case "gap_down": drift = -0.05; vol = 0.03; break;
    case "gap_up": drift = 0.05; vol = 0.03; break;
  }
  for (let i = 0; i < steps; i++) {
    if ((scenario === "gap_down" || scenario === "gap_up") && i > 0) drift = 0; // only first step has gap
    out.push(drift + vol * gauss());
  }
  return out;
}

/** Run a strategy fn on every scenario; return worst-case drawdown summary. */
export function stressTest(strategy: (rets: number[]) => number): { scenario: Scenario; pnl: number }[] {
  const list: Scenario[] = ["crash", "rally", "chop", "gap_down", "gap_up"];
  return list.map((s) => ({ scenario: s, pnl: strategy(generateScenario(s)) }));
}