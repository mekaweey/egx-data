import { createServerFn } from "@tanstack/react-start";
import { getHealthSummary, resetModule, resetAllModules } from "./module-health.server";
import { getAllScores } from "./module-scoring.server";
import { calibrationState } from "./calibration.server";
import { ingestClosedTrades } from "./outcome-loop.server";
import { shadowStats } from "./intelligence-layer.server";

export const getModuleHealth = createServerFn({ method: "GET" }).handler(async () => {
  return {
    ...getHealthSummary(),
    scores: getAllScores(),
    calibration: calibrationState(),
    shadow: shadowStats(),
  };
});

export const resetModuleHealth = createServerFn({ method: "POST" })
  .inputValidator((data: { name?: string }) => data ?? {})
  .handler(async ({ data }) => {
    if (data.name) return { reset: resetModule(data.name) ? 1 : 0 };
    return { reset: resetAllModules() };
  });

export const runOutcomeLoop = createServerFn({ method: "POST" }).handler(async () => {
  return ingestClosedTrades(200);
});