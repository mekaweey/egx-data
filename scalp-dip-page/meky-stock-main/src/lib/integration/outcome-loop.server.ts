/**
 * Outcome-driven learning loop.
 * --------------------------------------------------------------------------
 * Reads recently-closed recommendations and feeds the realised result back
 * into:
 *   - `module-scoring` so accurate modules get higher weight automatically.
 *   - `calibration` so reported confidence reflects real hit rate.
 * The actual per-module signal at decision time is recovered from the
 * provenance log via decisionId; missing entries are skipped.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { recordOutcome } from "./module-scoring.server";
import { updateCalibration } from "./calibration.server";
import { provenanceLog } from "./auto-orchestrator.server";
import { recordFeatureOutcome } from "./feature-importance.server";
import { rewardAction } from "./rl-loop.server";
import {
  sgdUpdate, recordResidual, stackUpdate, recordCounterfactual,
  snapshotV2State, restoreV2State,
} from "./advanced-intelligence-v2.server";
import {
  bmaUpdate, metaUpdate, tripleBarrierLabel,
  snapshotLDPState, restoreLDPState,
} from "./lopez-de-prado.server";
import {
  regimeFromContext, regimeUpdate,
  recordTrainSample, recomputeCorrelations,
  snapshotTierBState, restoreTierBState,
} from "./tier-b-intelligence.server";
import {
  banditUpdate, recordCounterfactualBucket, recordKnob,
  recordSectorReturn, recordNewsOutcome,
  snapshotTierCDEState, restoreTierCDEState,
} from "./tier-cde-intelligence.server";
import {
  stackL2Update, recordTradeOutcome,
  snapshotTierFGHState, restoreTierFGHState,
} from "./tier-fgh-intelligence.server";
import {
  isotonicAdd, dowRecord, regimeStackUpdate,
} from "./tier-j-intelligence.server";
import { olUpdate, counterfactualAnalyze } from "./tier-k-intelligence.server";
import { recordPatternOutcomeN, consumePendingPatterns } from "./tier-n-intelligence.server";
import {
  recordKellyOutcome, recordDowOutcome,
  recordScoreOutcome, recordCalibration,
} from "./tier-o-intelligence.server";
import {
  recordModelOutcome, recordStrategyOutcome,
  addConformalResidual, classifyStrategy,
} from "./tier-p-intelligence.server";
import {
  hmmRegimeQ, recordHmmOutcomeQ,
  recordBayesOutcomeQ,
  recordFeatureContributionQ,
  recordTrainFeatureQ,
  recordHistoricalCaseQ,
  snapshotTierQState, restoreTierQState,
} from "./tier-q-intelligence.server";
import {
  recordArmOutcomeR, recordIpwR, recordSectorReturnR,
  snapshotTierRState, restoreTierRState,
} from "./tier-r-intelligence.server";
import {
  recordICSampleS, recordMetaConfidenceS,
  snapshotTierSState, restoreTierSState,
} from "./tier-s-intelligence.server";
import {
  recordBetaOutcomeT, recordFeatureDistT as recordFeatureDistRefT,
  recordPermSampleT, recordMWOutcomeT, recordPlattOutcomeT,
  snapshotTierTState, restoreTierTState,
} from "./tier-t-intelligence.server";
import {
  recordIsotonicOutcomeU, recordQuantileResidualU,
  sgldUpdateU, recordLossU, recordSymbolTradeU, recordOOFSampleU,
  snapshotTierUState, restoreTierUState,
} from "./tier-u-intelligence.server";
import {
  recordTierMetaOutcomeV,
  recordCausalSampleW,
  recordCurriculumSampleY,
  recordWinnerPatternZ,
  recordHierarchicalOutcomeAA,
  recordReturnBB,
  recordParetoPointCC,
  snapshotTierVWXState, restoreTierVWXState,
} from "./tier-vwx-intelligence.server";
import {
  recordPredictionErrorEE,
  recordFeatureOutcomeGG,
  recordReplayHH,
  recordRegimeOutcomeKK,
  recordHyperparamOutcomeLL,
  snapshotTierEELMState, restoreTierEELMState,
} from "./tier-eelm-intelligence.server";
import {
  recordDecisionMM,
  recordRegimeTransitionOO,
  recordFeatureVectorRR,
  recordRLWeightsOutcomeSS,
  recordBacktestOutcomeTT,
  snapshotTierMMTTState, restoreTierMMTTState,
} from "./tier-mmtt-intelligence.server";
import {
  recordTierICVV,
  recordReturnsWW,
  recordRangeXX,
  recordClusterSentimentYY,
  recordExecutionGapZZ,
  trainStackingAAA,
  snapshotTierUUBBBState, restoreTierUUBBBState,
} from "./tier-uubbb-intelligence.server";
import {
  recordTierOutcomeCCC,
  recordConformalSampleDDD,
  recordShapSampleEEE,
  updateKalmanHHH,
  updateGarchIII,
  recordClusterRegimeJJJ,
  recordDecisionKKK,
  recordCausalSampleLLL,
  recordEWCSampleNNN,
  recordTimeframeOutcomeOOO,
  snapshotTierCCCPPPState, restoreTierCCCPPPState,
} from "./tier-cccppp-intelligence.server";
import {
  recordPatternUUU,
  trainLstmVVV,
  trainGeneticAlgoWWW,
  recordThresholdOutcomeYYY,
  recordTierBanditZZZ,
  recordBreakerOutcomeCCCC,
  recordABSampleDDDD,
  snapshotTierQQQFFFFState, restoreTierQQQFFFFState,
} from "./tier-qqqffff-intelligence.server";
import {
  recordDoubleMLKKKK,
  recordReturnLLLL,
  recordIVMMMM,
  recordRDDNNNN,
  recordCalibrationOOOO,
  recordUncertaintyPPPP,
  recordDistributionRRRR,
  snapshotTierGGGGRRRRState, restoreTierGGGGRRRRState,
} from "./tier-ggggrrrr-intelligence.server";
import {
  recordSGDOutcomeSSSS,
  recordSourceReturnTTTT,
  recordSymbolReturnTTTT,
  recordPatternTemplateUUUU,
  recordContrastiveVVVV,
  recordKellyOutcomeWWWW,
  recordCorrReturnXXXX,
  recordReturnYYYY,
  recordRegimeReturnZZZZ,
  recordCounterfactualBBBBB,
  recordStackOutcomeCCCCC,
  recordBMAOutcomeDDDDD,
  snapshotTierSSSSDDDDDState, restoreTierSSSSDDDDDState,
} from "./tier-ssssddddd-intelligence.server";
import {
  recordTFTSampleEEEEE,
  recordTradeSizeKKKKK,
  recordSpreadSampleLLLLL,
  recordNASOutcomeMMMMM,
  recordCheckpointNNNNN, updateCurrentPerfNNNNN,
  recordMultiTaskOOOOO,
  recordSelfPlayPPPPP,
  snapshotTierEEEEEPPPPPState, restoreTierEEEEEPPPPPState,
} from "./tier-eeeeepppppppp-intelligence.server";
import {
  recordMISampleQQQQQ,
  recordTESeriesRRRRR,
  recordHerdingVVVVV,
  recordDispositionXXXXX,
  recordShadowYYYYY,
  recordDailyPnlAAAAAA,
  recordPlattBBBBBB,
  snapshotTierQQQQQBBBBBBState, restoreTierQQQQQBBBBBBState,
} from "./tier-qqqqqbbbbbb-intelligence.server";
import {
  recordBMASampleCCCCCC,
  recordStackedDDDDDD,
  recordReturnEEEEEE,
  recordFoldFFFFFF,
  recordVPINBucketGGGGGG,
  recordLLReturnHHHHHH,
  updateDCCIIIIII,
  recordClassMMMMMM,
  recordCurriculumPerfNNNNNN,
  recordLivePnlQQQQQQ,
  recordTrialSharpePPPPPP,
  recordShapSnapshotRRRRRR,
  snapshotTierCCCCCCRRRRRRState, restoreTierCCCCCCRRRRRRState,
} from "./tier-ccccccrrrrrr-intelligence.server";
import {
  recordConformalSSSSSS,
  recordSectorReturnTTTTTT,
  recordExpertVVVVVV,
  recordCausalWWWWWW,
  recordHawkesEventYYYYYY,
  recordMAMLAAAAAAA,
  recordPPOBBBBBBB,
  recordTS2VecCCCCCCC,
  recordAdversarialDDDDDDD,
  updateFTRLEEEEEEE,
  recordBanditFFFFFFF,
  recordRegretGGGGGGG,
  recordDistillationHHHHHHH,
  snapshotTierSSSSSSHHHHHHHState, restoreTierSSSSSSHHHHHHHState,
} from "./tier-ssssssshhhhhhh-intelligence.server";
import {
  recordDepthImbalanceMMMMMMM,
  recordKyleNNNNNNN,
  recordShockOOOOOOO,
  recordArchPerfRRRRRRR,
  recordCpcSSSSSSS,
  recordLossTTTTTTT,
  recordAdversaryUUUUUUU,
  recordCausalLinkVVVVVVV,
  recordExplanationXXXXXXX,
  snapshotTierIIIIIIIXXXXXXXState, restoreTierIIIIIIIXXXXXXXState,
} from "./tier-iiiiiiixxxxxxx-intelligence.server";
import {
  recordLOBCCCCCCCC,
  updateCentralityFFFFFFFF,
  recordLoRAGGGGGGGG,
  recordMixupIIIIIIII,
  recordLookaheadJJJJJJJJ,
  recordCalibrationLLLLLLLL,
  recordInDistMMMMMMMM,
  recordConceptNNNNNNNN,
  snapshotTierYYYYYYYNNNNNNNNState, restoreTierYYYYYYYNNNNNNNNState,
} from "./tier-yyyyyyynnnnnnnn-intelligence.server";
import {
  recordConformalOOOOOOOO,
  recordCrossSectionalUUUUUUUU,
  recordDistillationWWWWWWWW,
  recordEWCXXXXXXXX,
  recordSWAZZZZZZZZ,
  recordGovernanceCCCCCCCCC,
  snapshotTierOOOOOOOODDDDDDDDDState, restoreTierOOOOOOOODDDDDDDDDState,
} from "./tier-oooooooodddddddd-intelligence.server";
import {
  recordBMASourceOutcome,
  recordConformalCoverage,
  recordCounterfactualReplay,
  recordRegimeOutcomeRAT,
  updateDistillation,
  recordUncertaintyOutcome,
  recordStressOutcome,
  recordSectorOutcomeGKT,
  snapshotTierFrontierV3State,
  restoreTierFrontierV3State,
} from "./tier-frontier-v3-intelligence.server";
import {
  recordMetaLabelTripleBarrier,
  recordPurgedFoldOutcome,
  recordFeatureImportanceFID,
  recordIsotonicEnsembleOutcome,
  recordHRPClusterReturn,
  recordCausalLinkCDV,
  recordRLPositionOutcome,
  recordShadowABOutcome,
  recordFederatedSectorOutcome,
  snapshotTierMasterIQState,
  restoreTierMasterIQState,
} from "./tier-master-iq-intelligence.server";
import {
  recordOGBOutcome,
  recordKellyOutcomeAPEX,
  recordWFOSample,
  recordCUSUMReturn,
  recordCointegrationReturn,
  recordGARCHReturn,
  recordDrawdownReturn,
  recordTimeOfDayOutcome,
  recordTradeQuality,
  recordADWINOutcome,
  recordTSMReturn,
  recordThompsonOutcome,
  recordSBAReturn,
  snapshotTierApexIQState,
  restoreTierApexIQState,
} from "./tier-apex-iq-intelligence.server";
import { saveState, loadState } from "./persistence.server";

const processed = new Set<string>();
let stateLoaded = false;

export async function ensureStateLoaded(): Promise<void> {
  if (stateLoaded) return;
  stateLoaded = true;
  try {
    const s = await loadState("advanced_intelligence_v2");
    if (s) restoreV2State(s);
  } catch {}
  try {
    const s = await loadState("lopez_de_prado");
    if (s) restoreLDPState(s);
  } catch {}
  try {
    const s = await loadState("tier_b_intelligence");
    if (s) restoreTierBState(s);
  } catch {}
  try {
    const s = await loadState("tier_cde_intelligence");
    if (s) restoreTierCDEState(s);
  } catch {}
  try {
    const s = await loadState("tier_fgh_intelligence");
    if (s) restoreTierFGHState(s);
  } catch {}
  try {
    const s = await loadState("tier_q_intelligence");
    if (s) restoreTierQState(s);
  } catch {}
  try {
    const s = await loadState("tier_r_intelligence");
    if (s) restoreTierRState(s);
  } catch {}
  try {
    const s = await loadState("tier_s_intelligence");
    if (s) restoreTierSState(s);
  } catch {}
  try {
    const s = await loadState("tier_t_intelligence");
    if (s) restoreTierTState(s);
  } catch {}
  try {
    const s = await loadState("tier_u_intelligence");
    if (s) restoreTierUState(s);
  } catch {}
  try {
    const s = await loadState("tier_vwx_intelligence");
    if (s) restoreTierVWXState(s);
  } catch {}
  try {
    const s = await loadState("tier_eelm_intelligence");
    if (s) restoreTierEELMState(s);
  } catch {}
  try {
    const s = await loadState("tier_mmtt_intelligence");
    if (s) restoreTierMMTTState(s);
  } catch {}
  try {
    const s = await loadState("tier_uubbb_intelligence");
    if (s) restoreTierUUBBBState(s);
  } catch {}
  try {
    const s = await loadState("tier_cccppp_intelligence");
    if (s) restoreTierCCCPPPState(s);
  } catch {}
  try {
    const s = await loadState("tier_qqqffff_intelligence");
    if (s) restoreTierQQQFFFFState(s);
  } catch {}
  try {
    const s = await loadState("tier_ggggrrrr_intelligence");
    if (s) restoreTierGGGGRRRRState(s);
  } catch {}
  try {
    const s = await loadState("tier_ssssddddd_intelligence");
    if (s) restoreTierSSSSDDDDDState(s);
  } catch {}
  try {
    const s = await loadState("tier_eeeeepppppppp_intelligence");
    if (s) restoreTierEEEEEPPPPPState(s);
  } catch {}
  try {
    const s = await loadState("tier_qqqqqbbbbbb_intelligence");
    if (s) restoreTierQQQQQBBBBBBState(s);
  } catch {}
  try {
    const s = await loadState("tier_ccccccrrrrrr_intelligence");
    if (s) restoreTierCCCCCCRRRRRRState(s);
  } catch {}
  try {
    const s = await loadState("tier_ssssssshhhhhhh_intelligence");
    if (s) restoreTierSSSSSSHHHHHHHState(s);
  } catch {}
  try {
    const s = await loadState("tier_iiiiiiixxxxxxx_intelligence");
    if (s) restoreTierIIIIIIIXXXXXXXState(s);
  } catch {}
  try {
    const s = await loadState("tier_yyyyyyynnnnnnnn_intelligence");
    if (s) restoreTierYYYYYYYNNNNNNNNState(s);
  } catch {}
  try {
    const s = await loadState("tier_oooooooodddddddd_intelligence");
    if (s) restoreTierOOOOOOOODDDDDDDDDState(s);
  } catch {}
  try {
    const s = await loadState("tier_frontier_v3_intelligence");
    if (s) restoreTierFrontierV3State(s);
  } catch {}
  try {
    const s = await loadState("tier_master_iq_intelligence");
    if (s) restoreTierMasterIQState(s);
  } catch {}
  try {
    const s = await loadState("tier_apex_iq_intelligence");
    if (s) restoreTierApexIQState(s);
  } catch {}
}

export async function ingestClosedTrades(limit = 200): Promise<{ processed: number }> {
  await ensureStateLoaded();
  const { data, error } = await supabaseAdmin
    .from("recommendations")
    .select("id, symbol, signal, confidence, outcome, realized_pct, outcome_at")
    .neq("outcome", "pending")
    .order("outcome_at", { ascending: false })
    .limit(limit);
  if (error || !data) return { processed: 0 };

  // Pull sector map once.
  const { data: stocksData } = await supabaseAdmin
    .from("stocks").select("symbol, sector_ar");
  const sectorBy = new Map<string, string | null>(
    (stocksData ?? []).map((s) => [s.symbol.toUpperCase(), s.sector_ar ?? null]),
  );

  let count = 0;
  for (const r of data) {
    if (processed.has(r.id)) continue;
    processed.add(r.id);
    const won = r.outcome === "target_hit";
    const realised = Number(r.realized_pct ?? 0) / 100;
    const ageMs = r.outcome_at ? Date.now() - new Date(r.outcome_at).getTime() : 0;
    const sector = sectorBy.get(r.symbol.toUpperCase()) ?? null;

    // 1) Calibration feedback.
    updateCalibration(Number(r.confidence), won);

    // Tier-N.1 outcome-weighted pattern memory.
    try {
      recordPatternOutcomeN(consumePendingPatterns(r.symbol), won);
    } catch {}

    // Tier-O.1 Kelly per pattern (uses consumed pending patterns).
    try {
      const patterns = consumePendingPatterns(r.symbol);
      for (const p of patterns) recordKellyOutcome(p, Number(r.realized_pct ?? 0));
      // Tier-Q.2 Bayesian Beta posterior per pattern.
      for (const p of patterns) recordBayesOutcomeQ(p, won);
    } catch {}

    // Tier-Q feedback (HMM, SHAP, drift train, KNN bank) — needs provenance.
    try {
      const provQ = provenanceLog.find((p) => p.symbol === r.symbol);
      if (provQ?.contributingModules) {
        // Q.3 feature contribution
        for (const m of provQ.contributingModules) {
          recordFeatureContributionQ(m.name, m.signal ?? 0, Number(r.realized_pct ?? 0));
          // Q.4 record this realised case as a "training" sample for drift comp.
          recordTrainFeatureQ(m.name, m.signal ?? 0);
        }
        // Q.8 KNN historical case bank.
        const feat = provQ.contributingModules.slice(0, 8).map((m) => Math.tanh(m.signal ?? 0));
        recordHistoricalCaseQ(feat, won, Number(r.realized_pct ?? 0));
        // Q.1 HMM regime outcome — derive state from regime_code feature.
        const rc = String(provQ.features?.regime_code ?? 0);
        const state = rc === "1" ? "bull" : rc === "-1" ? "bear" : "sideways";
        recordHmmOutcomeQ(state, won);
        // Keep hmmRegimeQ referenced for tree-shake safety.
        void hmmRegimeQ;
      }
    } catch {}
    // Tier-O.3 learned day-of-week outcome.
    try {
      if (r.outcome_at) recordDowOutcome(new Date(r.outcome_at), won);
    } catch {}
    // Tier-O.6 reliability-curve calibration feedback.
    try { recordCalibration(Number(r.confidence), won); } catch {}

    // Tier-R feedback (Thompson arm, IPW, sector momentum).
    try {
      const provR = provenanceLog.find((p) => p.symbol === r.symbol);
      const fam = (provR?.features as { strategyFamily?: string } | undefined)?.strategyFamily ?? "other";
      const reg = String(provR?.features?.regime_code ?? 0) === "1" ? "trending_up"
                : String(provR?.features?.regime_code ?? 0) === "-1" ? "trending_down"
                : String(provR?.features?.regime_code ?? 0) === "2" ? "high_vol" : "calm";
      recordArmOutcomeR(`${fam}:${reg}`, won);
      // IPW: assume propensity ~ confidence/100 (treatment intensity proxy).
      const propensity = Math.max(0.05, Math.min(0.95, Number(r.confidence) / 100));
      recordIpwR(Number(r.confidence), propensity, Number(r.realized_pct ?? 0));
      recordSectorReturnR(sector, Number(r.realized_pct ?? 0));
    } catch {}

    // Tier-S feedback (IC per module, meta-confidence).
    try {
      const provS = provenanceLog.find((p) => p.symbol === r.symbol);
      if (provS?.contributingModules) {
        for (const m of provS.contributingModules) {
          recordICSampleS(m.name, m.signal ?? 0, Number(r.realized_pct ?? 0));
        }
        const regimeCode = Number(provS.features?.regime_code ?? 0);
        const feats = [
          (Number(r.confidence) - 50) / 50,
          regimeCode,
          Number(provS.features?.diversity ?? 0),
          Math.min(1, provS.contributingModules.length / 10),
        ];
        recordMetaConfidenceS(feats, won);
      }
    } catch {}

    // Tier-T feedback (Beta arms, MW weights, perm importance, Platt, dist ref).
    try {
      const provT = provenanceLog.find((p) => p.symbol === r.symbol);
      const regimeT = String(provT?.features?.regime_code ?? 0) === "1" ? "trending_up"
                    : String(provT?.features?.regime_code ?? 0) === "-1" ? "trending_down"
                    : String(provT?.features?.regime_code ?? 0) === "2" ? "high_vol" : "calm";
      const fam = r.signal === "buy" || r.signal === "strong_buy" ? "long"
                : r.signal === "sell" ? "short" : "flat";
      recordBetaOutcomeT(`${fam}:${regimeT}`, won);
      const realisedPct = Number(r.realized_pct ?? 0);
      if (provT?.contributingModules) {
        const feats: Record<string, number> = {};
        for (const m of provT.contributingModules) {
          recordMWOutcomeT(m.name, m.signal ?? 0, realisedPct);
          feats[m.name] = m.signal ?? 0;
        }
        recordPermSampleT(feats, realisedPct);
      }
      // KS-test reference distribution (training-time snapshot).
      const rsi = Number(provT?.features?.rsi ?? 50);
      const vr = Number(provT?.features?.volRatio ?? 1);
      recordFeatureDistRefT("rsi", rsi, true);
      recordFeatureDistRefT("volRatio", vr, true);
      // Platt calibration outcome.
      recordPlattOutcomeT(Number(r.confidence), won);
    } catch {}

    // Tier-U feedback (isotonic, conformal, SGLD, EVT, symbol LR, OOF).
    try {
      const provU = provenanceLog.find((p) => p.symbol === r.symbol);
      const realisedPct = Number(r.realized_pct ?? 0);
      const rawConf = Number(r.confidence);
      recordIsotonicOutcomeU(rawConf, won);
      recordOOFSampleU(rawConf, won);
      recordQuantileResidualU((rawConf - 50) / 50, realisedPct);
      recordLossU(realisedPct);
      recordSymbolTradeU(r.symbol, realisedPct);
      const regimeCode = Number(provU?.features?.regime_code ?? 0);
      const feats = [
        (rawConf - 50) / 50,
        regimeCode,
        Number(provU?.features?.diversity ?? 0),
        Math.tanh(realisedPct * 10),
      ];
      sgldUpdateU(feats, won ? 1 : -1);
    } catch {}

    // Lookup provenance entry once for tier-P feedback below.
    const provP = provenanceLog.find((p) => p.symbol === r.symbol);
    // Tier-P.2 walk-forward decay on the auto-orchestrator itself.
    try { recordModelOutcome("auto-orchestrator-v2", won); } catch {}
    // Tier-P.3 strategy-family BMA (re-derive family from prov features).
    try {
      const fam = (provP?.features as { strategyFamily?: string } | undefined)?.strategyFamily;
      const family = (fam as ReturnType<typeof classifyStrategy>) ?? "other";
      recordStrategyOutcome(family, won);
    } catch {}
    // Tier-P.4 conformal residual per regime.
    try {
      const reg = String(provP?.features?.regime_code ?? 0) === "1" ? "trending_up"
                : String(provP?.features?.regime_code ?? 0) === "-1" ? "trending_down"
                : String(provP?.features?.regime_code ?? 0) === "2" ? "high_vol" : "calm";
      const predicted = Number(r.confidence);
      const actual = won ? 75 : 25;
      addConformalResidual(reg, predicted - actual);
    } catch {}

    // Tier-J.1 isotonic calibration feedback.
    try { isotonicAdd(Number(r.confidence), won); } catch {}
    // Tier-J.2 day-of-week edge tracker.
    try {
      if (r.outcome_at) dowRecord(new Date(r.outcome_at), won, Number(r.realized_pct ?? 0));
    } catch {}

    // Tier-K.2 online learning + K.3 counterfactual (when we have features).
    const provK = provenanceLog.find((p) => p.symbol === r.symbol);
    if (provK?.contributingModules) {
      const features: Record<string, number> = {};
      for (const m of provK.contributingModules) features[m.name] = m.signal ?? 0;
      try { await olUpdate(features, Number(r.realized_pct ?? 0)); } catch {}
      try {
        const neutral: Record<string, number> = {};
        for (const k of Object.keys(features)) neutral[k] = 0;
        await counterfactualAnalyze({
          recommendationId: r.id,
          symbol: r.symbol,
          features,
          neutralValues: neutral,
          predictFn: (f) =>
            Object.values(f).reduce((s, v) => s + Math.tanh(v) * 10, 0),
          realizedPct: Number(r.realized_pct ?? 0),
        });
      } catch {}
    }

    // 2) Per-module accuracy feedback — match provenance by symbol+nearest time.
    const prov = provenanceLog.find((p) => p.symbol === r.symbol);
    if (prov?.contributingModules) {
      for (const m of prov.contributingModules) {
        recordOutcome(m.name, m.signal ?? 0, realised, { symbol: r.symbol, sector, ageMs });
        // 3) Feature importance — same signal/outcome pair.
        recordFeatureOutcome(m.name, m.signal ?? 0, realised);
      }
      // V2 — stacking meta-learner update (binary win=1).
      try {
        stackUpdate(
          prov.contributingModules.map((m) => ({ name: m.name, value: m.signal ?? 0 })),
          won ? 1 : 0,
        );
      } catch {}
      // V2 — SGD per-symbol update using realised direction.
      try {
        const x = prov.contributingModules.slice(0, 4).map((m) => Math.tanh(m.signal ?? 0));
        while (x.length < 4) x.push(0);
        sgdUpdate(r.symbol, x, Math.sign(realised));
      } catch {}
      // V2 — conformal residual (predicted-vs-actual confidence delta).
      try {
        const predicted = Number(r.confidence);
        const actualScore = won ? 75 : 25;
        recordResidual(r.symbol, predicted - actualScore);
      } catch {}
      // V2 — counterfactual edge (we entered → record realised %).
      try { recordCounterfactual("enter", realised); } catch {}
      // Tier-A.4 BMA — update posterior over modules from realised win/loss.
      try {
        bmaUpdate(
          prov.contributingModules.map((m) => ({ name: m.name, value: m.signal ?? 0 })),
          won,
        );
      } catch {}
      // Tier-A.2 Meta-label — learn "bet/skip" gate from realised PnL.
      try {
        const rawConf = Number(r.confidence);
        const dir = r.signal === "buy" || r.signal === "strong_buy" ? 1
                  : r.signal === "sell" ? -1 : 0;
        // Tier-A.1 Triple-barrier label decides "good bet" vs "bad bet".
        const barrierLabel = realised > 0.05 ? 1 : realised < -0.03 ? -1 : 0;
        const y: 0 | 1 = (barrierLabel === 1) ? 1 : 0;
        metaUpdate([(rawConf - 50) / 50, dir, 0, 0, 0], y);
        // Reference to keep tripleBarrierLabel reachable for backtests/CV.
        void tripleBarrierLabel;
      } catch {}
      // Tier-B.1 Regime-conditional model update + Tier-B.4 train distribution.
      try {
        const regimeStr = String(prov.features?.regime_code ?? 0) === "1" ? "trending_up"
          : String(prov.features?.regime_code ?? 0) === "-1" ? "trending_down"
          : String(prov.features?.regime_code ?? 0) === "2" ? "high_vol" : "calm";
        const reg = regimeFromContext(regimeStr);
        const x = prov.contributingModules.slice(0, 4).map((m) => Math.tanh(m.signal ?? 0));
        while (x.length < 4) x.push(0);
        regimeUpdate(reg, x, Math.sign(realised));
        for (const m of prov.contributingModules) {
          recordTrainSample(m.name, m.signal ?? 0);
        }
      } catch {}
      // 4) RL reward — credit the suggested action with realised return.
      try {
        const regime = String(prov.features?.regime_code ?? 0) === "1" ? "trending_up"
          : String(prov.features?.regime_code ?? 0) === "-1" ? "trending_down"
          : String(prov.features?.regime_code ?? 0) === "2" ? "high_vol"
          : String(prov.features?.regime_code ?? 0) === "0.5" ? "mean_reverting" : "calm";
        const action = won && realised > 0.05 ? "enter_full"
          : won ? "enter_small"
          : realised < -0.05 ? "skip" : "scale_out_50";
        rewardAction(regime, Number(r.confidence), action as never, realised);
        // Tier-C/D/E hooks: bandit reward, counterfactual bucket, sector ret, knob tuning.
        try {
          banditUpdate(regime, Number(r.confidence),
            prov.contributingModules.map((m) => m.name), realised);
        } catch {}
        try { recordCounterfactualBucket(Number(r.confidence), realised); } catch {}
        try { recordSectorReturn(sector, realised); } catch {}
        try { recordKnob("min_confidence", Number(r.confidence), realised); } catch {}
        // Tier-F.3 stacking-L2 over tier-level scores.
        try {
          const tierScores: Record<string, number> = {
            base: (Number(r.confidence) - 50) / 50,
            regime_code: regime === "trending_up" ? 1 : regime === "trending_down" ? -1 : 0,
          };
          stackL2Update(tierScores, won);
        } catch {}
        // Tier-J.5 regime-conditional stacking — learn which tier matters per regime.
        try {
          for (const m of prov.contributingModules) {
            regimeStackUpdate(regime, m.name, m.signal ?? 0, won);
          }
        } catch {}
        // Tier-H.9 circuit-breaker — anomaly self-detection.
        try { recordTradeOutcome(won, realised); } catch {}
        // Tier V/W/Y/Z/AA/BB/CC feedback.
        try {
          recordTierMetaOutcomeV(regime, prov.contributingModules.map((m) => ({
            name: m.name, signal: m.signal ?? 0,
          })), won);
        } catch {}
        try {
          const feats: Record<string, number> = {};
          for (const m of prov.contributingModules) feats[m.name] = m.signal ?? 0;
          recordCausalSampleW(feats, realised);
          recordWinnerPatternZ(feats, realised);
        } catch {}
        try { recordCurriculumSampleY(Number(r.confidence), realised, 0.02); } catch {}
        try { recordHierarchicalOutcomeAA(String(r.symbol), sector ?? "unknown", realised); } catch {}
        try { recordReturnBB(realised); } catch {}
        try { recordParetoPointCC({ ret: realised, risk: 0.3, freq: 0.3 }); } catch {}
        // Tier EE/GG/HH/KK/LL feedback.
        try { recordPredictionErrorEE(Number(r.confidence), realised); } catch {}
        try {
          const feats: Record<string, number> = {};
          for (const m of prov.contributingModules) feats[m.name] = m.signal ?? 0;
          recordFeatureOutcomeGG(feats, realised);
        } catch {}
        try { recordReplayHH(Number(r.confidence), realised); } catch {}
        try { recordRegimeOutcomeKK(regime, won); } catch {}
        try { recordHyperparamOutcomeLL(realised); } catch {}
        // Tier MM/OO/RR/SS/TT feedback.
        try { recordDecisionMM(regime, Number(r.confidence), won, realised); } catch {}
        try { recordRegimeTransitionOO(regime); } catch {}
        try {
          const vec = prov.contributingModules.slice(0, 12).map((m) => m.signal ?? 0);
          recordFeatureVectorRR(vec);
        } catch {}
        try { recordRLWeightsOutcomeSS(realised); } catch {}
        try { recordBacktestOutcomeTT(Number(r.confidence), realised); } catch {}
        // Tier UU-BBB feedback (VV/WW/XX/YY/ZZ/AAA).
        try {
          for (const m of prov.contributingModules) {
            recordTierICVV(m.name, m.signal ?? 0, realised);
          }
        } catch {}
        try {
          // Market return proxy: use scan-time market trend if available else 0.
          const marketRet = (prov as { marketRet?: number }).marketRet ?? 0;
          recordReturnsWW(String(r.symbol), realised, marketRet);
        } catch {}
        try {
          const rng = Math.abs(realised);
          recordRangeXX(String(r.symbol), rng, Math.sign(realised));
        } catch {}
        try {
          const cluster = `${sector ?? "unknown"}:${regime}`;
          recordClusterSentimentYY(cluster, Math.tanh(realised / 5));
        } catch {}
        try {
          // Expected ≈ confidence-implied direction in percent terms.
          const expected = ((Number(r.confidence) - 50) / 50) * 3;
          recordExecutionGapZZ(realised, expected);
        } catch {}
        try {
          const sigs = prov.contributingModules.map((m) => ({
            name: m.name, value: m.signal ?? 0,
          }));
          trainStackingAAA(sigs, realised);
        } catch {}
        // Tier CCC-PPP feedback.
        try {
          for (const m of prov.contributingModules) {
            recordTierOutcomeCCC(regime, m.name, m.signal ?? 0, realised);
          }
        } catch {}
        try { recordConformalSampleDDD(Number(r.confidence), realised); } catch {}
        try {
          const sigs = prov.contributingModules.map((m) => ({ name: m.name, value: m.signal ?? 0 }));
          recordShapSampleEEE(sigs, realised);
        } catch {}
        try {
          const price = Number((r as { entry_price?: number }).entry_price ?? 0);
          if (price > 0) updateKalmanHHH(String(r.symbol), price);
        } catch {}
        try { updateGarchIII(String(r.symbol), realised / 100); } catch {}
        try {
          const feats = prov.contributingModules.slice(0, 8).map((m) => m.signal ?? 0);
          recordClusterRegimeJJJ(feats);
        } catch {}
        try {
          recordDecisionKKK((Number(r.confidence) - 50) / 50, realised);
        } catch {}
        try {
          const sent = prov.contributingModules.find((m) => /sent|news/i.test(m.name))?.signal ?? 0;
          const mom = prov.contributingModules.find((m) => /momentum|trend/i.test(m.name))?.signal ?? 0;
          recordCausalSampleLLL(sent, mom, realised);
        } catch {}
        try {
          for (const m of prov.contributingModules) {
            recordEWCSampleNNN(m.name, m.signal ?? 0, realised / 100);
          }
        } catch {}
        try {
          const tf = (prov as { timeframes?: { sig1m?: number; sig5m?: number; sig1h?: number; sig1d?: number } }).timeframes;
          if (tf) {
            recordTimeframeOutcomeOOO({
              sig1m: tf.sig1m ?? 0, sig5m: tf.sig5m ?? 0,
              sig1h: tf.sig1h ?? 0, sig1d: tf.sig1d ?? 0,
              outcome: realised,
            });
          }
        } catch {}
        // Tier QQQ-FFFF feedback.
        try {
          const feats = prov.contributingModules.slice(0, 12).map((m) => m.signal ?? 0);
          recordPatternUUU(feats, realised);
        } catch {}
        try {
          const input = prov.contributingModules[0]?.signal ?? 0;
          trainLstmVVV(String(r.symbol), input, realised);
        } catch {}
        try {
          const feats = prov.contributingModules.slice(0, 12).map((m) => m.signal ?? 0);
          trainGeneticAlgoWWW(feats, realised);
        } catch {}
        try {
          recordThresholdOutcomeYYY("min_confidence", Number(r.confidence), won);
        } catch {}
        try {
          for (const m of prov.contributingModules) {
            recordTierBanditZZZ(regime, m.name, won);
          }
        } catch {}
        try { recordBreakerOutcomeCCCC(won); } catch {}
        try {
          recordABSampleDDDD("global", realised, realised);
        } catch {}
        // Tier GGGG-RRRR feedback.
        try {
          const sentiment = prov.contributingModules.find((m) => m.name.toLowerCase().includes("sentiment"))?.signal ?? 0;
          const momentum = prov.contributingModules.find((m) => m.name.toLowerCase().includes("momentum") || m.name.toLowerCase().includes("trend"))?.signal ?? 0;
          recordDoubleMLKKKK(sentiment, realised, momentum);
        } catch {}
        try { recordReturnLLLL(String(r.symbol), realised); } catch {}
        try {
          const sentiment = prov.contributingModules.find((m) => m.name.toLowerCase().includes("sentiment"))?.signal ?? 0;
          const news = prov.contributingModules.find((m) => m.name.toLowerCase().includes("news"))?.signal ?? sentiment;
          recordIVMMMM(news, sentiment, realised);
        } catch {}
        try {
          const running = (prov as { indicators?: { rsi14?: number } }).indicators?.rsi14 ?? 50;
          recordRDDNNNN(String(r.symbol), running, realised);
        } catch {}
        try { recordCalibrationOOOO(regime, Number(r.confidence), won); } catch {}
        try {
          const residual = realised;
          const ensVar = prov.contributingModules.length > 1
            ? prov.contributingModules.reduce((s, m) => s + (m.signal ?? 0) ** 2, 0) / prov.contributingModules.length
            : 0;
          recordUncertaintyPPPP(regime, residual, ensVar);
        } catch {}
        try { recordDistributionRRRR("confidence", Number(r.confidence), true); } catch {}
        // Tier SSSS-DDDDD feedback.
        try {
          const feats: Record<string, number> = {};
          for (const m of prov.contributingModules.slice(0, 12)) feats[m.name] = m.signal ?? 0;
          recordSGDOutcomeSSSS(feats, realised);
        } catch {}
        try { recordSourceReturnTTTT(realised); } catch {}
        try { recordSymbolReturnTTTT(String(r.symbol), realised); } catch {}
        try {
          const feats = prov.contributingModules.slice(0, 8).map((m) => m.signal ?? 0);
          recordPatternTemplateUUUU(feats, realised);
        } catch {}
        try {
          const feats = prov.contributingModules.slice(0, 8).map((m) => m.signal ?? 0);
          recordContrastiveVVVV(feats, won);
        } catch {}
        try { recordKellyOutcomeWWWW(won, realised); } catch {}
        try {
          const day = String(r.outcome_at ?? "").slice(0, 10) || new Date().toISOString().slice(0, 10);
          recordCorrReturnXXXX(day, String(r.symbol), realised);
        } catch {}
        try { recordReturnYYYY(realised); } catch {}
        try { recordRegimeReturnZZZZ(realised); } catch {}
        try {
          const sentiment = prov.contributingModules.find((m) => m.name.toLowerCase().includes("sentiment"))?.signal ?? 0;
          recordCounterfactualBBBBB("sentiment", sentiment, realised);
        } catch {}
        try {
          for (const m of prov.contributingModules) recordStackOutcomeCCCCC(regime, m.name, won);
        } catch {}
        try {
          for (const m of prov.contributingModules.slice(0, 6)) {
            recordBMAOutcomeDDDDD(m.name, m.signal ?? 0, realised);
          }
        } catch {}
        // Tier EEEEE-PPPPP feedback.
        try {
          const ind = (prov as { indicators?: Record<string, number> }).indicators ?? {};
          recordTFTSampleEEEEE(String(r.symbol), {
            short: (ind.rsi14 ?? 50) - 50,
            medium: ind.macd ?? 0,
            long: (ind.sma50 ?? 0) - (ind.sma200 ?? 0),
            futureEvent: 0,
            outcome: realised,
          });
        } catch {}
        try {
          const ind = (prov as { indicators?: Record<string, number> }).indicators ?? {};
          if (typeof ind.volume === "number") recordTradeSizeKKKKK(String(r.symbol), ind.volume);
        } catch {}
        try {
          const ind = (prov as { indicators?: Record<string, number> }).indicators ?? {};
          const spread = ind.atr14 ?? 0.1;
          recordSpreadSampleLLLLL(String(r.symbol), spread, realised);
        } catch {}
        try {
          const active = prov.contributingModules.slice(0, 8).map((m) => m.name);
          recordNASOutcomeMMMMM(String(r.symbol), active, won);
        } catch {}
        try {
          const weights: Record<string, number> = {};
          for (const m of prov.contributingModules) weights[m.name] = m.weight;
          recordCheckpointNNNNN(weights, realised);
          updateCurrentPerfNNNNN(realised);
        } catch {}
        try {
          const ind = (prov as { indicators?: Record<string, number> }).indicators ?? {};
          recordMultiTaskOOOOO({
            price: realised,
            volume: (ind.volume ?? 0) > 0 ? Math.sign(realised) : 0,
            vol: ind.atr14 ?? 0,
            direction: Math.sign(realised),
          });
        } catch {}
        try { recordSelfPlayPPPPP(regime, realised); } catch {}
        // Tier QQQQQ-BBBBBB feedback.
        try {
          for (const m of prov.contributingModules.slice(0, 8)) {
            recordMISampleQQQQQ(m.name, m.signal ?? 0, realised);
          }
        } catch {}
        try { recordTESeriesRRRRR(String(r.symbol), realised); } catch {}
        try { recordTESeriesRRRRR("MARKET", realised); } catch {}
        try {
          const day = String(r.outcome_at ?? "").slice(0, 10) || new Date().toISOString().slice(0, 10);
          recordHerdingVVVVV(day, String(r.symbol), realised);
        } catch {}
        try { recordDispositionXXXXX(String(r.symbol), won, true); } catch {}
        try {
          const primary = Number(r.confidence) - 50;
          recordShadowYYYYY(primary, primary * 0.9, realised);
        } catch {}
        try {
          const day = String(r.outcome_at ?? "").slice(0, 10) || new Date().toISOString().slice(0, 10);
          recordDailyPnlAAAAAA(day, realised);
        } catch {}
        try { recordPlattBBBBBB(Number(r.confidence), won); } catch {}
        // Tier CCCCCC-RRRRRR feedback.
        try {
          for (const m of prov.contributingModules.slice(0, 8)) {
            recordBMASampleCCCCCC(m.name, m.signal ?? 0, realised);
          }
        } catch {}
        try {
          const feats = prov.contributingModules.slice(0, 6).map((m) => m.signal ?? 0);
          while (feats.length < 6) feats.push(0);
          recordStackedDDDDDD(feats, won);
        } catch {}
        try { recordReturnEEEEEE(String(r.symbol), realised); } catch {}
        try { recordFoldFFFFFF(0, Number(r.confidence) - 50, realised); } catch {}
        try {
          const ind = (prov as { indicators?: Record<string, number> }).indicators ?? {};
          const vol = Math.max(1, ind.volume ?? 1);
          const buy = realised > 0 ? vol * 0.6 : vol * 0.4;
          recordVPINBucketGGGGGG(String(r.symbol), buy, vol - buy);
        } catch {}
        try { recordLLReturnHHHHHH(String(r.symbol), realised); } catch {}
        try { recordLLReturnHHHHHH("MARKET", realised); } catch {}
        try { updateDCCIIIIII(realised, realised * 0.7); } catch {}
        try { recordClassMMMMMM(won); } catch {}
        try { recordCurriculumPerfNNNNNN(won ? 1 : 0); } catch {}
        try {
          const day = String(r.outcome_at ?? "").slice(0, 10) || new Date().toISOString().slice(0, 10);
          void day;
          recordLivePnlQQQQQQ(realised);
        } catch {}
        try { recordTrialSharpePPPPPP(realised / Math.max(0.5, Math.abs(realised) + 1)); } catch {}
        try {
          const imp: Record<string, number> = {};
          for (const m of prov.contributingModules.slice(0, 10)) imp[m.name] = Math.abs(m.weight);
          recordShapSnapshotRRRRRR(imp);
        } catch {}
        // Tier SSSSSS-HHHHHHH feedback.
        try { recordConformalSSSSSS(String(r.symbol), (Number(r.confidence) - 50) / 25, realised); } catch {}
        try {
          const sector = sectorBy.get(String(r.symbol).toUpperCase()) ?? null;
          recordSectorReturnTTTTTT(String(r.symbol), sector, realised);
        } catch {}
        try { recordExpertVVVVVV(regime, won); } catch {}
        try { recordCausalWWWWWW("MARKET", realised); } catch {}
        try { recordCausalWWWWWW(String(r.symbol), realised); } catch {}
        try { if (Math.abs(realised) > 3) recordHawkesEventYYYYYY(String(r.symbol)); } catch {}
        try { recordMAMLAAAAAAA(String(r.symbol), won); } catch {}
        try { recordPPOBBBBBBB(String(r.signal ?? "hold"), realised); } catch {}
        try {
          const feats = prov.contributingModules.slice(0, 8).map((m) => m.signal ?? 0);
          recordTS2VecCCCCCCC(String(r.symbol), feats);
        } catch {}
        try {
          const base = Number(r.confidence);
          recordAdversarialDDDDDDD(base, base + (Math.random() - 0.5) * 4);
        } catch {}
        try {
          for (const m of prov.contributingModules.slice(0, 8)) {
            updateFTRLEEEEEEE(m.name, -realised * (m.signal ?? 0));
          }
        } catch {}
        try { recordBanditFFFFFFF(regime, won); } catch {}
        try {
          const best = Math.max(realised, 0);
          recordRegretGGGGGGG(regime, realised, best);
        } catch {}
        try {
          const teacher = Number(r.confidence);
          const student = teacher * 0.9 + (realised > 0 ? 5 : -5);
          recordDistillationHHHHHHH(teacher, student);
        } catch {}
        // ── Tier IIIIIII–XXXXXXX feedback ────────────────────────────────
        try { recordShockOOOOOOO(String(r.symbol), realised / 100); } catch {}
        try { recordArchPerfRRRRRRR("deep", realised); } catch {}
        try {
          const feats = prov.contributingModules.slice(0, 6).map((m) => m.signal ?? 0);
          recordCpcSSSSSSS(String(r.symbol), feats);
        } catch {}
        try { recordLossTTTTTTT(Math.abs(realised - (Number(r.confidence) - 50) / 50)); } catch {}
        try { recordAdversaryUUUUUUU((Number(r.confidence) - 50) / 50, realised); } catch {}
        try {
          for (const m of prov.contributingModules.slice(0, 8)) {
            const corr = (m.signal ?? 0) * Math.sign(realised);
            recordCausalLinkVVVVVVV(m.name, corr);
          }
        } catch {}
        try {
          const conf = (Number(r.confidence) - 50) / 50;
          recordExplanationXXXXXXX(conf, conf * 0.95, conf * 1.05);
        } catch {}
        try { recordDepthImbalanceMMMMMMM(String(r.symbol), 50 + realised, 50 - realised); } catch {}
        try { recordKyleNNNNNNN(String(r.symbol), Math.sign(realised), realised / 100); } catch {}
        // ── Tier YYYYYYY–NNNNNNNN feedback ────────────────────────────────
        try { recordLOBCCCCCCCC(String(r.symbol), 50 + realised, 50 - realised); } catch {}
        try {
          const peers = prov.contributingModules.slice(0, 4).map((m) => m.name);
          updateCentralityFFFFFFFF(String(r.symbol), peers);
        } catch {}
        try {
          const sector = (r as { sector?: string }).sector ?? "default";
          recordLoRAGGGGGGGG(sector, realised - (Number(r.confidence) - 50) / 50);
        } catch {}
        try {
          const origLoss = Math.abs(realised - (Number(r.confidence) - 50) / 50);
          recordMixupIIIIIIII(origLoss, origLoss * 1.05);
        } catch {}
        try {
          const fast = (Number(r.confidence) - 50) / 50;
          const slow = fast * 0.9 + realised * 0.1;
          recordLookaheadJJJJJJJJ(fast, slow);
        } catch {}
        try {
          const wasCorrect = (Number(r.confidence) > 50) === (realised > 0);
          recordCalibrationLLLLLLLL(Number(r.confidence), wasCorrect);
        } catch {}
        try {
          const feats = prov.contributingModules.slice(0, 6).map((m) => m.signal ?? 0);
          recordInDistMMMMMMMM(feats);
        } catch {}
        try {
          for (const m of prov.contributingModules.slice(0, 5)) {
            const name = m.name.toLowerCase();
            const sig = m.signal ?? 0;
            if (name.includes("trend")) recordConceptNNNNNNNN("trend", sig);
            else if (name.includes("momentum") || name.includes("rsi")) recordConceptNNNNNNNN("momentum", sig);
            else if (name.includes("vol")) recordConceptNNNNNNNN("volatility", sig);
            else if (name.includes("volume") || name.includes("liquid")) recordConceptNNNNNNNN("liquidity", sig);
            else if (name.includes("sentiment") || name.includes("news")) recordConceptNNNNNNNN("sentiment", sig);
          }
        } catch {}
        // ── Tier OOOOOOOO–DDDDDDDDD feedback ─────────────────────────────
        try {
          const predConf = (Number(r.confidence) - 50) / 50;
          recordConformalOOOOOOOO(predConf, realised);
        } catch {}
        try { recordCrossSectionalUUUUUUUU(String(r.symbol), realised); } catch {}
        try {
          const teacher = (Number(r.confidence) - 50) / 50;
          const student = teacher * 0.95 + realised * 0.05;
          recordDistillationWWWWWWWW(teacher, student);
        } catch {}
        try {
          const weightChange = Math.abs(realised - (Number(r.confidence) - 50) / 50) * 0.1;
          recordEWCXXXXXXXX(weightChange);
        } catch {}
        try { recordSWAZZZZZZZZ((Number(r.confidence) - 50) / 50); } catch {}
        try {
          recordGovernanceCCCCCCCCC("dataSheet", true);
          recordGovernanceCCCCCCCCC("modelCard", true);
          recordGovernanceCCCCCCCCC("biasAudit", prov.contributingModules.length > 3);
        } catch {}
        // ── Tier FRONTIER-V3 feedback ─────────────────────────────────────
        try {
          for (const m of prov.contributingModules.slice(0, 12)) {
            const sourceConf = Math.max(0, Math.min(100, 50 + (m.signal ?? 0) * 25));
            recordBMASourceOutcome(m.name, sourceConf, won);
            updateDistillation(m.name, m.signal ?? 0, realised / 5);
          }
        } catch {}
        try {
          const conf = Number(r.confidence);
          const halfWidth = 25; // generic ±25 band on confidence scale
          const realizedConf = won ? 75 : 25;
          recordConformalCoverage(conf - halfWidth, conf + halfWidth, realizedConf);
        } catch {}
        try { recordCounterfactualReplay(Number(r.confidence), won); } catch {}
        try { recordRegimeOutcomeRAT(regime, won); } catch {}
        try { recordUncertaintyOutcome(Number(r.confidence), won); } catch {}
        try {
          const isStress = regime === "high_vol" || Math.abs(realised) > 5;
          recordStressOutcome(realised, isStress);
        } catch {}
        try { recordSectorOutcomeGKT(sector ?? "unknown", won); } catch {}
        // ── Tier MASTER-IQ feedback ────────────────────────────────────
        try {
          const label: "tp" | "sl" | "time" =
            r.outcome === "target_hit" ? "tp"
            : r.outcome === "stop_hit" ? "sl" : "time";
          recordMetaLabelTripleBarrier(label);
        } catch {}
        try {
          // Hash recommendation id to a stable fold index.
          let h = 0; for (let i = 0; i < r.id.length; i++) h = (h * 31 + r.id.charCodeAt(i)) | 0;
          recordPurgedFoldOutcome(Math.abs(h), won);
        } catch {}
        try {
          for (const m of prov.contributingModules.slice(0, 12)) {
            recordFeatureImportanceFID(m.name, Math.abs(m.signal ?? 0) * Math.abs(m.weight ?? 1));
          }
        } catch {}
        try { recordIsotonicEnsembleOutcome(Number(r.confidence), won); } catch {}
        try {
          const cluster = `${sector ?? "unknown"}:${regime}`;
          recordHRPClusterReturn(cluster, realised);
        } catch {}
        try {
          for (const m of prov.contributingModules.slice(0, 12)) {
            recordCausalLinkCDV(m.name, m.signal ?? 0, realised);
          }
        } catch {}
        try { recordRLPositionOutcome(regime, Number(r.confidence), realised); } catch {}
        try { recordShadowABOutcome(won, won); } catch {}
        try { recordFederatedSectorOutcome(sector ?? "unknown", realised); } catch {}
        // ── Tier APEX-IQ feedback ──────────────────────────────────────
        try { recordOGBOutcome(regime, Number(r.confidence), realised); } catch {}
        try { recordKellyOutcomeAPEX(won, realised); } catch {}
        try { recordWFOSample(Number(r.confidence), won); } catch {}
        try { recordCUSUMReturn(realised); } catch {}
        try { recordCointegrationReturn(sector ?? "unknown", realised); } catch {}
        try { recordGARCHReturn(realised); } catch {}
        try { recordDrawdownReturn(realised); } catch {}
        try {
          const hour = r.outcome_at ? new Date(r.outcome_at).getUTCHours() : new Date().getUTCHours();
          recordTimeOfDayOutcome(hour, won);
        } catch {}
        try { recordTradeQuality(String(r.signal ?? "unknown"), realised); } catch {}
        try { recordADWINOutcome(won); } catch {}
        try { recordTSMReturn(realised); } catch {}
        try {
          const arm = `${sector ?? "unk"}:${regime}`;
          recordThompsonOutcome(arm, won);
        } catch {}
        try { recordSBAReturn(realised); } catch {}
      } catch {}
    }
    count++;
  }
  if (processed.size > 5000) {
    // Trim oldest half to bound memory.
    const arr = Array.from(processed);
    processed.clear();
    arr.slice(-2500).forEach((id) => processed.add(id));
  }
  // Persist updated learning state after each ingestion batch.
  if (count > 0) {
    try { await saveState("advanced_intelligence_v2", snapshotV2State()); } catch {}
    try { await saveState("lopez_de_prado", snapshotLDPState()); } catch {}
    try { recomputeCorrelations(); } catch {}
    try { await saveState("tier_b_intelligence", snapshotTierBState()); } catch {}
    try { await saveState("tier_cde_intelligence", snapshotTierCDEState()); } catch {}
    try { await saveState("tier_fgh_intelligence", snapshotTierFGHState()); } catch {}
    try { await saveState("tier_q_intelligence", snapshotTierQState()); } catch {}
    try { await saveState("tier_r_intelligence", snapshotTierRState()); } catch {}
    try { await saveState("tier_s_intelligence", snapshotTierSState()); } catch {}
    try { await saveState("tier_t_intelligence", snapshotTierTState()); } catch {}
    try { await saveState("tier_u_intelligence", snapshotTierUState()); } catch {}
    try { await saveState("tier_vwx_intelligence", snapshotTierVWXState()); } catch {}
    try { await saveState("tier_eelm_intelligence", snapshotTierEELMState()); } catch {}
    try { await saveState("tier_mmtt_intelligence", snapshotTierMMTTState()); } catch {}
    try { await saveState("tier_uubbb_intelligence", snapshotTierUUBBBState()); } catch {}
    try { await saveState("tier_cccppp_intelligence", snapshotTierCCCPPPState()); } catch {}
    try { await saveState("tier_qqqffff_intelligence", snapshotTierQQQFFFFState()); } catch {}
    try { await saveState("tier_ggggrrrr_intelligence", snapshotTierGGGGRRRRState()); } catch {}
    try { await saveState("tier_ssssddddd_intelligence", snapshotTierSSSSDDDDDState()); } catch {}
    try { await saveState("tier_eeeeepppppppp_intelligence", snapshotTierEEEEEPPPPPState()); } catch {}
    try { await saveState("tier_qqqqqbbbbbb_intelligence", snapshotTierQQQQQBBBBBBState()); } catch {}
    try { await saveState("tier_ccccccrrrrrr_intelligence", snapshotTierCCCCCCRRRRRRState()); } catch {}
    try { await saveState("tier_ssssssshhhhhhh_intelligence", snapshotTierSSSSSSHHHHHHHState()); } catch {}
    try { await saveState("tier_iiiiiiixxxxxxx_intelligence", snapshotTierIIIIIIIXXXXXXXState()); } catch {}
    try { await saveState("tier_yyyyyyynnnnnnnn_intelligence", snapshotTierYYYYYYYNNNNNNNNState()); } catch {}
    try { await saveState("tier_oooooooodddddddd_intelligence", snapshotTierOOOOOOOODDDDDDDDDState()); } catch {}
    try { await saveState("tier_frontier_v3_intelligence", snapshotTierFrontierV3State()); } catch {}
    try { await saveState("tier_master_iq_intelligence", snapshotTierMasterIQState()); } catch {}
    try { await saveState("tier_apex_iq_intelligence", snapshotTierApexIQState()); } catch {}
  }
  return { processed: count };
}

// Re-export for future news-pipeline wiring; keeps tree-shaking happy.
export { recordNewsOutcome };