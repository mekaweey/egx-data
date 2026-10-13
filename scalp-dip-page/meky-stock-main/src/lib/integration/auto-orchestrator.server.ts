/**
 * Auto Orchestrator
 * --------------------------------------------------------------------------
 * Runs every standalone analytical module automatically as part of the scan
 * pipeline and returns ModuleSignals that are then blended into finalConfidence
 * via `integrateSignals`. Each adapter:
 *   - derives its required inputs from data the scan already has (candles,
 *     indicators, market context) — NO extra external fetches.
 *   - is wrapped in try/catch — a failure NEVER breaks the scan.
 *   - is tracked by module-health, so consistently bad modules auto-disable.
 *
 * 🔁 HOW TO ADD A NEW MODULE (auto-wired):
 *   1. Build the module under src/lib/<category>/<name>.server.ts as a pure
 *      function with deterministic inputs.
 *   2. Add ONE adapter block below inside `runAutoModules`. The adapter must:
 *        - derive inputs from `ctx` only
 *        - push to `signals` with value in [-1, 1]
 *        - be wrapped in try/catch
 *   3. That's it — the scan will start using it on the next run automatically.
 */
import type { Candle } from "@/lib/market-data/types";
import type { Indicators } from "@/lib/analysis/indicators.server";
import { vpin, bucketize, toxicityLabel } from "@/lib/signals/vpin.server";
import { realizedVolatility, realizedSemivariance } from "@/lib/signals/realized-volatility.server";
import { createSSM, forecast as ssmForecast } from "@/lib/deep/mamba-ssm.server";
import { buildMixture, expectedValue as mixEV, variance as mixVar } from "@/lib/deep/mixture-density.server";
import { generatePaths, pathStats } from "@/lib/deep/diffusion-prices.server";
import { fitDistribution, isOOD } from "@/lib/reliability/ood-detection.server";
import { createBank, write as memWrite, read as memRead } from "@/lib/deep/memory-augmented-network.server";
import { fitGARCH, forecastVolatility as forecastGARCH } from "@/lib/advstats/garch.server";
import { fitHawkes, branchingRatio } from "@/lib/advstats/hawkes-process.server";
import { estimateGBMParams, monteCarloGBM } from "@/lib/simulation/gbm.server";
import { estimateJumpParams, simulateJumpPath } from "@/lib/simulation/jump-diffusion.server";
import { simulateAgentMarket, createDiverseAgents } from "@/lib/simulation/agent-based-market.server";
import { generateSyntheticReturns } from "@/lib/simulation/synthetic-data.server";
import { generateFeatures } from "@/lib/features/auto-feature-gen.server";
import { tsfreshFeatures } from "@/lib/features/tsfresh-features.server";
import { initOnlineModel, partialFit, predictOnline, type OnlineLinearModel } from "@/lib/perf/incremental-learning.server";
import { globalFeatureStore } from "@/lib/perf/feature-store.server";
import { buildRecord, newDecisionId } from "@/lib/audit/decision-provenance.server";
import { integrateSignals, type ModuleSignal, type IntegratorWeights } from "./pipeline-integrator.server";
import { runModule } from "./module-health.server";
import { getWeightMultipliers, getSymbolWeightOverlay, getSectorWeightOverlay } from "./module-scoring.server";
import { detectRegime, regimeWeights, mergeWeights } from "./regime-weights.server";
import { calibratedConfidence } from "./calibration.server";
import { diversity } from "./diversity.server";
import { robustness } from "./adversarial.server";
import {
  bayesianInterval, driftPSI, driftMultiplier, anomalyCheck,
  multiTimeframeAgreement, clusterPenalty, recordShadow,
} from "./intelligence-layer.server";
import { buildRiskPlan, type RiskPlan } from "./risk-engine.server";
import { nextEarningsDate, earningsMultiplier, daysBetween } from "./event-awareness.server";
import { sanityCheck } from "./llm-reasoning.server";
import { volumeProfile } from "./volume-profile.server";
import { seasonalTilt } from "./seasonality.server";
import { smartMoneyFlow } from "./smart-money-flow.server";
import { importanceMultiplier } from "./feature-importance.server";
import { multiAgentDebate } from "./multi-agent-debate.server";
import { suggestAction } from "./rl-loop.server";
import {
  sgdPredict, conformalInterval, stackMultiplier,
  cusumChangePoint, contagionMultiplier, recordSectorMove,
  hmmState, hmmMultiplier, leadLagScore, obImbalance,
  counterfactualEdge, neighborConsensus, recordSectorSignal,
  maybeQueueForLabel,
} from "./advanced-intelligence-v2.server";
import { bmaMultiplier, metaMultiplier } from "./lopez-de-prado.server";
import {
  dowMultiplier, isotonicCalibrate, regimeStackWeight,
} from "./tier-j-intelligence.server";
import { olScoreNudge, ragQuerySimilarNews } from "./tier-k-intelligence.server";
import {
  multiTimeframeConfirm,
  recordSectorReturn as recordSectorReturnM,
  sectorRotationMultiplier as sectorRotationMultiplierM,
} from "./tier-m-intelligence.server";
import {
  patternOutcomeMultiplier,
  regimeAwareMultiplier,
  anomalyOutlierFilter,
  notePendingPatterns,
} from "./tier-n-intelligence.server";
import {
  kellyFraction,
  noteSectorPick, sectorConcentrationMultiplier,
  dowLearnedMultiplier,
  earningsProximityGuard,
  metaWeightedMultiplier,
  reliabilityCalibrate,
} from "./tier-o-intelligence.server";
import {
  liquidityMultiplier, suspensionPenalty,
  decayMultiplier,
  classifyStrategy, strategyBMAMultiplier,
  conformalHalfWidth,
  recordUniverseScore, crossSectionalMultiplier,
} from "./tier-p-intelligence.server";
import {
  hmmRegimeQ, hmmMultiplierQ,
  bayesShrinkMultiplierQ,
  featureImpactMultiplierQ,
  driftAlarmMultiplierQ,
  recordProdFeatureQ,
  recordConfidenceSampleQ, winsorizedConfidenceQ,
  multiHorizonForecastQ,
  knnSimilarityMultiplierQ,
} from "./tier-q-intelligence.server";
import {
  thompsonMultiplierR,
  ipwMultiplierR,
  sectorMomentumMultiplierR,
  earningsProximityMultiplierR,
  anchoredVwapDevR, anchoredVwapMultiplierR,
  sentimentVelocityMultiplierR, recordSentimentR,
  volumeProfileR, volumeProfileMultiplierR,
  ensembleDisagreementR,
} from "./tier-r-intelligence.server";
import {
  kalmanTrendS, kalmanTrendMultiplierS,
  hurstS, hurstMultiplierS,
  cusumChangeS, cusumMultiplierS,
  icMultiplierS,
  volTargetMultiplierS,
  cachePriceForPairsS,
  orderFlowImbalanceS, orderFlowMultiplierS,
  metaConfidenceS,
} from "./tier-s-intelligence.server";
import {
  recordHmmStateT, hmmTransitionMultiplierT,
  garchVolMultiplierT,
  betaMultiplierT,
  concentrationMultiplierT,
  recordFeatureDistT, ksDriftMultiplierT,
  permImportanceMultiplierT,
  mwEnsembleMultiplierT,
  plattCalibrateT,
} from "./tier-t-intelligence.server";
import {
  isotonicCalibrateU,
  conformalWidthMultiplierU,
  bocpdUpdateU, bocpdMultiplierU,
  recordModuleSignalU, transferEntropyLeaderMultiplierU,
  sgldUncertaintyMultiplierU,
  evtTailMultiplierU,
  symbolAdaptiveMultiplierU,
  oofRegularizerMultiplierU,
} from "./tier-u-intelligence.server";
import {
  tierMetaMultiplierV,
  causalLiftMultiplierW,
  adversarialRobustnessMultiplierX,
  curriculumMultiplierY,
  imitationMultiplierZ,
  hierarchicalShrinkageMultiplierAA,
  sortinoMultiplierBB,
  paretoMultiplierCC,
  explainabilityMultiplierDD,
} from "./tier-vwx-intelligence.server";
import {
  driftMultiplierEE,
  ensembleDisagreementMultiplierFF,
  featureDecayMultiplierGG,
  counterfactualMultiplierHH,
  multiTimeframeConfluenceMultiplierII,
  microstructureMultiplierJJ,
  selfDiagnosticMultiplierKK,
  hyperparamMultiplierLL,
} from "./tier-eelm-intelligence.server";
import {
  selfDiagnosticAgentMultiplierMM,
  regimeSwitchingMultiplierOO,
  sentimentVelocityMultiplierPP,
  orderBookReplayMultiplierQQ,
  anomalyAutoQuarantineMultiplierRR,
  rlOverWeightsMultiplierSS,
  backtestingInProductionMultiplierTT,
} from "./tier-mmtt-intelligence.server";
import {
  llmMetaAnalystMultiplierUU,
  walkForwardICMultiplierVV,
  crossAssetCorrelationMultiplierWW,
  optionsFlowMultiplierXX,
  narrativeClusteringMultiplierYY,
  executionQualityMultiplierZZ,
  metaLearnerStackingMultiplierAAA,
  humanFeedbackMultiplierBBB,
} from "./tier-uubbb-intelligence.server";
import {
  bayesianModelAveragingMultiplierCCC,
  conformalMultiplierDDD,
  featureImportanceMultiplierEEE,
  microstructureTickMultiplierFFF,
  eventStudyMultiplierGGG,
  kalmanTrendMultiplierHHH,
  garchVolMultiplierIII,
  clusterRegimeMultiplierJJJ,
  transformerSeqMultiplierKKK,
  causalInferenceMultiplierLLL,
  adversarialRobustnessMultiplierMMM,
  continualLearningMultiplierNNN,
  multiTimeframeFusionMultiplierOOO,
  portfolioRiskParityMultiplierPPP,
} from "./tier-cccppp-intelligence.server";
import {
  alternativeDataFusionMultiplierQQQ,
  insiderActivityMultiplierRRR,
  analystRevisionMultiplierSSS,
  darkPoolFlowMultiplierTTT,
  vectorRAGMultiplierUUU,
  lstmDeepLearningMultiplierVVV,
  geneticAlgoMultiplierWWW,
  quantumInspiredMultiplierXXX,
  autoMLMultiplierYYY,
  multiArmedBanditMultiplierZZZ,
  simulationPlanningMultiplierAAAA,
  chainOfThoughtMultiplierBBBB,
  circuitBreakerMultiplierCCCC,
  checkCriticalSignalFFFF,
} from "./tier-qqqffff-intelligence.server";
import {
  vpinMultiplierGGGG,
  hawkesMultiplierHHHH,
  kyleLambdaMultiplierIIII,
  pinMultiplierJJJJ,
  doubleMLMultiplierKKKK,
  syntheticControlMultiplierLLLL,
  ivMultiplierMMMM,
  rddMultiplierNNNN,
  metacognitiveMultiplierOOOO,
  uncertaintyMultiplierPPPP,
  oodMultiplierQQQQ,
  recordOODTrainingQQQQ,
  modelDecayMultiplierRRRR,
  recordDistributionRRRR,
} from "./tier-ggggrrrr-intelligence.server";
import {
  sgdMultiplierSSSS,
  transferMultiplierTTTT,
  fewShotMultiplierUUUU,
  contrastiveMultiplierVVVV,
  kellyMultiplierWWWW,
  correlationRegimeMultiplierXXXX,
  cvarMultiplierYYYY,
  hmmRegimeMultiplierZZZZ,
  adversarialRobustnessMultiplierAAAAA,
  counterfactualMultiplierBBBBB,
  stackMultiplierCCCCC,
  bmaMultiplierDDDDD,
} from "./tier-ssssddddd-intelligence.server";
import {
  tftMultiplierEEEEE,
  hawkesMultiplierFFFFF, recordHawkesEventFFFFF,
  wavenetMultiplierGGGGG,
  nbeatsMultiplierHHHHH,
  quoteStuffingMultiplierIIIII,
  spoofingMultiplierJJJJJ,
  tradeSizeMultiplierKKKKK,
  effectiveSpreadMultiplierLLLLL,
  nasMultiplierMMMMM,
  checkpointReplayMultiplierNNNNN,
  multiTaskMultiplierOOOOO,
  selfPlayMultiplierPPPPP,
} from "./tier-eeeeepppppppp-intelligence.server";
import {
  miMultiplierQQQQQ,
  transferEntropyMultiplierRRRRR,
  snrMultiplierSSSSS,
  complexityMultiplierTTTTT,
  prospectMultiplierUUUUU,
  herdingMultiplierVVVVV,
  anchoringMultiplierWWWWW,
  dispositionMultiplierXXXXX,
  shadowMultiplierYYYYY,
  latencyMultiplierZZZZZ,
  circuitBreakerMultiplierAAAAAA,
  plattMultiplierBBBBBB,
} from "./tier-qqqqqbbbbbb-intelligence.server";
import {
  bmaMultiplierCCCCCC,
  stackedMultiplierDDDDDD,
  quantileMultiplierEEEEEE,
  leakageMultiplierFFFFFF,
  toxicityMultiplierGGGGGG,
  leadLagMultiplierHHHHHH,
  dccMultiplierIIIIII,
  tsrvMultiplierJJJJJJ,
  activeLearningMultiplierKKKKKK,
  ewcMultiplierLLLLLL,
  smoteMultiplierMMMMMM,
  curriculumMultiplierNNNNNN,
  pboMultiplierOOOOOO,
  deflatedSharpeMultiplierPPPPPP,
  divergenceMultiplierQQQQQQ,
  shapDriftMultiplierRRRRRR,
  queueUncertainKKKKKK,
} from "./tier-ccccccrrrrrr-intelligence.server";
import {
  conformalMultiplierSSSSSS,
  shrinkageMultiplierTTTTTT,
  gpMultiplierUUUUUU,
  moeMultiplierVVVVVV,
  causalMultiplierWWWWWW,
  counterfactualMultiplierXXXXXX,
  hawkesMultiplierYYYYYY,
  waveletMultiplierZZZZZZ,
  mamlMultiplierAAAAAAA,
  ppoMultiplierBBBBBBB,
  ts2vecMultiplierCCCCCCC,
  adversarialMultiplierDDDDDDD,
  ftrlMultiplierEEEEEEE,
  banditMultiplierFFFFFFF,
  cfrMultiplierGGGGGGG,
  distillationMultiplierHHHHHHH,
} from "./tier-ssssssshhhhhhh-intelligence.server";
import {
  neuralOdeMultiplierIIIIIII,
  tftMultiplierJJJJJJJ,
  diffusionMultiplierKKKKKKK,
  kalmanUpdateLLLLLLL,
  kalmanMultiplierLLLLLLL,
  depthMultiplierMMMMMMM,
  kyleMultiplierNNNNNNN,
  recordShockOOOOOOO,
  contagionMultiplierOOOOOOO,
  recordRegimePPPPPPP,
  hmmMultiplierPPPPPPP,
  recordFederatedVoteQQQQQQQ,
  federatedMultiplierQQQQQQQ,
  nasMultiplierRRRRRRR,
  cpcMultiplierSSSSSSS,
  samMultiplierTTTTTTT,
  gameTheoryMultiplierUUUUUUU,
  causalDiscoveryMultiplierVVVVVVV,
  infoBottleneckMultiplierWWWWWWW,
  explainabilityMultiplierXXXXXXX,
} from "./tier-iiiiiiixxxxxxx-intelligence.server";
import {
  quantileRegressionMultiplierYYYYYYY,
  nbeatsMultiplierZZZZZZZ,
  updateReservoirAAAAAAAA,
  echoStateMultiplierAAAAAAAA,
  tdaMultiplierBBBBBBBB,
  lobDynamicsMultiplierCCCCCCCC,
  jumpDetectionMultiplierDDDDDDDD,
  realizedKernelMultiplierEEEEEEEE,
  centralityMultiplierFFFFFFFF,
  loraMultiplierGGGGGGGG,
  curriculumMultiplierHHHHHHHH,
  recordCurriculumHHHHHHHH,
  mixupMultiplierIIIIIIII,
  lookaheadMultiplierJJJJJJJJ,
  adversarialRobustnessMultiplierKKKKKKKK,
  isotonicCalibrationMultiplierLLLLLLLL,
  mahalanobisOODMultiplierMMMMMMMM,
  conceptBottleneckMultiplierNNNNNNNN,
} from "./tier-yyyyyyynnnnnnnn-intelligence.server";
import {
  conformalPredictionMultiplierOOOOOOOO,
  mixtureDensityMultiplierPPPPPPPP,
  deepGaussianProcessMultiplierQQQQQQQQ,
  spectralResidualMultiplierRRRRRRRR,
  hawkesProcessMultiplierSSSSSSSS,
  recordHawkesEventSSSSSSSS,
  roughVolatilityMultiplierTTTTTTTT,
  crossSectionalMomentumMultiplierUUUUUUUU,
  liquidityVaRMultiplierVVVVVVVV,
  distillationMultiplierWWWWWWWW,
  ewcMultiplierXXXXXXXX,
  selfDistillationMultiplierYYYYYYYY,
  recordSnapshotYYYYYYYY,
  swaMultiplierZZZZZZZZ,
  counterfactualMultiplierAAAAAAAAA,
  bootstrapIntervalMultiplierBBBBBBBBB,
  modelCardMultiplierCCCCCCCCC,
  shapleyMultiplierDDDDDDDDD,
} from "./tier-oooooooodddddddd-intelligence.server";
import {
  bayesianModelAveragingMultiplier,
  conformalQualityMultiplier,
  counterfactualReplayMultiplier,
  regimeAwareActivationMultiplier,
  distillationFastMultiplier,
  activeLearningUncertaintyMultiplier,
  adversarialStressMultiplier,
  graphKnowledgeTransferMultiplier,
} from "./tier-frontier-v3-intelligence.server";
import {
  metaLabelTripleBarrierMultiplier,
  purgedCVReliabilityMultiplier,
  featureImportanceDriftMultiplier,
  isotonicEnsembleCalibMultiplier,
  hrpClusterRiskMultiplier,
  llmJudgeContradictionMultiplier,
  causalDiscoveryMultiplier,
  rlPositionSizingMultiplier,
  shadowABNewLayerMultiplier,
  confidenceDecompositionMultiplier,
  federatedSectorOutcomeMultiplier,
  recordConfidenceDecomposition,
} from "./tier-master-iq-intelligence.server";
import {
  onlineGradientBoostingMultiplier,
  kellyCriterionMultiplier,
  microstructureOFIMultiplier,
  walkForwardOptThresholdMultiplier,
  hmmRegimeMultiplier,
  recordHMMRegime,
  changePointCUSUMMultiplier,
  cointegrationPairsMultiplier,
  garchVolatilityMultiplier,
  newsSentimentSentinelMultiplier,
  drawdownCircuitBreakerMultiplier,
  timeOfDayBucketMultiplier,
  tradeQualityScoreMultiplier,
  adwinDriftDetectorMultiplier,
  transformerSequenceMultiplier,
  thompsonSamplingBanditMultiplier,
  syntheticBootstrapAugmentMultiplier,
} from "./tier-apex-iq-intelligence.server";

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
import {
  regimeFromContext, regimeMultiplier,
  recordSymbolMove, neighborMultiplier,
  microstructure, microMultiplier,
  recordRecentSample, globalDriftMultiplier,
  eventMultiplier,
} from "./tier-b-intelligence.server";
import {
  banditMultiplier, ofiProxy, ofiMultiplier,
  newsSimilarityMultiplier, sectorRotationMultiplier,
  kalmanBetaUpdate, kalmanDecoupleMultiplier,
  adwinUpdate, adwinMultiplier, pushSymbolReturn,
} from "./tier-cde-intelligence.server";
import {
  snapshotFeatures, stackL2Multiplier,
  waveletMultiplier, hurstMultiplier, volumeBarMultiplier,
  shapAttribution, ensembleUncertainty,
  circuitBreakerMultiplier, isCircuitOpen,
} from "./tier-fgh-intelligence.server";

export interface AutoCtx {
  symbol: string;
  indicators: Indicators;
  candles?: Candle[];
  baseConfidence: number;
  /** "buy" / "sell" / "hold" — orchestrator only adjusts when actionable. */
  signal?: string;
  sector?: string | null;
  /** Set true to enable LLM sanity-check (one extra API call). */
  useLLM?: boolean;
  /** Optional: most-recent index trend %, used by Kalman beta. */
  indexTrendPct?: number;
  /** Optional: most-recent headline for news-similarity scoring. */
  newsHeadline?: string | null;
}

export interface AutoResult {
  adjustedConfidence: number;
  signals: ModuleSignal[];
  contributions: Array<{ name: string; weight: number; contribution: number }>;
  regime: string;
  diversity: number;
  stability: number;
  rawConfidence: number;
  interval?: { lower: number; upper: number; halfWidth: number };
  riskPlan?: RiskPlan;
  flags: {
    anomaly?: string;
    drift?: number;
    earningsInDays?: number | null;
    multiTimeframeAgree?: boolean;
    clusterPenalty?: number;
    llmVerdict?: string;
    shap?: string;
    circuitBreaker?: string;
  };
}

/** In-memory shared state across one scan (reset per worker cold-start). */
const memBank = createBank(256);
const onlineModels = new Map<string, OnlineLinearModel>();
/** Provenance log for the latest pick (read by callers if needed). */
export const provenanceLog: ReturnType<typeof buildRecord>[] = [];

function dailyReturns(candles: Candle[]): number[] {
  const r: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const prev = candles[i - 1].close;
    if (prev > 0) r.push((candles[i].close - prev) / prev);
  }
  return r;
}

export async function runAutoModules(ctx: AutoCtx, weights: IntegratorWeights = {}): Promise<AutoResult> {
  const signals: ModuleSignal[] = [];
  const candles = ctx.candles ?? [];
  const rets = candles.length > 1 ? dailyReturns(candles) : [];

  // ── Pre-flight: anomaly check on raw candles ───────────────────────────
  const anomaly = anomalyCheck(candles);
  if (!anomaly.ok) {
    // Bad data → return base confidence untouched with a flag.
    return {
      adjustedConfidence: ctx.baseConfidence,
      rawConfidence: ctx.baseConfidence,
      signals: [],
      contributions: [],
      regime: "calm",
      diversity: 0,
      stability: 0,
      flags: { anomaly: anomaly.reason },
    };
  }

  // ── signals/vpin ────────────────────────────────────────────────────────
  runModule("vpin", () => {
    if (candles.length < 20) return undefined;
      const recent = candles.slice(-30);
      const trades = recent.map((c, i) => ({
        price: c.close,
        volume: c.volume,
        prevPrice: i > 0 ? recent[i - 1].close : c.open,
      }));
      const avgVol = trades.reduce((s, t) => s + t.volume, 0) / trades.length;
      const buckets = bucketize(trades, Math.max(1, avgVol * 2));
      const v = vpin(buckets);
      const tox = toxicityLabel(v);
      signals.push({
        name: "vpin",
        value: tox === "high" ? -0.6 : tox === "elevated" ? -0.25 : 0.1,
        confidence: Math.min(1, buckets.length / 10),
      });
    return true;
  });

  // ── signals/realized-volatility ─────────────────────────────────────────
  runModule("realized_vol", () => {
    if (rets.length < 20) return undefined;
      const rv = realizedVolatility(rets);
      const sv = realizedSemivariance(rets);
      // High realized vol → caution; downside-skewed semivariance → bearish.
      const skew = sv > 0 ? Math.min(1, sv / Math.max(1e-9, rv)) : 0;
      signals.push({
        name: "realized_vol",
        value: -Math.min(0.5, rv * 8) + (0.5 - skew) * 0.4,
        confidence: 0.7,
      });
    return true;
  });

  // ── deep/mamba-ssm forecast ─────────────────────────────────────────────
  runModule("mamba_ssm", () => {
    if (rets.length < 30) return undefined;
      const state = createSSM(8);
      const future = ssmForecast(state, rets.slice(-60));
      const meanFuture = future.reduce((s, x) => s + x, 0) / future.length;
      signals.push({
        name: "mamba_ssm",
        value: Math.max(-1, Math.min(1, meanFuture * 30)),
        confidence: 0.55,
      });
    return true;
  });

  // ── deep/mixture-density forecast ───────────────────────────────────────
  runModule("mixture_density", () => {
    if (rets.length < 30) return undefined;
      // Build a 3-component mixture from recent return distribution.
      const sorted = [...rets].sort((a, b) => a - b);
      const q = (p: number) => sorted[Math.floor(p * (sorted.length - 1))];
      const mus = [q(0.15), q(0.5), q(0.85)];
      const std = Math.sqrt(rets.reduce((s, x) => s + x * x, 0) / rets.length) || 1e-6;
      const comps = buildMixture([1, 2, 1], mus, [std, std, std]);
      const ev = mixEV(comps);
      const variance = mixVar(comps);
      signals.push({
        name: "mixture_density",
        value: Math.max(-1, Math.min(1, ev * 40)),
        confidence: Math.max(0.2, Math.min(0.8, 1 - variance * 50)),
      });
    return true;
  });

  // ── deep/diffusion-prices Monte-Carlo path ──────────────────────────────
  runModule("diffusion_paths", () => {
    if (!(rets.length >= 20 && ctx.indicators.close > 0)) return undefined;
      const mu = rets.reduce((s, x) => s + x, 0) / rets.length;
      const sigma = Math.sqrt(rets.reduce((s, x) => s + (x - mu) ** 2, 0) / rets.length) || 1e-6;
      const paths = generatePaths(
        ctx.indicators.close,
        { steps: 10, horizon: 10, drift: mu, vol: sigma },
        40,
      );
      const stats = pathStats(paths);
      const meanEnd = stats.mean[stats.mean.length - 1] ?? ctx.indicators.close;
      const expectedRet = (meanEnd - ctx.indicators.close) / ctx.indicators.close;
      signals.push({
        name: "diffusion_paths",
        value: Math.max(-1, Math.min(1, expectedRet * 20)),
        confidence: 0.5,
      });
    return true;
  });

  // ── reliability/ood-detection ───────────────────────────────────────────
  runModule("ood_detector", () => {
    if (candles.length < 40) return undefined;
      // Treat each recent day as a feature vector [ret, range, volRatio].
      const samples = candles.slice(-40, -5).map((c, i, arr) => {
        const prev = i > 0 ? arr[i - 1].close : c.close;
        const ret = prev > 0 ? (c.close - prev) / prev : 0;
        const range = (c.high - c.low) / Math.max(1e-9, c.close);
        const volR = c.volume / Math.max(1, ctx.indicators.volAvg20 ?? 1);
        return [ret, range, volR];
      });
      const stats = fitDistribution(samples);
      const last = candles[candles.length - 1];
      const prev = candles[candles.length - 2] ?? last;
      const x = [
        prev.close > 0 ? (last.close - prev.close) / prev.close : 0,
        (last.high - last.low) / Math.max(1e-9, last.close),
        last.volume / Math.max(1, ctx.indicators.volAvg20 ?? 1),
      ];
      const ood = isOOD(x, stats, 3.5);
      // OOD = today is unusual → reduce confidence.
      signals.push({ name: "ood_detector", value: ood ? -0.5 : 0.1, confidence: 0.6 });
    return true;
  });

  // ── deep/memory-augmented-network (pattern recall) ──────────────────────
  runModule("pattern_memory", () => {
    if (rets.length < 10) return undefined;
      const query = rets.slice(-10);
      const recall = memRead(memBank, query, 3);
      if (recall.neighbors.length > 0) {
        signals.push({
          name: "pattern_memory",
          value: Math.max(-1, Math.min(1, recall.prediction)),
          confidence: Math.min(0.7, recall.neighbors.length / 3),
        });
      }
      // Write current pattern with placeholder outcome (will be overwritten when realised).
      memWrite(memBank, { key: query, value: 0, ts: Date.now() });
    return true;
  });

  // ── advstats/garch — forecast next-period volatility ───────────────────
  runModule("garch_vol", () => {
    if (rets.length < 30) return undefined;
      const params = fitGARCH(rets);
      const volForecast = forecastGARCH(params, rets, 5);
      const avgFutureVol = volForecast.reduce((s, x) => s + x, 0) / volForecast.length;
      const currentVol = Math.sqrt(rets.reduce((s, x) => s + x * x, 0) / rets.length) || 1e-9;
      const volChange = (avgFutureVol - currentVol) / currentVol;
      // Rising vol → caution (negative); falling vol → calmer (positive).
      signals.push({
        name: "garch_vol",
        value: Math.max(-0.8, Math.min(0.5, -volChange)),
        confidence: 0.6,
      });
    return true;
  });

  // ── advstats/hawkes — clustering of large-move events ──────────────────
  runModule("hawkes_events", () => {
    if (rets.length < 30) return undefined;
      const threshold = 2 * Math.sqrt(rets.reduce((s, x) => s + x * x, 0) / rets.length);
      const eventTimes: number[] = [];
      rets.forEach((r, i) => { if (Math.abs(r) > threshold) eventTimes.push(i); });
    if (eventTimes.length < 3) return undefined;
        const params = fitHawkes(eventTimes, rets.length);
        const ratio = branchingRatio(params);
        // High branching ratio = self-exciting / unstable regime.
        signals.push({
          name: "hawkes_events",
          value: Math.max(-0.6, Math.min(0.2, -(ratio - 0.5) * 1.0)),
          confidence: 0.5,
        });
    return true;
  });

  // ── simulation/gbm — Monte-Carlo probUp ─────────────────────────────────
  runModule("gbm_mc", () => {
    if (candles.length < 30) return undefined;
      const prices = candles.slice(-60).map((c) => c.close);
      const params = estimateGBMParams(prices);
      const result = monteCarloGBM(ctx.indicators.close, params, 10, 300);
      // probUp − 0.5 → bull/bear tilt in [-0.5, 0.5].
      signals.push({
        name: "gbm_mc",
        value: Math.max(-1, Math.min(1, (result.probUp - 0.5) * 2)),
        confidence: 0.55,
      });
    return true;
  });

  // ── simulation/jump-diffusion — jump-aware probUp ───────────────────────
  runModule("jump_diffusion", () => {
    if (candles.length < 40) return undefined;
      const prices = candles.slice(-80).map((c) => c.close);
      const params = estimateJumpParams(prices);
      let upCount = 0;
      const N = 200;
      for (let i = 0; i < N; i++) {
        const p = simulateJumpPath(ctx.indicators.close, params, 10);
        if (p[p.length - 1] > ctx.indicators.close) upCount++;
      }
      signals.push({
        name: "jump_diffusion",
        value: Math.max(-1, Math.min(1, (upCount / N - 0.5) * 2)),
        confidence: 0.5,
      });
    return true;
  });

  // ── simulation/agent-based-market — agents consensus ───────────────────
  runModule("agent_market", () => {
    if (candles.length < 20) return undefined;
      const fundamental = ctx.indicators.sma50 ?? ctx.indicators.close;
      const agents = createDiverseAgents(40);
      const sim = simulateAgentMarket(ctx.indicators.close, fundamental, agents, 20);
      const finalP = sim.prices[sim.prices.length - 1];
      const tilt = (finalP - ctx.indicators.close) / ctx.indicators.close;
      signals.push({
        name: "agent_market",
        value: Math.max(-1, Math.min(1, tilt * 15)),
        confidence: 0.35,
      });
    return true;
  });

  // ── simulation/synthetic-data — bootstrap robustness check ─────────────
  runModule("bootstrap_robustness", () => {
    if (rets.length < 30) return undefined;
      const synth = generateSyntheticReturns(rets, 30);
      const synthMean = synth.reduce((s, x) => s + x, 0) / synth.length;
      const realMean = rets.slice(-30).reduce((s, x) => s + x, 0) / 30;
      // If real vs synthetic agree on direction → robust signal.
      const agree = Math.sign(synthMean) === Math.sign(realMean);
      signals.push({
        name: "bootstrap_robustness",
        value: agree ? Math.max(-0.5, Math.min(0.5, realMean * 30)) : 0,
        confidence: 0.4,
      });
    return true;
  });

  // ── features/auto-feature-gen + tsfresh — composite momentum ───────────
  runModule("auto_features", () => {
    if (candles.length < 20) return undefined;
      const cacheKey = {
        entity: ctx.symbol,
        feature: "auto_composite",
        version: "v1",
        bucket: candles[candles.length - 1].date,
      };
      const cached = globalFeatureStore.get(cacheKey);
      let composite: number;
      if (typeof cached === "number") {
        composite = cached;
      } else {
        const af = generateFeatures(candles.slice(-200));
        const ts = tsfreshFeatures(rets.slice(-60));
        const r5 = af.return_5 ?? 0;
        const r20 = af.return_20 ?? 0;
        const pmaRatio = (af.price_to_ma_20 ?? 1) - 1;
        const skew = ts.skew ?? 0;
        composite = 0.4 * Math.tanh(r5 * 25) + 0.35 * Math.tanh(r20 * 10) + 0.2 * Math.tanh(pmaRatio * 8) + 0.05 * Math.tanh(skew);
        globalFeatureStore.set(cacheKey, composite);
      }
      signals.push({
        name: "auto_features",
        value: Math.max(-1, Math.min(1, composite)),
        confidence: 0.65,
      });
    return true;
  });

  // ── perf/incremental-learning — persistent online model per symbol ─────
  runModule("online_model", () => {
    if (rets.length < 20) return undefined;
      const dim = 5;
      const x = [
        Math.tanh((rets[rets.length - 1] ?? 0) * 50),
        Math.tanh((rets[rets.length - 2] ?? 0) * 50),
        Math.tanh(rets.slice(-5).reduce((s, r) => s + r, 0) * 20),
        Math.tanh(((ctx.indicators.rsi14 ?? 50) - 50) / 50),
        Math.tanh(((ctx.indicators.volRatio ?? 1) - 1)),
      ];
      let model = onlineModels.get(ctx.symbol);
      if (!model) {
        model = initOnlineModel(dim, 0.02, 0.0001);
        onlineModels.set(ctx.symbol, model);
      }
      const pred = predictOnline(model, x);
      // Online update: train on previous return direction as label.
      const y = Math.sign(rets[rets.length - 1] ?? 0);
      onlineModels.set(ctx.symbol, partialFit(model, x, y));
      signals.push({
        name: "online_model",
        value: Math.max(-1, Math.min(1, pred)),
        confidence: 0.45,
      });
    return true;
  });

  // ── volume profile (VWAP + POC) ────────────────────────────────────────
  runModule("volume_profile", () => {
    const vp = volumeProfile(candles.slice(-60));
    if (!vp) return undefined;
    signals.push({ name: "volume_profile", value: vp.value, confidence: 0.55 });
    return true;
  });

  // ── seasonality (day-of-week / week-of-month) ──────────────────────────
  runModule("seasonality", () => {
    const s = seasonalTilt(candles);
    if (s.samples < 3) return undefined;
    signals.push({ name: "seasonality", value: s.value, confidence: 0.35 });
    return true;
  });

  // ── smart-money flow (accumulation/distribution proxy) ─────────────────
  runModule("smart_money", () => {
    const sm = smartMoneyFlow(candles);
    if (candles.length < 22) return undefined;
    signals.push({ name: "smart_money", value: sm.value, confidence: 0.5 });
    return true;
  });

  // ── V2.1 SGD online prediction ─────────────────────────────────────────
  runModule("sgd_online", () => {
    if (rets.length < 10) return undefined;
    const x = [
      Math.tanh((rets[rets.length - 1] ?? 0) * 50),
      Math.tanh(rets.slice(-5).reduce((s, r) => s + r, 0) * 20),
      Math.tanh(((ctx.indicators.rsi14 ?? 50) - 50) / 50),
      Math.tanh(((ctx.indicators.volRatio ?? 1) - 1)),
    ];
    const pred = sgdPredict(ctx.symbol, x);
    signals.push({ name: "sgd_online", value: pred, confidence: 0.45 });
    return true;
  });

  // ── V2.8 Order-book imbalance proxy ────────────────────────────────────
  runModule("ob_imbalance", () => {
    if (candles.length < 5) return undefined;
    signals.push({ name: "ob_imbalance", value: obImbalance(candles), confidence: 0.5 });
    return true;
  });

  // ── V2.7 Lead/lag vs SMA50 proxy (no index dependency) ─────────────────
  runModule("lead_lag", () => {
    if (rets.length < 20) return undefined;
    // Use rolling mean of rets as a "market" proxy.
    const mkt: number[] = [];
    for (let i = 5; i < rets.length; i++) {
      const w = rets.slice(i - 5, i);
      mkt.push(w.reduce((s, x) => s + x, 0) / w.length);
    }
    const sym = rets.slice(5);
    const ll = leadLagScore(sym, mkt, 1);
    signals.push({ name: "lead_lag", value: Math.max(-1, Math.min(1, ll)), confidence: 0.4 });
    return true;
  });

  // ── V2.11 Sector graph neighbor consensus ──────────────────────────────
  runModule("sector_graph", () => {
    const nb = neighborConsensus(ctx.sector ?? null);
    if (nb.n < 2) return undefined;
    signals.push({ name: "sector_graph", value: nb.value, confidence: Math.min(0.6, nb.n / 10) });
    return true;
  });

  // ── final integration ───────────────────────────────────────────────────
  // 1) Regime + learned + per-symbol + per-sector weight overlays.
  const regime = detectRegime(candles);
  const learnedW = getWeightMultipliers();
  const regimeW = regimeWeights(regime);
  const symbolW = getSymbolWeightOverlay(ctx.symbol);
  const sectorW = getSectorWeightOverlay(ctx.sector);
  const finalWeights = mergeWeights(
    mergeWeights(mergeWeights(mergeWeights(weights, learnedW), regimeW), symbolW),
    sectorW,
  );

  // 2) Base integration with learned + regime weights.
  const res = integrateSignals(ctx.baseConfidence, signals, finalWeights, 0.30);

  // 3) Diversity / disagreement penalty on the confidence DELTA.
  const div = diversity(signals);
  let delta = res.adjustedConfidence - ctx.baseConfidence;
  delta *= div.multiplier;

  // 4) Adversarial robustness penalty on the same delta.
  const rob = robustness(ctx.baseConfidence, signals, finalWeights);
  delta *= rob.multiplier;

  // 5) Multi-timeframe confluence bonus / penalty.
  const mtf = multiTimeframeAgreement(candles);
  delta *= mtf.bonus;

  // 6) Drift detection on recent returns.
  const psi = driftPSI(ctx.symbol, rets.slice(-60));
  delta *= driftMultiplier(psi);

  // 7) Correlation-aware cluster penalty (per scan).
  const cp = clusterPenalty(ctx.symbol, ctx.sector ?? null);
  delta *= cp;

  // 8) Bayesian uncertainty → reduce trust on wide bands.
  const rawAdjusted = Math.max(0, Math.min(100, ctx.baseConfidence + delta));
  const interval = bayesianInterval(signals, rawAdjusted);
  delta *= interval.trust;

  // V2.2 Conformal interval — distribution-free band based on past residuals.
  let conformal: { lower: number; upper: number; q: number } | undefined;
  try { conformal = conformalInterval(ctx.symbol, rawAdjusted, 0.1); } catch {}

  // V2.3 Stacking meta-learner — blends module outputs.
  try {
    const stackMul = stackMultiplier(signals.map((s) => ({ name: s.name, value: s.value })));
    delta *= stackMul;
  } catch {}

  // Tier-A.4 Bayesian Model Averaging — posterior-weighted blend.
  try {
    const bma = bmaMultiplier(signals.map((s) => ({ name: s.name, value: s.value })));
    delta *= bma;
  } catch {}

  // Tier-A.2 Meta-Labeling gate — "bet or skip" probability.
  try {
    const rawAdj = Math.max(0, Math.min(100, ctx.baseConfidence + delta));
    const dir = (ctx.signal === "buy" || ctx.signal === "strong_buy") ? 1
              : ctx.signal === "sell" ? -1 : 0;
    const regimeBull = regime === "trending_up" ? 1 : regime === "trending_down" ? -1 : 0;
    const regimeVol = regime === "high_vol" ? 1 : 0;
    const feats = [(rawAdj - 50) / 50, dir, 0, regimeBull, regimeVol];
    delta *= metaMultiplier(feats);
  } catch {}

  // Tier-B.1 Regime-conditional model multiplier.
  try {
    const reg = regimeFromContext(regime);
    const x = [
      Math.tanh((rets[rets.length - 1] ?? 0) * 50),
      Math.tanh(rets.slice(-5).reduce((s, r) => s + r, 0) * 20),
      Math.tanh(((ctx.indicators.rsi14 ?? 50) - 50) / 50),
      Math.tanh(((ctx.indicators.volRatio ?? 1) - 1)),
    ];
    delta *= regimeMultiplier(reg, x);
    recordRecentSample("rsi", ctx.indicators.rsi14 ?? 50);
    recordRecentSample("volRatio", ctx.indicators.volRatio ?? 1);
  } catch {}

  // Tier-B.2 Cross-asset correlation graph pull.
  try {
    const lastRet = rets[rets.length - 1] ?? 0;
    recordSymbolMove(ctx.symbol, lastRet);
    const sigDir = (ctx.signal === "buy" || ctx.signal === "strong_buy") ? 1
                 : ctx.signal === "sell" ? -1 : 0;
    delta *= neighborMultiplier(ctx.symbol, sigDir);
  } catch {}

  // Tier-B.3 Microstructure features (OHLCV-derived).
  try {
    if (candles.length >= 10) {
      const mf = microstructure(candles.slice(-30));
      const sigDir = (ctx.signal === "buy" || ctx.signal === "strong_buy") ? 1
                   : ctx.signal === "sell" ? -1 : 0;
      delta *= microMultiplier(mf, sigDir);
    }
  } catch {}

  // Tier-B.4 Adversarial validation — global feature drift damper.
  try { delta *= globalDriftMultiplier(); } catch {}

  // Tier-C/D/E integrations (fail-open, all default to 1.0 without data).
  try {
    const sigDir = (ctx.signal === "buy" || ctx.signal === "strong_buy") ? 1
                 : ctx.signal === "sell" ? -1 : 0;
    // C.1 Contextual bandits over (regime, conf bucket, module).
    delta *= banditMultiplier(regime, ctx.baseConfidence + delta,
      signals.map((s) => s.name));
    // C.3 Kalman decoupling boost (uses index trend as proxy for indexRet).
    const lastRet = rets[rets.length - 1] ?? 0;
    kalmanBetaUpdate(ctx.symbol, lastRet, (ctx.indexTrendPct ?? 0) / 100);
    delta *= kalmanDecoupleMultiplier(ctx.symbol);
    pushSymbolReturn(ctx.symbol, lastRet);
    // D.4 OFI proxy from candles.
    if (candles.length >= 10) {
      const closes = candles.map((c) => c.close);
      const vols = candles.map((c) => c.volume);
      ofiProxy(ctx.symbol, closes, vols);
      delta *= ofiMultiplier(ctx.symbol, sigDir as 1 | -1 | 0);
    }
    // D.5 News similarity (uses provided headline if any).
    delta *= newsSimilarityMultiplier(ctx.newsHeadline ?? null, sigDir as 1 | -1 | 0);
    // D.6 Sector rotation.
    delta *= sectorRotationMultiplier(ctx.sector ?? null, sigDir as 1 | -1 | 0);
    // E.9 ADWIN drift on this symbol's last return.
    adwinUpdate(`ret:${ctx.symbol}`, lastRet);
    delta *= adwinMultiplier(`ret:${ctx.symbol}`);
  } catch {}

  // Tier-F/G/H integrations (fail-open).
  try {
    const sigDir = (ctx.signal === "buy" || ctx.signal === "strong_buy") ? 1
                 : ctx.signal === "sell" ? -1 : 0;
    const closes = candles.map((c) => c.close);
    const vols = candles.map((c) => c.volume);
    // G.4 wavelet, G.5 hurst, G.6 volume-bars
    if (closes.length >= 20) {
      delta *= waveletMultiplier(closes);
      delta *= hurstMultiplier(closes, sigDir as 1 | -1 | 0);
      delta *= volumeBarMultiplier(closes, vols, sigDir as 1 | -1 | 0);
    }
    // F.3 Stacking L2 over tier-level scores
    const tierScores: Record<string, number> = {
      base: (ctx.baseConfidence - 50) / 50,
      delta: Math.tanh(delta / 20),
      regime_code: regime === "trending_up" ? 1 : regime === "trending_down" ? -1 : 0,
    };
    delta *= stackL2Multiplier(tierScores);
    // H.8 ensemble uncertainty
    const unc = ensembleUncertainty(signals.map((s) => s.value));
    delta *= unc.multiplier;
    // H.9 anomaly circuit-breaker
    delta *= circuitBreakerMultiplier();
    // F.2 feature store snapshot for time-travel queries
    snapshotFeatures(ctx.symbol, {
      base: ctx.baseConfidence, delta, regime_code: tierScores.regime_code,
      rsi: ctx.indicators.rsi14 ?? 50, volRatio: ctx.indicators.volRatio ?? 1,
    });
  } catch {}

  // V2.4 Change-point detection — recent regime shift → reduce trust.
  try {
    if (cusumChangePoint(rets)) delta *= 0.8;
  } catch {}

  // V2.5 Sector contagion (Hawkes proxy).
  try { delta *= contagionMultiplier(ctx.sector ?? null); } catch {}

  // V2.6 HMM-lite regime overlay.
  let hmm: string | undefined;
  try {
    const st = hmmState(rets);
    hmm = st;
    delta *= hmmMultiplier(st);
  } catch {}

  // V2.9 Counterfactual edge — past "enter" vs "skip" performance.
  try {
    const edge = counterfactualEdge();
    if (edge < -0.005) delta *= 0.9;   // historical enters lose vs skip
    else if (edge > 0.005) delta *= 1.05;
  } catch {}

  // Record sector move for contagion + graph layers (use latest return).
  try {
    const lastRet = rets[rets.length - 1] ?? 0;
    recordSectorMove(ctx.sector ?? null, lastRet);
  } catch {}

  // 8b) Feature-importance weighting — modules with no predictive history
  //     have their contribution dampened. Applied as a small global tilt
  //     based on the strongest features that actually fired.
  try {
    let impAvg = 0, n = 0;
    for (const s of signals) {
      const m = importanceMultiplier(s.name);
      impAvg += m; n++;
    }
    if (n > 0) {
      const avg = impAvg / n;
      // avg ~1 = neutral; <1 = weak features → dampen delta; >1 = strong → boost.
      delta *= Math.max(0.6, Math.min(1.25, avg));
    }
  } catch {}

  // 9) Earnings calendar awareness.
  let earningsDays: number | null = null;
  try {
    const ed = await nextEarningsDate(ctx.symbol);
    if (ed) {
      earningsDays = daysBetween(new Date(), ed);
      delta *= earningsMultiplier(earningsDays);
    }
  } catch {}

  // Tier-B.5 Event study — apply expected CAR if near earnings.
  try {
    if (earningsDays !== null && earningsDays >= 0 && earningsDays <= 5) {
      const sigDir = (ctx.signal === "buy" || ctx.signal === "strong_buy") ? 1
                   : ctx.signal === "sell" ? -1 : 0;
      delta *= eventMultiplier("earnings", sigDir);
    }
  } catch {}

  // 10) Optional LLM sanity check + multi-agent debate (fail-open).
  let llmVerdict: string | undefined;
  if (ctx.useLLM && ctx.signal) {
    try {
      const llm = await sanityCheck({
        symbol: ctx.symbol, signal: ctx.signal,
        confidence: ctx.baseConfidence + delta,
        regime, signals,
      });
      llmVerdict = llm.verdict;
      delta *= llm.multiplier;
    } catch {}
    try {
      const dbg = await multiAgentDebate({
        symbol: ctx.symbol, signal: ctx.signal,
        confidence: ctx.baseConfidence + delta,
        regime,
        signals: signals.map((s) => ({ name: s.name, value: s.value })),
      });
      llmVerdict = `${llmVerdict ?? ""}|debate:${dbg.verdict}`;
      delta *= dbg.multiplier;
    } catch {}
  }

  // 11) Reassemble and calibrate.
  const finalRaw = Math.max(0, Math.min(100, ctx.baseConfidence + delta));
  const calibrated = calibratedConfidence(finalRaw);

  // Tier-J.1 isotonic blend — average Platt + Isotonic for robustness.
  let blended = calibrated;
  try {
    const iso = isotonicCalibrate(finalRaw) * 100;
    blended = Math.max(0, Math.min(100, (calibrated + iso) / 2));
  } catch {}

  // Tier-J.2 day-of-week edge multiplier.
  let dowAdjusted = blended;
  try {
    const mult = dowMultiplier(new Date());
    dowAdjusted = Math.max(0, Math.min(100, blended * mult));
  } catch {}

  // Tier-J.5 regime-conditional stacking — re-weight top contributing tiers.
  try {
    if (res.contributions.length > 0) {
      let mult = 1.0, n = 0;
      for (const c of res.contributions.slice(0, 5)) {
        mult += regimeStackWeight(regime, c.name) - 1;
        n++;
      }
      if (n > 0) {
        const adjusted = dowAdjusted * (1 + (mult - 1) / n * 0.3);
        dowAdjusted = Math.max(0, Math.min(100, adjusted));
      }
    }
  } catch {}

  // Tier-K.2 online-learned nudge (additive ±15 points).
  try {
    if (res.contributions.length > 0) {
      const feats: Record<string, number> = {};
      for (const c of res.contributions.slice(0, 8)) {
        feats[c.name] = c.contribution ?? 0;
      }
      const nudge = await olScoreNudge(feats);
      dowAdjusted = Math.max(0, Math.min(100, dowAdjusted + nudge));
    }
  } catch {}

  // Tier-K.1 semantic RAG — déjà-vu boost/penalty from similar past headlines.
  try {
    const recentHeadline = (ctx as { latestHeadline?: string }).latestHeadline;
    if (recentHeadline) {
      const rag = await ragQuerySimilarNews(ctx.symbol, recentHeadline);
      if (rag.count >= 3 && rag.confidence > 0.4) {
        // each 1% historical avg outcome → 1 confidence point, clipped ±12
        const adj = Math.max(-12, Math.min(12, rag.avgOutcomePct * rag.confidence));
        dowAdjusted = Math.max(0, Math.min(100, dowAdjusted + adj));
      }
    }
  } catch {}

  // Tier-M.2 multi-timeframe confirmation (daily + weekly + bi-weekly).
  try {
    const mtf = multiTimeframeConfirm(ctx.candles);
    if (mtf.nudge !== 0) {
      dowAdjusted = Math.max(0, Math.min(100, dowAdjusted + mtf.nudge));
    }
  } catch {}

  // Tier-M.3 sector rotation — record this symbol's 5d move and apply sector multiplier.
  try {
    if (ctx.candles && ctx.candles.length >= 6 && ctx.sector) {
      const closes = ctx.candles.map((c) => c.close);
      const last = closes[closes.length - 1];
      const ref = closes[closes.length - 6];
      if (ref > 0) recordSectorReturnM(ctx.sector, ((last - ref) / ref) * 100);
      const mult = sectorRotationMultiplierM(ctx.sector);
      if (mult !== 1) {
        const adjusted = 50 + (dowAdjusted - 50) * mult;
        dowAdjusted = Math.max(0, Math.min(100, adjusted));
      }
    }
  } catch {}

  // Tier-N.1 outcome-weighted pattern memory.
  try {
    const patternNames = (ctx.indicators.patterns ?? []).map((p) => p.name);
    notePendingPatterns(ctx.symbol, patternNames);
    const mult = patternOutcomeMultiplier(patternNames);
    if (mult !== 1) {
      const adjusted = 50 + (dowAdjusted - 50) * mult;
      dowAdjusted = Math.max(0, Math.min(100, adjusted));
    }
  } catch {}

  // Tier-N.2 regime-aware confidence (uses broader market trend).
  try {
    const mult = regimeAwareMultiplier(ctx.signal, ctx.indexTrendPct);
    if (mult !== 1) {
      const adjusted = 50 + (dowAdjusted - 50) * mult;
      dowAdjusted = Math.max(0, Math.min(100, adjusted));
    }
  } catch {}

  // Tier-N.3 anomaly outlier filter (penalises volume spikes / large gaps).
  try {
    const a = anomalyOutlierFilter(ctx.candles);
    if (a.multiplier !== 1) {
      const adjusted = 50 + (dowAdjusted - 50) * a.multiplier;
      dowAdjusted = Math.max(0, Math.min(100, adjusted));
    }
  } catch {}

  // Tier-O.2 sector concentration filter — penalise repeated picks in same sector.
  try {
    const isPick = (ctx.signal === "buy" || ctx.signal === "strong_buy");
    if (isPick) {
      const mult = sectorConcentrationMultiplier(ctx.sector);
      if (mult !== 1) {
        const adjusted = 50 + (dowAdjusted - 50) * mult;
        dowAdjusted = Math.max(0, Math.min(100, adjusted));
      }
      noteSectorPick(ctx.sector);
    }
  } catch {}

  // Tier-O.3 learned day-of-week multiplier (separate from static tier-J).
  try {
    const mult = dowLearnedMultiplier(new Date());
    if (mult !== 1) {
      dowAdjusted = Math.max(0, Math.min(100, dowAdjusted * mult));
    }
  } catch {}

  // Tier-O.4 stricter earnings-proximity guard (compounds with tier-J).
  try {
    const mult = earningsProximityGuard(earningsDays);
    if (mult !== 1) {
      const adjusted = 50 + (dowAdjusted - 50) * mult;
      dowAdjusted = Math.max(0, Math.min(100, adjusted));
    }
  } catch {}

  // Tier-O.5 meta-learning: weight technical/fundamental/sentiment by recent accuracy.
  try {
    const fromCtx = ctx as unknown as {
      technicalScore?: number; fundamentalScore?: number;
      sentimentScore?: number; macroScore?: number; sectorScore?: number;
    };
    const mult = metaWeightedMultiplier({
      technical: fromCtx.technicalScore,
      fundamental: fromCtx.fundamentalScore,
      sentiment: fromCtx.sentimentScore,
      macro: fromCtx.macroScore,
      sector: fromCtx.sectorScore,
    });
    if (mult !== 1) {
      const adjusted = 50 + (dowAdjusted - 50) * mult;
      dowAdjusted = Math.max(0, Math.min(100, adjusted));
    }
  } catch {}

  // Tier-O.6 reliability-curve calibration (empirical bucket-based).
  try {
    dowAdjusted = reliabilityCalibrate(dowAdjusted);
  } catch {}

  // Tier-O.1 Kelly fraction (advisory — attached to risk plan if present).
  let kellyFrac = 0;
  try {
    const patternNames = (ctx.indicators.patterns ?? []).map((p) => p.name);
    kellyFrac = kellyFraction(patternNames);
  } catch {}

  // Tier-P.1 Liquidity + suspension filter — kill un-tradable picks.
  try {
    const liq = liquidityMultiplier(ctx.candles);
    const sus = suspensionPenalty(ctx.candles);
    const m = liq * sus;
    if (m !== 1) {
      const adjusted = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adjusted));
    }
  } catch {}

  // Tier-P.2 Walk-forward model-decay penalty.
  try {
    const m = decayMultiplier("auto-orchestrator-v2");
    if (m !== 1) {
      const adjusted = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adjusted));
    }
  } catch {}

  // Tier-P.3 Strategy-family BMA (momentum / mean-rev / breakout).
  let stratFamily: ReturnType<typeof classifyStrategy> = "other";
  try {
    stratFamily = classifyStrategy({
      rsi: ctx.indicators.rsi14,
      close: ctx.indicators.close,
      sma50: ctx.indicators.sma50,
      bbUpper: ctx.indicators.bbUpper,
      bbLower: ctx.indicators.bbLower,
    });
    const m = strategyBMAMultiplier(stratFamily);
    if (m !== 1) {
      const adjusted = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adjusted));
    }
  } catch {}

  // Tier-P.5 Cross-sectional ranking — boost top decile within today's universe.
  try {
    recordUniverseScore(dowAdjusted);
    const m = crossSectionalMultiplier(dowAdjusted);
    if (m !== 1) {
      const adjusted = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adjusted));
    }
  } catch {}

  // Tier-P.4 Conformal interval per regime (replaces width if available).
  let conformalP: { lower: number; upper: number; halfWidth: number } | null = null;
  try {
    const hw = conformalHalfWidth(regime, 0.90);
    if (hw !== null) {
      conformalP = {
        lower: Math.max(0, dowAdjusted - hw),
        upper: Math.min(100, dowAdjusted + hw),
        halfWidth: hw,
      };
    }
  } catch {}

  // V2.11 Record this symbol's signal into sector graph for neighbors.
  try {
    const dir = (ctx.signal === "buy" || ctx.signal === "strong_buy") ? 1
              : ctx.signal === "sell" ? -1 : 0;
    recordSectorSignal(ctx.sector ?? null, dir * (dowAdjusted - 50) / 50);
  } catch {}

  // ── Tier-Q intelligence layer ────────────────────────────────────────
  // Q.1 HMM-detected regime overlay (separate from static regime).
  let hmmQState: "bull" | "bear" | "sideways" = "sideways";
  try {
    hmmQState = hmmRegimeQ(rets);
    const m = hmmMultiplierQ(hmmQState);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {}
  // Q.2 Bayesian shrinkage when pattern win-rate is uncertain.
  try {
    const rawPatterns = (ctx.indicators.patterns ?? []) as Array<string | { name?: string }>;
    const patterns = rawPatterns
      .map((p) => typeof p === "string" ? p : (p?.name ?? ""))
      .filter(Boolean);
    if (patterns.length) {
      const m = bayesShrinkMultiplierQ(patterns);
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {}
  // Q.3 SHAP-like feature impact tilt from contributing modules.
  try {
    const names = signals.map((s) => s.name);
    const m = featureImpactMultiplierQ(names);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {}
  // Q.4 Adversarial drift alarm: also record current features as prod samples.
  try {
    for (const s of signals) recordProdFeatureQ(s.name, s.value);
    const m = driftAlarmMultiplierQ();
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {}
  // Q.6 Winsorised confidence (clip outlier confidences vs recent distribution).
  try {
    recordConfidenceSampleQ(dowAdjusted);
    dowAdjusted = winsorizedConfidenceQ(dowAdjusted);
  } catch {}
  // Q.7 Multi-horizon forecast (advisory; attached to provenance below).
  let horizons: { h3: number; h5: number; h10: number; h20: number } | null = null;
  try { horizons = multiHorizonForecastQ(rets); } catch {}
  // Q.8 KNN historical analogs — boost when similar past cases mostly won.
  let knnInfo: { multiplier: number; analogs: number; winRate: number } | null = null;
  try {
    const featVec = signals.slice(0, 8).map((s) => Math.tanh(s.value));
    knnInfo = knnSimilarityMultiplierQ(featVec, 5);
    if (knnInfo.multiplier !== 1) {
      const adj = 50 + (dowAdjusted - 50) * knnInfo.multiplier;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {}

  // ── Tier-R intelligence layer ────────────────────────────────────────
  const tierRMults: number[] = [];
  // R.1 Thompson Sampling on strategy-family arm.
  try {
    const fam = classifyStrategy({
      rsi: ctx.indicators.rsi14,
      close: ctx.indicators.close,
      sma50: ctx.indicators.sma50,
      bbUpper: ctx.indicators.bbUpper,
      bbLower: ctx.indicators.bbLower,
    });
    const arm = `${fam}:${regime}`;
    const m = thompsonMultiplierR(arm);
    tierRMults.push(m);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {}
  // R.2 Causal IPW edge per confidence bucket.
  try {
    const m = ipwMultiplierR(dowAdjusted);
    tierRMults.push(m);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {}
  // R.3 Sector momentum.
  try {
    const m = sectorMomentumMultiplierR(ctx.sector ?? null);
    tierRMults.push(m);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {}
  // R.4 Earnings-proximity penalty (reuses earningsDays from §9 if any).
  try {
    const ed = earningsDays !== null
      ? new Date(Date.now() + earningsDays * 86400000).toISOString()
      : null;
    const m = earningsProximityMultiplierR(ed);
    tierRMults.push(m);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {}
  // R.5 Anchored VWAP deviation.
  try {
    const dev = anchoredVwapDevR(candles, 30);
    const m = anchoredVwapMultiplierR(dev?.deviationPct ?? null);
    tierRMults.push(m);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {}
  // R.6 Sentiment velocity.
  try {
    const fromCtx = ctx as unknown as { sentimentScore?: number };
    if (typeof fromCtx.sentimentScore === "number") {
      recordSentimentR(ctx.symbol, fromCtx.sentimentScore);
    }
    const m = sentimentVelocityMultiplierR(ctx.symbol);
    tierRMults.push(m);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {}
  // R.7 Volume Profile POC/VAH/VAL bands.
  try {
    const vp = volumeProfileR(candles, 24);
    const m = volumeProfileMultiplierR(ctx.indicators.close, vp);
    tierRMults.push(m);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {}
  // R.8 Ensemble disagreement across tier multipliers.
  try {
    const m = ensembleDisagreementR(tierRMults);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {}

  // ── Tier-S intelligence layer ────────────────────────────────────────
  const sigDir = (ctx.signal === "buy" || ctx.signal === "strong_buy") ? 1
               : ctx.signal === "sell" ? -1 : 0;
  // S.1 Kalman trend overlay.
  try {
    const closes = candles.map((c) => c.close);
    if (closes.length >= 10) {
      const k = kalmanTrendS(closes);
      const m = kalmanTrendMultiplierS(ctx.indicators.close, k);
      if (m !== 1) {
        const adj = 50 + (dowAdjusted - 50) * m;
        dowAdjusted = Math.max(0, Math.min(100, adj));
      }
    }
  } catch {}
  // S.2 Hurst exponent regime-fit.
  try {
    const h = hurstS(rets);
    const m = hurstMultiplierS(h, sigDir);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {}
  // S.3 CUSUM change-point — dampen when regime just shifted.
  try {
    const changed = cusumChangeS(rets);
    const m = cusumMultiplierS(changed);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {}
  // S.4 IC-weighted module trust.
  try {
    const m = icMultiplierS(signals.map((s) => s.name));
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {}
  // S.5 Vol-targeting size scaler.
  try {
    const m = volTargetMultiplierS(rets);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {}
  // S.6 Cache price for pairs (multiplier only fires when peer is tracked).
  try { cachePriceForPairsS(ctx.symbol, ctx.indicators.close); } catch {}
  // S.7 Order-flow imbalance from latest candle.
  try {
    const last = candles[candles.length - 1];
    if (last && typeof last.open === "number") {
      const ofi = orderFlowImbalanceS({
        open: last.open, high: last.high, low: last.low, close: last.close,
      });
      const m = orderFlowMultiplierS(ofi, sigDir);
      if (m !== 1) {
        const adj = 50 + (dowAdjusted - 50) * m;
        dowAdjusted = Math.max(0, Math.min(100, adj));
      }
    }
  } catch {}
  // S.8 Meta-confidence — trust score over current decision context.
  try {
    const regimeCode = regime === "trending_up" ? 1 : regime === "trending_down" ? -1
      : regime === "high_vol" ? 2 : regime === "mean_reverting" ? 0.5 : 0;
    const feats = [
      (dowAdjusted - 50) / 50,
      regimeCode,
      div.agreement,
      Math.min(1, signals.length / 10),
    ];
    const m = metaConfidenceS(feats);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {}

  // ── Tier-T intelligence layer ────────────────────────────────────────
  // T.1 HMM transition stability.
  try {
    recordHmmStateT(rets);
    const m = hmmTransitionMultiplierT(rets);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {}
  // T.2 GARCH vol forecast.
  try {
    const m = garchVolMultiplierT(rets);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {}
  // T.3 Bayesian Beta posterior per (family:regime) arm.
  try {
    const fam = sigDir > 0 ? "long" : sigDir < 0 ? "short" : "flat";
    const arm = `${fam}:${regime}`;
    const m = betaMultiplierT(arm);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {}
  // T.4 Module-signal concentration risk.
  try {
    const m = concentrationMultiplierT(signals.map((s) => s.value));
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {}
  // T.5 KS-drift on key features (also seeds ref/cur distributions).
  try {
    const rsi = ctx.indicators.rsi14 ?? 50;
    const vr = ctx.indicators.volRatio ?? 1;
    recordFeatureDistT("rsi", rsi, false);
    recordFeatureDistT("volRatio", vr, false);
    const m1 = ksDriftMultiplierT("rsi");
    const m2 = ksDriftMultiplierT("volRatio");
    const m = m1 * m2;
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {}
  // T.6 Permutation feature importance over recent modules.
  try {
    const m = permImportanceMultiplierT(signals.map((s) => s.name));
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {}
  // T.7 Online multiplicative-weights ensemble trust.
  try {
    const m = mwEnsembleMultiplierT(signals.map((s) => s.name));
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {}
  // T.8 Platt-scaling final calibration.
  try { dowAdjusted = plattCalibrateT(dowAdjusted); } catch {}

  // ── Tier-U intelligence layer ────────────────────────────────────────
  // U.3 BOCPD on latest return — fresh regime distrust.
  try {
    const lastRet = rets[rets.length - 1] ?? 0;
    bocpdUpdateU(lastRet);
    const m = bocpdMultiplierU();
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {}
  // U.4 Transfer-entropy leader bonus (record signals then read leader).
  try {
    for (const s of signals) recordModuleSignalU(s.name, s.value);
    const m = transferEntropyLeaderMultiplierU(signals.map((s) => s.name));
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {}
  // U.5 SGLD posterior uncertainty.
  try {
    const regimeCode = regime === "trending_up" ? 1 : regime === "trending_down" ? -1
      : regime === "high_vol" ? 2 : regime === "mean_reverting" ? 0.5 : 0;
    const feats = [
      (dowAdjusted - 50) / 50,
      regimeCode,
      Math.tanh((rets[rets.length - 1] ?? 0) * 50),
      Math.tanh(((ctx.indicators.rsi14 ?? 50) - 50) / 50),
    ];
    const m = sgldUncertaintyMultiplierU(feats);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {}
  // U.6 EVT tail-risk multiplier.
  try {
    const m = evtTailMultiplierU();
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {}
  // U.7 Symbol-adaptive multiplier.
  try {
    const m = symbolAdaptiveMultiplierU(ctx.symbol);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {}
  // U.8 OOF accuracy regulariser.
  try {
    const m = oofRegularizerMultiplierU();
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {}
  // U.2 Conformal quantile band width as final trust scaler.
  try {
    const m = conformalWidthMultiplierU((dowAdjusted - 50) / 50);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {}
  // U.1 Isotonic calibration as the final monotone re-map.
  try { dowAdjusted = isotonicCalibrateU(dowAdjusted); } catch {}

  // ── Tier V/W/X/Y/Z/AA/BB/CC/DD — meta-learning & robustness layer ──────────
  // V. Meta-learning across tiers (regime-conditional logistic weights).
  try {
    const tierSigs = res.contributions.slice(0, 10).map((c) => ({
      name: c.name, signal: c.weight > 0 ? c.contribution / c.weight : 0,
    }));
    const m = tierMetaMultiplierV(regime, tierSigs);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {}
  // W. Causal lift (propensity score matching lite).
  try {
    const feats: Record<string, number> = {};
    for (const s of signals.slice(0, 10)) feats[s.name] = s.value;
    const m = causalLiftMultiplierW(feats);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {}
  // X. Adversarial robustness — fragile signals get distrusted.
  try {
    const m = adversarialRobustnessMultiplierX(dowAdjusted, signals.map((s) => ({
      name: s.name, value: s.value, weight: 1,
    })));
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {}
  // Y. Curriculum — distrust hard regimes when historical accuracy is low.
  try {
    const vol = ctx.indicators.atr14 && ctx.indicators.close
      ? ctx.indicators.atr14 / ctx.indicators.close : 0.02;
    const m = curriculumMultiplierY(vol);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {}
  // Z. Imitation — boost when current features resemble past winners.
  try {
    const feats: Record<string, number> = {};
    for (const s of signals.slice(0, 12)) feats[s.name] = s.value;
    const m = imitationMultiplierZ(feats);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {}
  // AA. Hierarchical Bayesian shrinkage symbol→sector→global.
  try {
    const m = hierarchicalShrinkageMultiplierAA(ctx.symbol, ctx.sector ?? "unknown");
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {}
  // BB. Sortino-based risk-adjusted trust.
  try {
    const m = sortinoMultiplierBB();
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {}
  // CC. Pareto multi-objective (risk + frequency sweet spot).
  try {
    const risk = ctx.indicators.atr14 && ctx.indicators.close
      ? Math.min(1, (ctx.indicators.atr14 / ctx.indicators.close) * 30) : 0.3;
    const m = paretoMultiplierCC(risk, 0.3);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {}
  // DD. Explainability — penalise single-feature dominance.
  try {
    const m = explainabilityMultiplierDD(res.contributions);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {}

  // ── Tier EE/FF/GG/HH/II/JJ/KK/LL — drift, ensemble, decay, replay, MTF ─────
  try {
    const m = driftMultiplierEE();
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {}
  try {
    const sigs = signals.map((s) => ({ name: s.name, value: s.value }));
    const m = ensembleDisagreementMultiplierFF(sigs);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {}
  try {
    const feats: Record<string, number> = {};
    for (const s of signals.slice(0, 15)) feats[s.name] = s.value;
    const m = featureDecayMultiplierGG(feats);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {}
  try {
    const m = counterfactualMultiplierHH(dowAdjusted);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {}
  try {
    const m = multiTimeframeConfluenceMultiplierII(
      signals.map((s) => ({ name: s.name, value: s.value })),
    );
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {}
  try {
    const m = microstructureMultiplierJJ(
      ctx.indicators.atr14 ?? 0,
      ctx.indicators.close ?? 0,
      (ctx.indicators as { volume?: number }).volume ?? 0,
      (ctx.indicators as { avgVolume?: number }).avgVolume ?? 0,
    );
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {}
  try {
    const m = selfDiagnosticMultiplierKK(regime);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {}
  try {
    const m = hyperparamMultiplierLL();
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {}

  // ── Tier MM/OO/PP/QQ/RR/SS/TT — agent diagnostic, regime switching,
  //    sentiment velocity, order-book replay, anomaly quarantine, RL weights,
  //    backtesting-in-production. ─────────────────────────────────────────────
  try {
    const m = selfDiagnosticAgentMultiplierMM(regime, dowAdjusted);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {}
  try {
    const m = regimeSwitchingMultiplierOO(regime);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {}
  try {
    const m = sentimentVelocityMultiplierPP(ctx.symbol);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {}
  try {
    const m = orderBookReplayMultiplierQQ(
      ctx.indicators.close ?? 0,
      ctx.indicators.atr14 ?? 0,
      (ctx.indicators as { volume?: number }).volume ?? 0,
      (ctx.indicators as { avgVolume?: number }).avgVolume ?? 0,
    );
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {}
  try {
    const vec = signals.slice(0, 12).map((s) => s.value);
    const m = anomalyAutoQuarantineMultiplierRR(vec);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {}
  try {
    const m = rlOverWeightsMultiplierSS();
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {}
  try {
    const m = backtestingInProductionMultiplierTT();
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {}

  // ── Tier UU/VV/WW/XX/YY/ZZ/AAA/BBB — LLM meta, walk-fwd IC, cross-asset,
  //    options-flow proxy, narrative cluster, execution quality, stacking, RLHF. ─
  try {
    const dir = (dowAdjusted - 50) / 50;
    const m = llmMetaAnalystMultiplierUU(regime, dir);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {}
  try {
    const m = walkForwardICMultiplierVV();
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {}
  try {
    const m = crossAssetCorrelationMultiplierWW(ctx.symbol);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {}
  try {
    const m = optionsFlowMultiplierXX(ctx.symbol);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {}
  try {
    const cluster = `${ctx.sector ?? "unknown"}:${regime}`;
    const m = narrativeClusteringMultiplierYY(cluster);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {}
  try {
    const m = executionQualityMultiplierZZ();
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {}
  try {
    const sigs = signals.map((s) => ({ name: s.name, value: s.value }));
    const m = metaLearnerStackingMultiplierAAA(sigs);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {}
  try {
    const m = humanFeedbackMultiplierBBB(ctx.symbol);
    if (m !== 1) {
      const adj = 50 + (dowAdjusted - 50) * m;
      dowAdjusted = Math.max(0, Math.min(100, adj));
    }
  } catch {}

  // ── Tier CCC–PPP — BMA, Conformal, SHAP, Microstructure, Events, Kalman,
  //    GARCH, Cluster regimes, Transformer-lite, Causal, Adversarial, EWC,
  //    Multi-timeframe fusion, Portfolio risk parity. ─
  try {
    const m = bayesianModelAveragingMultiplierCCC(
      regime, signals.map((s) => ({ name: s.name, value: s.value })),
    );
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {}
  try {
    const m = conformalMultiplierDDD(dowAdjusted);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {}
  try {
    const m = featureImportanceMultiplierEEE(
      signals.map((s) => ({ name: s.name, value: s.value })),
    );
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {}
  try {
    const dir = (dowAdjusted - 50) / 50;
    const m = microstructureTickMultiplierFFF(ctx.symbol, dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {}
  try {
    const dir = (dowAdjusted - 50) / 50;
    const events = (ctx as { activeEvents?: string[] }).activeEvents ?? [];
    const m = eventStudyMultiplierGGG(events, dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {}
  try {
    const dir = (dowAdjusted - 50) / 50;
    const price = (ctx as { price?: number }).price ?? 0;
    if (price > 0) {
      const m = kalmanTrendMultiplierHHH(ctx.symbol, price, dir);
      if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
    }
  } catch {}
  try {
    const m = garchVolMultiplierIII(ctx.symbol);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {}
  try {
    const feats = signals.slice(0, 8).map((s) => s.value);
    const m = clusterRegimeMultiplierJJJ(feats);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {}
  try {
    const dir = (dowAdjusted - 50) / 50;
    const m = transformerSeqMultiplierKKK(dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {}
  try {
    const dir = (dowAdjusted - 50) / 50;
    const sentSig = signals.find((s) => /sent|news/i.test(s.name))?.value ?? 0;
    const m = causalInferenceMultiplierLLL(sentSig, dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {}
  try {
    const m = adversarialRobustnessMultiplierMMM(
      signals.map((s) => ({ name: s.name, value: s.value, weight: s.confidence ?? 1 })),
    );
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {}
  try {
    const m = continualLearningMultiplierNNN(
      signals.map((s) => ({ name: s.name, value: s.value })),
    );
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {}
  try {
    const dir = (dowAdjusted - 50) / 50;
    const tf = (ctx as { timeframes?: { sig1m?: number; sig5m?: number; sig1h?: number; sig1d?: number } }).timeframes ?? {};
    const m = multiTimeframeFusionMultiplierOOO(tf, dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {}
  try {
    const m = portfolioRiskParityMultiplierPPP(ctx.symbol, ctx.sector ?? "unknown");
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {}

  // ── Tier QQQ–FFFF — Alt data, insider, analyst, dark pool, RAG, LSTM, GA,
  //    quantum-opt, AutoML, bandit, MC planning, CoT, circuit-breaker, alerts. ─
  try {
    const dir = (dowAdjusted - 50) / 50;
    const m = alternativeDataFusionMultiplierQQQ(ctx.symbol, dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {}
  try {
    const dir = (dowAdjusted - 50) / 50;
    const m = insiderActivityMultiplierRRR(ctx.symbol, dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {}
  try {
    const dir = (dowAdjusted - 50) / 50;
    const m = analystRevisionMultiplierSSS(ctx.symbol, dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {}
  try {
    const dir = (dowAdjusted - 50) / 50;
    const m = darkPoolFlowMultiplierTTT(ctx.symbol, dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {}
  try {
    const dir = (dowAdjusted - 50) / 50;
    const feats = signals.slice(0, 12).map((s) => s.value);
    const m = vectorRAGMultiplierUUU(feats, dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {}
  try {
    const dir = (dowAdjusted - 50) / 50;
    const input = signals[0]?.value ?? dir;
    const m = lstmDeepLearningMultiplierVVV(ctx.symbol, input, dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {}
  try {
    const dir = (dowAdjusted - 50) / 50;
    const feats = signals.slice(0, 12).map((s) => s.value);
    const m = geneticAlgoMultiplierWWW(feats, dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {}
  try {
    const m = quantumInspiredMultiplierXXX(0.05, 0.05, 0.2);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {}
  try {
    const m = autoMLMultiplierYYY("min_confidence", 60, 60);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {}
  try {
    const m = multiArmedBanditMultiplierZZZ(
      regime, signals.map((s) => ({ name: s.name, value: s.value })),
    );
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {}
  try {
    const expRet = (ctx as { expectedGainPct?: number }).expectedGainPct ?? 3;
    const vol = 2.5;
    const horizon = (ctx as { timeframeDays?: number }).timeframeDays ?? 5;
    const m = simulationPlanningMultiplierAAAA(expRet, vol, horizon);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {}
  try {
    const dir = (dowAdjusted - 50) / 50;
    const m = chainOfThoughtMultiplierBBBB(dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {}
  try {
    const m = circuitBreakerMultiplierCCCC();
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {}
  try {
    checkCriticalSignalFFFF(ctx.symbol, dowAdjusted, 1.04, 2);
  } catch {}

  // ── Tier GGGG–RRRR — Microstructure (VPIN, Hawkes, Kyle's λ, PIN),
  //    Causal (Double-ML, Synthetic Control, IV, RDD),
  //    Meta-cognition (calibration, epistemic/aleatoric, OOD, decay). ─
  try {
    const dir = (dowAdjusted - 50) / 50;
    const m = vpinMultiplierGGGG(ctx.symbol, dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {}
  try {
    const dir = (dowAdjusted - 50) / 50;
    const m = hawkesMultiplierHHHH(ctx.symbol, dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {}
  try {
    const m = kyleLambdaMultiplierIIII(ctx.symbol);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {}
  try {
    const dir = (dowAdjusted - 50) / 50;
    const m = pinMultiplierJJJJ(ctx.symbol, dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {}
  try {
    const dir = (dowAdjusted - 50) / 50;
    const treatment = signals.find((s) => s.name.toLowerCase().includes("sentiment"))?.value ?? 0;
    const m = doubleMLMultiplierKKKK(treatment, dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {}
  try {
    const dir = (dowAdjusted - 50) / 50;
    const m = syntheticControlMultiplierLLLL(ctx.symbol, dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {}
  try {
    const dir = (dowAdjusted - 50) / 50;
    const endo = signals.find((s) => s.name.toLowerCase().includes("sentiment"))?.value ?? 0;
    const m = ivMultiplierMMMM(endo, dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {}
  try {
    const dir = (dowAdjusted - 50) / 50;
    const running = ctx.indicators.rsi14 ?? 50;
    const m = rddMultiplierNNNN(ctx.symbol, running, dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {}
  try {
    const m = metacognitiveMultiplierOOOO(regime ?? "default", dowAdjusted);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {}
  try {
    const m = uncertaintyMultiplierPPPP(regime ?? "default");
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {}
  try {
    const feats = signals.slice(0, 8).map((s) => s.value);
    if (feats.length === 8) {
      recordOODTrainingQQQQ(feats);
      const m = oodMultiplierQQQQ(feats);
      if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
    }
  } catch {}
  try {
    recordDistributionRRRR("confidence", dowAdjusted, false);
    const m = modelDecayMultiplierRRRR("confidence");
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {}

  // ── Tier SSSS–DDDDD — Adaptive learning, risk intelligence, robustness. ─
  try {
    const dir = (dowAdjusted - 50) / 50;
    const feats: Record<string, number> = {};
    for (const s of signals.slice(0, 12)) feats[s.name] = s.value;
    const m = sgdMultiplierSSSS(feats, dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {}
  try {
    const dir = (dowAdjusted - 50) / 50;
    const m = transferMultiplierTTTT(ctx.symbol, dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {}
  try {
    const dir = (dowAdjusted - 50) / 50;
    const feats = signals.slice(0, 8).map((s) => s.value);
    const m = fewShotMultiplierUUUU(feats, dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {}
  try {
    const feats = signals.slice(0, 8).map((s) => s.value);
    const m = contrastiveMultiplierVVVV(feats);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {}
  try {
    const m = kellyMultiplierWWWW();
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {}
  try {
    const m = correlationRegimeMultiplierXXXX();
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {}
  try {
    const m = cvarMultiplierYYYY();
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {}
  try {
    const dir = (dowAdjusted - 50) / 50;
    const m = hmmRegimeMultiplierZZZZ(dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {}
  try {
    const feats = signals.slice(0, 8).map((s) => s.value);
    if (feats.length >= 3) {
      // Stability check: score = dot(weights, perturbed); approximated by sum here
      const m = adversarialRobustnessMultiplierAAAAA(feats, (pf) =>
        50 + pf.reduce((a, b) => a + b, 0)
      );
      if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
    }
  } catch {}
  try {
    const dir = (dowAdjusted - 50) / 50;
    const sentiment = signals.find((s) => s.name.toLowerCase().includes("sentiment"))?.value ?? 0;
    const m = counterfactualMultiplierBBBBB("sentiment", sentiment, 0, dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {}
  try {
    const activeTiers = signals.slice(0, 12).map((s) => s.name);
    const m = stackMultiplierCCCCC(regime ?? "default", activeTiers);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {}
  try {
    const dir = (dowAdjusted - 50) / 50;
    const preds: Record<string, number> = {};
    for (const s of signals.slice(0, 6)) preds[s.name] = s.value;
    const m = bmaMultiplierDDDDD(preds, dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {}

  // ── Tier EEEEE–PPPPP — Deep temporal, microstructure 2.0, self-improving. ─
  try {
    const dir = (dowAdjusted - 50) / 50;
    const ind = ctx.indicators as Indicators & { rsi14?: number; macd?: number; sma50?: number };
    const shortNow = (ind.rsi14 ?? 50) - 50;
    const mediumNow = ind.macd ?? 0;
    const longNow = ((ctx.indicators as { sma50?: number; sma200?: number }).sma50 ?? 0) -
                    ((ctx.indicators as { sma50?: number; sma200?: number }).sma200 ?? 0);
    const m = tftMultiplierEEEEE(ctx.symbol, shortNow, mediumNow, longNow, 0, dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {}
  try {
    const dir = (dowAdjusted - 50) / 50;
    const now = Math.floor(Date.now() / 1000);
    recordHawkesEventFFFFF(ctx.symbol, now);
    const m = hawkesMultiplierFFFFF(ctx.symbol, now, dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {}
  try {
    const dir = (dowAdjusted - 50) / 50;
    const series = (ctx.candles ?? []).slice(-64).map((c) => c.close);
    const m = wavenetMultiplierGGGGG(series, dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {}
  try {
    const dir = (dowAdjusted - 50) / 50;
    const series = (ctx.candles ?? []).slice(-60).map((c) => c.close);
    const m = nbeatsMultiplierHHHHH(series, dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {}
  try {
    const m = quoteStuffingMultiplierIIIII(ctx.symbol);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {}
  try {
    const dir = (dowAdjusted - 50) / 50;
    const m = spoofingMultiplierJJJJJ(ctx.symbol, dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {}
  try {
    const dir = (dowAdjusted - 50) / 50;
    const m = tradeSizeMultiplierKKKKK(ctx.symbol, dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {}
  try {
    const m = effectiveSpreadMultiplierLLLLL(ctx.symbol);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {}
  try {
    const active = signals.slice(0, 8).map((s) => s.name);
    const m = nasMultiplierMMMMM(ctx.symbol, active);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {}
  try {
    const m = checkpointReplayMultiplierNNNNN();
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {}
  try {
    const dir = (dowAdjusted - 50) / 50;
    const ind = ctx.indicators as Indicators & { volume?: number; atr14?: number };
    const m = multiTaskMultiplierOOOOO(dir, ind.volume ?? 0, ind.atr14 ?? 0, dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {}
  try {
    const m = selfPlayMultiplierPPPPP(regime ?? "default");
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {}

  // ── Tier QQQQQ–BBBBBB — Information theory, behavioral, hardening. ─────
  try {
    const feats = signals.slice(0, 8).map((s) => s.name);
    const m = miMultiplierQQQQQ(feats);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {}
  try {
    const dir = (dowAdjusted - 50) / 50;
    const m = transferEntropyMultiplierRRRRR("MARKET", ctx.symbol, dir, dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {}
  try {
    const series = (ctx.candles ?? []).slice(-60).map((c) => c.close);
    const m = snrMultiplierSSSSS(series);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {}
  try {
    const series = (ctx.candles ?? []).slice(-60).map((c) => c.close);
    const m = complexityMultiplierTTTTT(series);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {}
  try {
    const dir = (dowAdjusted - 50) / 50;
    const recentRets = (ctx.candles ?? []).slice(-10).map((c, i, arr) =>
      i === 0 ? 0 : ((c.close - arr[i - 1].close) / arr[i - 1].close) * 100,
    );
    const m = prospectMultiplierUUUUU(recentRets, dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {}
  try {
    const m = herdingMultiplierVVVVV();
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {}
  try {
    const dir = (dowAdjusted - 50) / 50;
    const ind = ctx.indicators as Indicators & { high52w?: number; low52w?: number; price?: number };
    if (ind.high52w && ind.low52w && ind.price) {
      const m = anchoringMultiplierWWWWW(ind.price, ind.high52w, ind.low52w, dir);
      if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
    }
  } catch {}
  try {
    const dir = (dowAdjusted - 50) / 50;
    const m = dispositionMultiplierXXXXX(ctx.symbol, dir);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {}
  try {
    const m = shadowMultiplierYYYYY();
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {}
  try {
    const candles = ctx.candles ?? [];
    if (candles.length > 0) {
      const last = candles[candles.length - 1] as { time?: number; t?: number };
      const ts = (last.time ?? last.t ?? 0) * 1000;
      if (ts > 0) {
        const m = latencyMultiplierZZZZZ(ts);
        if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
      }
    }
  } catch {}
  try {
    const m = circuitBreakerMultiplierAAAAAA();
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {}
  try {
    const m = plattMultiplierBBBBBB(dowAdjusted);
    if (m !== 1) dowAdjusted = Math.max(0, Math.min(100, 50 + (dowAdjusted - 50) * m));
  } catch {}

  // ── Tier CCCCCC–RRRRRR (Bayesian/Stacked/CV/microstructure/training/trust) ──
  try {
    const models = res.contributions.slice(0, 8).map((c) => c.name);
    const m = bmaMultiplierCCCCCC(models);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const feats = res.contributions.slice(0, 6).map((c) => c.contribution / Math.max(0.01, c.weight));
    while (feats.length < 6) feats.push(0);
    const m = stackedMultiplierDDDDDD(feats);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const dir = (dowAdjusted - 50) / 50;
    const m = quantileMultiplierEEEEEE(ctx.symbol, dir);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const m = leakageMultiplierFFFFFF();
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const m = toxicityMultiplierGGGGGG(ctx.symbol);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const dir = (dowAdjusted - 50) / 50;
    const m = leadLagMultiplierHHHHHH("MARKET", ctx.symbol, ctx.indexTrendPct ?? 0, dir);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const m = dccMultiplierIIIIII();
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const candles = ctx.candles ?? [];
    if (candles.length > 20) {
      const returns: number[] = [];
      for (let i = 1; i < candles.length; i++) {
        const a = candles[i - 1] as { close?: number; c?: number };
        const b = candles[i] as { close?: number; c?: number };
        const pa = a.close ?? a.c ?? 0, pb = b.close ?? b.c ?? 0;
        if (pa > 0) returns.push((pb - pa) / pa);
      }
      const m = tsrvMultiplierJJJJJJ(returns);
      if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
    }
  } catch {}
  try {
    const m = activeLearningMultiplierKKKKKK(ctx.symbol);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const w: Record<string, number> = {};
    for (const c of res.contributions) w[c.name] = c.weight;
    const m = ewcMultiplierLLLLLL(w);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const m = smoteMultiplierMMMMMM();
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const vol = (ctx.indicators as { atr14?: number }).atr14 ?? 0.02;
    const m = curriculumMultiplierNNNNNN(vol);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const m = pboMultiplierOOOOOO();
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const observed = (dowAdjusted - 50) / 25;
    const m = deflatedSharpeMultiplierPPPPPP(observed);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const m = divergenceMultiplierQQQQQQ();
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const m = shapDriftMultiplierRRRRRR();
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const width = conformal ? (conformal.upper - conformal.lower) : interval.halfWidth * 2;
    queueUncertainKKKKKK(ctx.symbol, dowAdjusted, width);
  } catch {}

  // ── Tier SSSSSS–HHHHHHH (Next-gen accuracy, causal, training, ops) ──────────
  try {
    const m = conformalMultiplierSSSSSS(ctx.symbol);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const dir = (dowAdjusted - 50) / 50;
    const m = shrinkageMultiplierTTTTTT(ctx.symbol, dir);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const candles = ctx.candles ?? [];
    if (candles.length > 8) {
      const closes = candles.map((c) => (c as { close?: number; c?: number }).close ?? (c as { c?: number }).c ?? 0).filter((x) => x > 0);
      const m = gpMultiplierUUUUUU(closes);
      if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
    }
  } catch {}
  try {
    const m = moeMultiplierVVVVVV(regime);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const m = causalMultiplierWWWWWW("MARKET", ctx.symbol);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const feats = res.contributions.slice(0, 8).map((c) => c.contribution);
    const m = counterfactualMultiplierXXXXXX(feats);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const m = hawkesMultiplierYYYYYY(ctx.symbol);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const candles = ctx.candles ?? [];
    if (candles.length >= 8) {
      const closes = candles.map((c) => (c as { close?: number; c?: number }).close ?? (c as { c?: number }).c ?? 0).filter((x) => x > 0);
      const m = waveletMultiplierZZZZZZ(closes);
      if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
    }
  } catch {}
  try {
    const m = mamlMultiplierAAAAAAA(ctx.symbol);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const action = dowAdjusted > 55 ? "buy" : dowAdjusted < 45 ? "sell" : "hold";
    const m = ppoMultiplierBBBBBBB(action);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const feats = res.contributions.slice(0, 8).map((c) => c.contribution / Math.max(0.01, c.weight));
    const m = ts2vecMultiplierCCCCCCC(ctx.symbol, feats);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const m = adversarialMultiplierDDDDDDD();
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const m = ftrlMultiplierEEEEEEE();
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const m = banditMultiplierFFFFFFF(regime);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const m = cfrMultiplierGGGGGGG(regime);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const m = distillationMultiplierHHHHHHH();
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}

  // ── Tier IIIIIII–XXXXXXX (Frontier accuracy, microstructure 2.0, strategic) ──
  try {
    const candles = ctx.candles ?? [];
    const closes = candles.map((c) => (c as { close?: number; c?: number }).close ?? (c as { c?: number }).c ?? 0).filter((x) => x > 0);
    if (closes.length >= 6) {
      const m = neuralOdeMultiplierIIIIIII(closes);
      if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
    }
    if (closes.length >= 16) {
      const m = tftMultiplierJJJJJJJ(closes);
      if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
    }
    if (closes.length >= 20) {
      const m = diffusionMultiplierKKKKKKK(closes);
      if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
    }
    if (closes.length > 0) {
      kalmanUpdateLLLLLLL(ctx.symbol, closes[closes.length - 1]);
    }
  } catch {}
  try {
    const m = kalmanMultiplierLLLLLLL(ctx.symbol);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const dir = (dowAdjusted - 50) / 50;
    const m = depthMultiplierMMMMMMM(ctx.symbol, dir);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const m = kyleMultiplierNNNNNNN(ctx.symbol);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const m = contagionMultiplierOOOOOOO(ctx.symbol);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    recordRegimePPPPPPP(ctx.symbol, regime);
    const m = hmmMultiplierPPPPPPP(ctx.symbol);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const m = federatedMultiplierQQQQQQQ(dowAdjusted);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
    recordFederatedVoteQQQQQQQ(dowAdjusted);
  } catch {}
  try {
    const m = nasMultiplierRRRRRRR();
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const feats = res.contributions.slice(0, 6).map((c) => c.contribution);
    const m = cpcMultiplierSSSSSSS(ctx.symbol, feats);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const m = samMultiplierTTTTTTT();
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const m = gameTheoryMultiplierUUUUUUU();
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const featNames = res.contributions.slice(0, 8).map((c) => c.name);
    const m = causalDiscoveryMultiplierVVVVVVV(featNames);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const activeCount = res.contributions.length;
    const predScore = Math.abs(dowAdjusted - 50) / 50;
    const m = infoBottleneckMultiplierWWWWWWW(activeCount, predScore);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const m = explainabilityMultiplierXXXXXXX();
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}

  // ── Tier YYYYYYY–NNNNNNNN (Frontier accuracy v2, microstructure 3.0, robustness) ──
  try {
    const candles = ctx.candles ?? [];
    const closes = candles.map((c) => (c as { close?: number; c?: number }).close ?? (c as { c?: number }).c ?? 0).filter((x) => x > 0);
    if (closes.length >= 20) {
      const m = quantileRegressionMultiplierYYYYYYY(closes);
      if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
    }
    if (closes.length >= 24) {
      const m = nbeatsMultiplierZZZZZZZ(closes);
      if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
    }
    if (closes.length > 1) {
      const lastRet = (closes[closes.length - 1] - closes[closes.length - 2]) / (closes[closes.length - 2] || 1);
      updateReservoirAAAAAAAA(ctx.symbol, lastRet);
    }
    const m1 = echoStateMultiplierAAAAAAAA(ctx.symbol);
    if (m1 !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m1, 0, 100);
    if (closes.length >= 30) {
      const m = tdaMultiplierBBBBBBBB(closes);
      if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
    }
  } catch {}
  try {
    const dir = (dowAdjusted - 50) / 50;
    const m = lobDynamicsMultiplierCCCCCCCC(ctx.symbol, dir);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const candles = ctx.candles ?? [];
    const closes = candles.map((c) => (c as { close?: number; c?: number }).close ?? (c as { c?: number }).c ?? 0).filter((x) => x > 0);
    if (closes.length >= 20) {
      const m = jumpDetectionMultiplierDDDDDDDD(closes);
      if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
    }
    if (closes.length >= 20) {
      const m = realizedKernelMultiplierEEEEEEEE(closes);
      if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
    }
  } catch {}
  try {
    const m = centralityMultiplierFFFFFFFF(ctx.symbol);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const sector = (ctx as { sector?: string }).sector ?? "default";
    const m = loraMultiplierGGGGGGGG(sector);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const complexity = Math.min(1, res.contributions.length / 20);
    recordCurriculumHHHHHHHH(complexity);
    const m = curriculumMultiplierHHHHHHHH(complexity);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const m = mixupMultiplierIIIIIIII();
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const m = lookaheadMultiplierJJJJJJJJ();
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const candles = ctx.candles ?? [];
    const closes = candles.map((c) => (c as { close?: number; c?: number }).close ?? (c as { c?: number }).c ?? 0).filter((x) => x > 0);
    const m = adversarialRobustnessMultiplierKKKKKKKK(closes, dowAdjusted);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const m = isotonicCalibrationMultiplierLLLLLLLL(dowAdjusted);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const feats = res.contributions.slice(0, 6).map((c) => c.contribution);
    const m = mahalanobisOODMultiplierMMMMMMMM(feats);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const concepts: Record<string, number> = {};
    for (const c of res.contributions.slice(0, 5)) {
      const name = c.name.toLowerCase();
      if (name.includes("trend")) concepts.trend = c.contribution;
      else if (name.includes("momentum") || name.includes("rsi")) concepts.momentum = c.contribution;
      else if (name.includes("vol")) concepts.volatility = c.contribution;
      else if (name.includes("volume") || name.includes("liquid")) concepts.liquidity = c.contribution;
      else if (name.includes("sentiment") || name.includes("news")) concepts.sentiment = c.contribution;
    }
    const m = conceptBottleneckMultiplierNNNNNNNN(concepts);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}

  // ── Tier OOOOOOOO–DDDDDDDDD (Ultra accuracy, deep market, governance v2) ──
  try {
    const m = conformalPredictionMultiplierOOOOOOOO();
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const candles = ctx.candles ?? [];
    const closes = candles.map((c) => (c as { close?: number; c?: number }).close ?? (c as { c?: number }).c ?? 0).filter((x) => x > 0);
    if (closes.length >= 30) {
      const m = mixtureDensityMultiplierPPPPPPPP(closes);
      if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
    }
    if (closes.length >= 20) {
      const m = deepGaussianProcessMultiplierQQQQQQQQ(closes);
      if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
    }
    if (closes.length >= 16) {
      const m = spectralResidualMultiplierRRRRRRRR(closes);
      if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
    }
    if (closes.length >= 32) {
      const m = roughVolatilityMultiplierTTTTTTTT(closes);
      if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
    }
    if (closes.length >= 20) {
      const m = bootstrapIntervalMultiplierBBBBBBBBB(closes);
      if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
    }
    if (closes.length >= 10) {
      const m = counterfactualMultiplierAAAAAAAAA(closes, dowAdjusted);
      if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
    }
    const avgVol = (ctx as { avgVolume?: number }).avgVolume ?? 100000;
    if (closes.length >= 20) {
      const m = liquidityVaRMultiplierVVVVVVVV(closes, avgVol);
      if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
    }
  } catch {}
  try {
    const m = hawkesProcessMultiplierSSSSSSSS(ctx.symbol);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const m = crossSectionalMomentumMultiplierUUUUUUUU(ctx.symbol);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const m = distillationMultiplierWWWWWWWW();
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const m = ewcMultiplierXXXXXXXX();
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    recordSnapshotYYYYYYYY(dowAdjusted);
    const m = selfDistillationMultiplierYYYYYYYY();
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const m = swaMultiplierZZZZZZZZ();
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const m = modelCardMultiplierCCCCCCCCC();
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const m = shapleyMultiplierDDDDDDDDD(res.contributions);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  // Record an event for Hawkes if signal is decisive.
  try {
    if (Math.abs(dowAdjusted - 50) > 20) recordHawkesEventSSSSSSSS(ctx.symbol);
  } catch {}

  // ── Tier FRONTIER-V3 (BMA · Conformal-quality · CFR · Regime-Activation ·
  //                     FastDistill · ActiveLearning · Adversarial · GraphKT) ──
  try {
    const sources: Record<string, number> = {};
    for (const s of signals.slice(0, 12)) {
      if (Number.isFinite(s.value)) sources[s.name] = clamp(50 + s.value * 25, 0, 100);
    }
    const m = bayesianModelAveragingMultiplier(sources);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
    const m2 = distillationFastMultiplier(sources);
    if (m2 !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m2, 0, 100);
  } catch {}
  try {
    const m = conformalQualityMultiplier();
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const m = counterfactualReplayMultiplier(dowAdjusted);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const m = regimeAwareActivationMultiplier(regime);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const m = activeLearningUncertaintyMultiplier(dowAdjusted);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const m = adversarialStressMultiplier();
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const sector = (ctx as { sector?: string }).sector;
    const m = graphKnowledgeTransferMultiplier(sector);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}

  // ── Tier MASTER-IQ (11 advanced layers) ──────────────────────────────
  try {
    const m = metaLabelTripleBarrierMultiplier(dowAdjusted);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const m = purgedCVReliabilityMultiplier();
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const active = signals.slice(0, 12).map((s) => s.name);
    const m = featureImportanceDriftMultiplier(active);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const m = isotonicEnsembleCalibMultiplier(dowAdjusted);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const sector = (ctx as { sector?: string }).sector;
    const cluster = `${sector ?? "unknown"}:${regime}`;
    const m = hrpClusterRiskMultiplier(cluster);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const m = llmJudgeContradictionMultiplier({ signal: ctx.signal, regime, confidence: dowAdjusted });
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const active = signals.slice(0, 12).map((s) => s.name);
    const m = causalDiscoveryMultiplier(active);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const m = rlPositionSizingMultiplier(regime, dowAdjusted);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const m = shadowABNewLayerMultiplier();
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    void confidenceDecompositionMultiplier();
    const contributions: Record<string, number> = {};
    for (const s of signals.slice(0, 12)) contributions[s.name] = s.value;
    recordConfidenceDecomposition(ctx.symbol, contributions);
  } catch {}
  try {
    const sector = (ctx as { sector?: string }).sector;
    const m = federatedSectorOutcomeMultiplier(sector);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}

  // ── Tier APEX-IQ (16 advanced layers) ────────────────────────────────
  try { recordHMMRegime(regime); } catch {}
  try {
    const m = onlineGradientBoostingMultiplier(regime, dowAdjusted);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const m = kellyCriterionMultiplier();
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const ofi = (ctx as { ofi?: number }).ofi;
    const m = microstructureOFIMultiplier(ofi);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const m = walkForwardOptThresholdMultiplier(dowAdjusted);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const m = hmmRegimeMultiplier(regime);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const m = changePointCUSUMMultiplier();
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const sector = (ctx as { sector?: string }).sector;
    const m = cointegrationPairsMultiplier(sector);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const m = garchVolatilityMultiplier();
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const m = newsSentimentSentinelMultiplier(ctx.symbol, ctx.signal);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const m = drawdownCircuitBreakerMultiplier();
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const hour = new Date().getUTCHours();
    const m = timeOfDayBucketMultiplier(hour);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const m = tradeQualityScoreMultiplier(ctx.signal);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const m = adwinDriftDetectorMultiplier();
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const m = transformerSequenceMultiplier();
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const arm = `${(ctx as { sector?: string }).sector ?? "unk"}:${regime}`;
    const m = thompsonSamplingBanditMultiplier(arm);
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}
  try {
    const m = syntheticBootstrapAugmentMultiplier();
    if (m !== 1) dowAdjusted = clamp(50 + (dowAdjusted - 50) * m, 0, 100);
  } catch {}

  // V2.12 Active learning — flag uncertain candidates for follow-up labelling.
  try {
    const width = conformal ? (conformal.upper - conformal.lower) : interval.halfWidth * 2;
    maybeQueueForLabel(ctx.symbol, calibrated, width);
  } catch {}

  // 11b) RL action suggestion (advisory only — does NOT change confidence).
  let rlAction: string | undefined;
  try { rlAction = suggestAction(regime, calibrated); } catch {}

  // 12) A/B shadow: log a candidate without regime weights, for comparison.
  try {
    const shadowWeights = mergeWeights(mergeWeights(weights, learnedW), symbolW);
    const shadowRes = integrateSignals(ctx.baseConfidence, signals, shadowWeights, 0.30);
    recordShadow(ctx.symbol, dowAdjusted, shadowRes.adjustedConfidence);
  } catch {}

  // 13) Auto-build risk plan when actionable.
  let riskPlan: RiskPlan | undefined;
  if (ctx.signal === "buy" || ctx.signal === "strong_buy") {
    riskPlan = buildRiskPlan(ctx.indicators, 1, dowAdjusted);
  } else if (ctx.signal === "sell") {
    riskPlan = buildRiskPlan(ctx.indicators, -1, dowAdjusted);
  }
  // Attach Kelly fraction (quarter-Kelly) when we have one.
  if (riskPlan && kellyFrac > 0) {
    (riskPlan as RiskPlan & { kellyFraction?: number }).kellyFraction = kellyFrac;
  }

  // ── audit/decision-provenance — log every decision for traceability ────
  try {
    provenanceLog.push(
      buildRecord({
        symbol: ctx.symbol,
        action: (ctx.signal === "buy" || ctx.signal === "strong_buy") ? "buy"
              : ctx.signal === "sell" ? "sell" : "hold",
        baseConfidence: ctx.baseConfidence,
        adjustedConfidence: dowAdjusted,
        features: {
          regime_code: regime === "trending_up" ? 1 : regime === "trending_down" ? -1
            : regime === "high_vol" ? 2 : regime === "mean_reverting" ? 0.5 : 0,
          diversity: div.agreement,
          stability: rob.stability,
        },
        contributingModules: res.contributions.map((c) => ({
          name: c.name,
          weight: c.weight,
          signal: c.weight > 0 ? c.contribution / c.weight : 0,
        })),
        rationale: res.contributions.slice(0, 3).map((c) => `${c.name}:${c.contribution.toFixed(2)}`).join(" | "),
        modelVersion: "auto-orchestrator-v2",
      }),
    );
    // Cap log size so it doesn't grow unbounded.
    if (provenanceLog.length > 5000) provenanceLog.splice(0, provenanceLog.length - 2500);
  } catch {}

  return {
    adjustedConfidence: dowAdjusted,
    rawConfidence: finalRaw,
    signals,
    contributions: res.contributions,
    regime,
    diversity: div.agreement,
    stability: rob.stability,
    interval: { lower: interval.lower, upper: interval.upper, halfWidth: interval.halfWidth },
    riskPlan,
    flags: {
      drift: psi,
      earningsInDays: earningsDays,
      multiTimeframeAgree: mtf.agree,
      clusterPenalty: cp,
      llmVerdict: [llmVerdict, rlAction && `rl:${rlAction}`, hmm && `hmm:${hmm}`]
        .filter(Boolean).join("|") || undefined,
      // H.7 SHAP-lite top contributors (stringified for log).
      ...(signals.length > 0
        ? { shap: shapAttribution(signals.map((s) => ({ name: s.name, value: s.value }))).map((x) => `${x.name}:${x.contribution.toFixed(2)}`).join(",") }
        : {}),
      ...(isCircuitOpen() ? { circuitBreaker: "open" } : {}),
    },
  };
}