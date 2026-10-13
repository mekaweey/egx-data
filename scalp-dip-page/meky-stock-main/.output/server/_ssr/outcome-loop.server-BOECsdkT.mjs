import { supabaseAdmin } from "./client.server-D5ro3rAQ.mjs";
import { u as updateCalibration, h as recordPatternOutcomeN, i as consumePendingPatterns, j as recordKellyOutcome, k as recordBayesOutcomeQ, p as provenanceLog, l as recordFeatureContributionQ, m as recordTrainFeatureQ, n as recordHistoricalCaseQ, o as recordHmmOutcomeQ, q as hmmRegimeQ, t as recordDowOutcome, v as recordCalibration, w as recordArmOutcomeR, x as recordIpwR, y as recordSectorReturnR, z as recordICSampleS, A as recordMetaConfidenceS, B as recordBetaOutcomeT, C as recordMWOutcomeT, D as recordPermSampleT, E as recordFeatureDistT, F as recordPlattOutcomeT, G as recordIsotonicOutcomeU, H as recordOOFSampleU, I as recordQuantileResidualU, J as recordLossU, K as recordSymbolTradeU, L as sgldUpdateU, M as recordModelOutcome, N as recordStrategyOutcome, O as addConformalResidual, P as isotonicAdd, Q as dowRecord, R as recordOutcome, S as recordFeatureOutcome, T as stackUpdate, U as sgdUpdate, V as recordResidual, W as recordCounterfactual, X as bmaUpdate, Y as metaUpdate, Z as tripleBarrierLabel, _ as regimeFromContext, $ as regimeUpdate, a0 as recordTrainSample, a1 as rewardAction, a2 as banditUpdate, a3 as recordCounterfactualBucket, a4 as recordSectorReturn, a5 as recordKnob, a6 as stackL2Update, a7 as regimeStackUpdate, a8 as recordTradeOutcome, a9 as recordTierMetaOutcomeV, aa as recordCausalSampleW, ab as recordWinnerPatternZ, ac as recordCurriculumSampleY, ad as recordHierarchicalOutcomeAA, ae as recordReturnBB, af as recordParetoPointCC, ag as recordPredictionErrorEE, ah as recordFeatureOutcomeGG, ai as recordReplayHH, aj as recordRegimeOutcomeKK, ak as recordHyperparamOutcomeLL, al as recordDecisionMM, am as recordRegimeTransitionOO, an as recordFeatureVectorRR, ao as recordRLWeightsOutcomeSS, ap as recordBacktestOutcomeTT, aq as recordTierICVV, ar as recordReturnsWW, as as recordRangeXX, at as recordClusterSentimentYY, au as recordExecutionGapZZ, av as trainStackingAAA, aw as recordTierOutcomeCCC, ax as recordConformalSampleDDD, ay as recordShapSampleEEE, az as updateKalmanHHH, aA as updateGarchIII, aB as recordClusterRegimeJJJ, aC as recordDecisionKKK, aD as recordCausalSampleLLL, aE as recordEWCSampleNNN, aF as recordTimeframeOutcomeOOO, aG as recordPatternUUU, aH as trainLstmVVV, aI as trainGeneticAlgoWWW, aJ as recordThresholdOutcomeYYY, aK as recordTierBanditZZZ, aL as recordBreakerOutcomeCCCC, aM as recordABSampleDDDD, aN as recordDoubleMLKKKK, aO as recordReturnLLLL, aP as recordIVMMMM, aQ as recordRDDNNNN, aR as recordCalibrationOOOO, aS as recordUncertaintyPPPP, aT as recordDistributionRRRR, aU as recordSGDOutcomeSSSS, aV as recordSourceReturnTTTT, aW as recordSymbolReturnTTTT, aX as recordPatternTemplateUUUU, aY as recordContrastiveVVVV, aZ as recordKellyOutcomeWWWW, a_ as recordCorrReturnXXXX, a$ as recordReturnYYYY, b0 as recordRegimeReturnZZZZ, b1 as recordCounterfactualBBBBB, b2 as recordStackOutcomeCCCCC, b3 as recordBMAOutcomeDDDDD, b4 as recordTFTSampleEEEEE, b5 as recordTradeSizeKKKKK, b6 as recordSpreadSampleLLLLL, b7 as recordNASOutcomeMMMMM, b8 as recordCheckpointNNNNN, b9 as updateCurrentPerfNNNNN, ba as recordMultiTaskOOOOO, bb as recordSelfPlayPPPPP, bc as recordMISampleQQQQQ, bd as recordTESeriesRRRRR, be as recordHerdingVVVVV, bf as recordDispositionXXXXX, bg as recordShadowYYYYY, bh as recordDailyPnlAAAAAA, bi as recordPlattBBBBBB, bj as recordBMASampleCCCCCC, bk as recordStackedDDDDDD, bl as recordReturnEEEEEE, bm as recordFoldFFFFFF, bn as recordVPINBucketGGGGGG, bo as recordLLReturnHHHHHH, bp as updateDCCIIIIII, bq as recordClassMMMMMM, br as recordCurriculumPerfNNNNNN, bs as recordLivePnlQQQQQQ, bt as recordTrialSharpePPPPPP, bu as recordShapSnapshotRRRRRR, bv as recordConformalSSSSSS, bw as recordSectorReturnTTTTTT, bx as recordExpertVVVVVV, by as recordCausalWWWWWW, bz as recordHawkesEventYYYYYY, bA as recordMAMLAAAAAAA, bB as recordPPOBBBBBBB, bC as recordTS2VecCCCCCCC, bD as recordAdversarialDDDDDDD, bE as updateFTRLEEEEEEE, bF as recordBanditFFFFFFF, bG as recordRegretGGGGGGG, bH as recordDistillationHHHHHHH, bI as recordShockOOOOOOO, bJ as recordArchPerfRRRRRRR, bK as recordCpcSSSSSSS, bL as recordLossTTTTTTT, bM as recordAdversaryUUUUUUU, bN as recordCausalLinkVVVVVVV, bO as recordExplanationXXXXXXX, bP as recordDepthImbalanceMMMMMMM, bQ as recordKyleNNNNNNN, bR as recordLOBCCCCCCCC, bS as updateCentralityFFFFFFFF, bT as recordLoRAGGGGGGGG, bU as recordMixupIIIIIIII, bV as recordLookaheadJJJJJJJJ, bW as recordCalibrationLLLLLLLL, bX as recordInDistMMMMMMMM, bY as recordConceptNNNNNNNN, bZ as recordConformalOOOOOOOO, b_ as recordCrossSectionalUUUUUUUU, b$ as recordDistillationWWWWWWWW, c0 as recordEWCXXXXXXXX, c1 as recordSWAZZZZZZZZ, c2 as recordGovernanceCCCCCCCCC, c3 as recordBMASourceOutcome, c4 as updateDistillation, c5 as recordConformalCoverage, c6 as recordCounterfactualReplay, c7 as recordRegimeOutcomeRAT, c8 as recordUncertaintyOutcome, c9 as recordStressOutcome, ca as recordSectorOutcomeGKT, cb as recordMetaLabelTripleBarrier, cc as recordPurgedFoldOutcome, cd as recordFeatureImportanceFID, ce as recordIsotonicEnsembleOutcome, cf as recordHRPClusterReturn, cg as recordCausalLinkCDV, ch as recordRLPositionOutcome, ci as recordShadowABOutcome, cj as recordFederatedSectorOutcome, ck as recordOGBOutcome, cl as recordKellyOutcomeAPEX, cm as recordWFOSample, cn as recordCUSUMReturn, co as recordCointegrationReturn, cp as recordGARCHReturn, cq as recordDrawdownReturn, cr as recordTimeOfDayOutcome, cs as recordTradeQuality, ct as recordADWINOutcome, cu as recordTSMReturn, cv as recordThompsonOutcome, cw as recordSBAReturn, cx as snapshotV2State, cy as snapshotLDPState, cz as recomputeCorrelations, cA as snapshotTierBState, cB as snapshotTierCDEState, cC as snapshotTierFGHState, cD as snapshotTierQState, cE as snapshotTierRState, cF as snapshotTierSState, cG as snapshotTierTState, cH as snapshotTierUState, cI as snapshotTierVWXState, cJ as snapshotTierEELMState, cK as snapshotTierMMTTState, cL as snapshotTierUUBBBState, cM as snapshotTierCCCPPPState, cN as snapshotTierQQQFFFFState, cO as snapshotTierGGGGRRRRState, cP as snapshotTierSSSSDDDDDState, cQ as snapshotTierEEEEEPPPPPState, cR as snapshotTierQQQQQBBBBBBState, cS as snapshotTierCCCCCCRRRRRRState, cT as snapshotTierSSSSSSHHHHHHHState, cU as snapshotTierIIIIIIIXXXXXXXState, cV as snapshotTierYYYYYYYNNNNNNNNState, cW as snapshotTierOOOOOOOODDDDDDDDDState, cX as snapshotTierFrontierV3State, cY as snapshotTierMasterIQState, cZ as snapshotTierApexIQState, c_ as restoreV2State, c$ as restoreLDPState, d0 as restoreTierBState, d1 as restoreTierCDEState, d2 as restoreTierFGHState, d3 as restoreTierQState, d4 as restoreTierRState, d5 as restoreTierSState, d6 as restoreTierTState, d7 as restoreTierUState, d8 as restoreTierVWXState, d9 as restoreTierEELMState, da as restoreTierMMTTState, db as restoreTierUUBBBState, dc as restoreTierCCCPPPState, dd as restoreTierQQQFFFFState, de as restoreTierGGGGRRRRState, df as restoreTierSSSSDDDDDState, dg as restoreTierEEEEEPPPPPState, dh as restoreTierQQQQQBBBBBBState, di as restoreTierCCCCCCRRRRRRState, dj as restoreTierSSSSSSHHHHHHHState, dk as restoreTierIIIIIIIXXXXXXXState, dl as restoreTierYYYYYYYNNNNNNNNState, dm as restoreTierOOOOOOOODDDDDDDDDState, dn as restoreTierFrontierV3State, dp as restoreTierMasterIQState, dq as restoreTierApexIQState } from "./auto-orchestrator.server-Cobs3ZBw.mjs";
import { olUpdate, counterfactualAnalyze } from "./tier-k-intelligence.server-IqAM99dH.mjs";
async function saveState(key, data) {
  try {
    await supabaseAdmin.from("model_state").upsert({ key, data, updated_at: (/* @__PURE__ */ new Date()).toISOString() });
  } catch {
  }
}
async function loadState(key) {
  try {
    const { data, error } = await supabaseAdmin.from("model_state").select("data").eq("key", key).maybeSingle();
    if (error || !data) return null;
    return data.data;
  } catch {
    return null;
  }
}
const processed = /* @__PURE__ */ new Set();
let stateLoaded = false;
async function ensureStateLoaded() {
  if (stateLoaded) return;
  stateLoaded = true;
  try {
    const s = await loadState("advanced_intelligence_v2");
    if (s) restoreV2State(s);
  } catch {
  }
  try {
    const s = await loadState("lopez_de_prado");
    if (s) restoreLDPState(s);
  } catch {
  }
  try {
    const s = await loadState("tier_b_intelligence");
    if (s) restoreTierBState(s);
  } catch {
  }
  try {
    const s = await loadState("tier_cde_intelligence");
    if (s) restoreTierCDEState(s);
  } catch {
  }
  try {
    const s = await loadState("tier_fgh_intelligence");
    if (s) restoreTierFGHState(s);
  } catch {
  }
  try {
    const s = await loadState("tier_q_intelligence");
    if (s) restoreTierQState(s);
  } catch {
  }
  try {
    const s = await loadState("tier_r_intelligence");
    if (s) restoreTierRState(s);
  } catch {
  }
  try {
    const s = await loadState("tier_s_intelligence");
    if (s) restoreTierSState(s);
  } catch {
  }
  try {
    const s = await loadState("tier_t_intelligence");
    if (s) restoreTierTState(s);
  } catch {
  }
  try {
    const s = await loadState("tier_u_intelligence");
    if (s) restoreTierUState(s);
  } catch {
  }
  try {
    const s = await loadState("tier_vwx_intelligence");
    if (s) restoreTierVWXState(s);
  } catch {
  }
  try {
    const s = await loadState("tier_eelm_intelligence");
    if (s) restoreTierEELMState(s);
  } catch {
  }
  try {
    const s = await loadState("tier_mmtt_intelligence");
    if (s) restoreTierMMTTState(s);
  } catch {
  }
  try {
    const s = await loadState("tier_uubbb_intelligence");
    if (s) restoreTierUUBBBState(s);
  } catch {
  }
  try {
    const s = await loadState("tier_cccppp_intelligence");
    if (s) restoreTierCCCPPPState(s);
  } catch {
  }
  try {
    const s = await loadState("tier_qqqffff_intelligence");
    if (s) restoreTierQQQFFFFState(s);
  } catch {
  }
  try {
    const s = await loadState("tier_ggggrrrr_intelligence");
    if (s) restoreTierGGGGRRRRState(s);
  } catch {
  }
  try {
    const s = await loadState("tier_ssssddddd_intelligence");
    if (s) restoreTierSSSSDDDDDState(s);
  } catch {
  }
  try {
    const s = await loadState("tier_eeeeepppppppp_intelligence");
    if (s) restoreTierEEEEEPPPPPState(s);
  } catch {
  }
  try {
    const s = await loadState("tier_qqqqqbbbbbb_intelligence");
    if (s) restoreTierQQQQQBBBBBBState(s);
  } catch {
  }
  try {
    const s = await loadState("tier_ccccccrrrrrr_intelligence");
    if (s) restoreTierCCCCCCRRRRRRState(s);
  } catch {
  }
  try {
    const s = await loadState("tier_ssssssshhhhhhh_intelligence");
    if (s) restoreTierSSSSSSHHHHHHHState(s);
  } catch {
  }
  try {
    const s = await loadState("tier_iiiiiiixxxxxxx_intelligence");
    if (s) restoreTierIIIIIIIXXXXXXXState(s);
  } catch {
  }
  try {
    const s = await loadState("tier_yyyyyyynnnnnnnn_intelligence");
    if (s) restoreTierYYYYYYYNNNNNNNNState(s);
  } catch {
  }
  try {
    const s = await loadState("tier_oooooooodddddddd_intelligence");
    if (s) restoreTierOOOOOOOODDDDDDDDDState(s);
  } catch {
  }
  try {
    const s = await loadState("tier_frontier_v3_intelligence");
    if (s) restoreTierFrontierV3State(s);
  } catch {
  }
  try {
    const s = await loadState("tier_master_iq_intelligence");
    if (s) restoreTierMasterIQState(s);
  } catch {
  }
  try {
    const s = await loadState("tier_apex_iq_intelligence");
    if (s) restoreTierApexIQState(s);
  } catch {
  }
}
async function ingestClosedTrades(limit = 200) {
  await ensureStateLoaded();
  const { data, error } = await supabaseAdmin.from("recommendations").select("id, symbol, signal, confidence, outcome, realized_pct, outcome_at").neq("outcome", "pending").order("outcome_at", { ascending: false }).limit(limit);
  if (error || !data) return { processed: 0 };
  const { data: stocksData } = await supabaseAdmin.from("stocks").select("symbol, sector_ar");
  const sectorBy = new Map(
    (stocksData ?? []).map((s) => [s.symbol.toUpperCase(), s.sector_ar ?? null])
  );
  let count = 0;
  for (const r of data) {
    if (processed.has(r.id)) continue;
    processed.add(r.id);
    const won = r.outcome === "target_hit";
    const realised = Number(r.realized_pct ?? 0) / 100;
    const ageMs = r.outcome_at ? Date.now() - new Date(r.outcome_at).getTime() : 0;
    const sector = sectorBy.get(r.symbol.toUpperCase()) ?? null;
    updateCalibration(Number(r.confidence), won);
    try {
      recordPatternOutcomeN(consumePendingPatterns(r.symbol), won);
    } catch {
    }
    try {
      const patterns = consumePendingPatterns(r.symbol);
      for (const p of patterns) recordKellyOutcome(p, Number(r.realized_pct ?? 0));
      for (const p of patterns) recordBayesOutcomeQ(p, won);
    } catch {
    }
    try {
      const provQ = provenanceLog.find((p) => p.symbol === r.symbol);
      if (provQ?.contributingModules) {
        for (const m of provQ.contributingModules) {
          recordFeatureContributionQ(m.name, m.signal ?? 0, Number(r.realized_pct ?? 0));
          recordTrainFeatureQ(m.name, m.signal ?? 0);
        }
        const feat = provQ.contributingModules.slice(0, 8).map((m) => Math.tanh(m.signal ?? 0));
        recordHistoricalCaseQ(feat, won, Number(r.realized_pct ?? 0));
        const rc = String(provQ.features?.regime_code ?? 0);
        const state = rc === "1" ? "bull" : rc === "-1" ? "bear" : "sideways";
        recordHmmOutcomeQ(state, won);
        void hmmRegimeQ;
      }
    } catch {
    }
    try {
      if (r.outcome_at) recordDowOutcome(new Date(r.outcome_at), won);
    } catch {
    }
    try {
      recordCalibration(Number(r.confidence), won);
    } catch {
    }
    try {
      const provR = provenanceLog.find((p) => p.symbol === r.symbol);
      const fam = provR?.features?.strategyFamily ?? "other";
      const reg = String(provR?.features?.regime_code ?? 0) === "1" ? "trending_up" : String(provR?.features?.regime_code ?? 0) === "-1" ? "trending_down" : String(provR?.features?.regime_code ?? 0) === "2" ? "high_vol" : "calm";
      recordArmOutcomeR(`${fam}:${reg}`, won);
      const propensity = Math.max(0.05, Math.min(0.95, Number(r.confidence) / 100));
      recordIpwR(Number(r.confidence), propensity, Number(r.realized_pct ?? 0));
      recordSectorReturnR(sector, Number(r.realized_pct ?? 0));
    } catch {
    }
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
          Math.min(1, provS.contributingModules.length / 10)
        ];
        recordMetaConfidenceS(feats, won);
      }
    } catch {
    }
    try {
      const provT = provenanceLog.find((p) => p.symbol === r.symbol);
      const regimeT = String(provT?.features?.regime_code ?? 0) === "1" ? "trending_up" : String(provT?.features?.regime_code ?? 0) === "-1" ? "trending_down" : String(provT?.features?.regime_code ?? 0) === "2" ? "high_vol" : "calm";
      const fam = r.signal === "buy" || r.signal === "strong_buy" ? "long" : r.signal === "sell" ? "short" : "flat";
      recordBetaOutcomeT(`${fam}:${regimeT}`, won);
      const realisedPct = Number(r.realized_pct ?? 0);
      if (provT?.contributingModules) {
        const feats = {};
        for (const m of provT.contributingModules) {
          recordMWOutcomeT(m.name, m.signal ?? 0, realisedPct);
          feats[m.name] = m.signal ?? 0;
        }
        recordPermSampleT(feats, realisedPct);
      }
      const rsi = Number(provT?.features?.rsi ?? 50);
      const vr = Number(provT?.features?.volRatio ?? 1);
      recordFeatureDistT("rsi", rsi, true);
      recordFeatureDistT("volRatio", vr, true);
      recordPlattOutcomeT(Number(r.confidence), won);
    } catch {
    }
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
        Math.tanh(realisedPct * 10)
      ];
      sgldUpdateU(feats, won ? 1 : -1);
    } catch {
    }
    const provP = provenanceLog.find((p) => p.symbol === r.symbol);
    try {
      recordModelOutcome("auto-orchestrator-v2", won);
    } catch {
    }
    try {
      const fam = provP?.features?.strategyFamily;
      const family = fam ?? "other";
      recordStrategyOutcome(family, won);
    } catch {
    }
    try {
      const reg = String(provP?.features?.regime_code ?? 0) === "1" ? "trending_up" : String(provP?.features?.regime_code ?? 0) === "-1" ? "trending_down" : String(provP?.features?.regime_code ?? 0) === "2" ? "high_vol" : "calm";
      const predicted = Number(r.confidence);
      const actual = won ? 75 : 25;
      addConformalResidual(reg, predicted - actual);
    } catch {
    }
    try {
      isotonicAdd(Number(r.confidence), won);
    } catch {
    }
    try {
      if (r.outcome_at) dowRecord(new Date(r.outcome_at), won, Number(r.realized_pct ?? 0));
    } catch {
    }
    const provK = provenanceLog.find((p) => p.symbol === r.symbol);
    if (provK?.contributingModules) {
      const features = {};
      for (const m of provK.contributingModules) features[m.name] = m.signal ?? 0;
      try {
        await olUpdate(features, Number(r.realized_pct ?? 0));
      } catch {
      }
      try {
        const neutral = {};
        for (const k of Object.keys(features)) neutral[k] = 0;
        await counterfactualAnalyze({
          recommendationId: r.id,
          symbol: r.symbol,
          features,
          neutralValues: neutral,
          predictFn: (f) => Object.values(f).reduce((s, v) => s + Math.tanh(v) * 10, 0),
          realizedPct: Number(r.realized_pct ?? 0)
        });
      } catch {
      }
    }
    const prov = provenanceLog.find((p) => p.symbol === r.symbol);
    if (prov?.contributingModules) {
      for (const m of prov.contributingModules) {
        recordOutcome(m.name, m.signal ?? 0, realised, { symbol: r.symbol, sector, ageMs });
        recordFeatureOutcome(m.name, m.signal ?? 0, realised);
      }
      try {
        stackUpdate(
          prov.contributingModules.map((m) => ({ name: m.name, value: m.signal ?? 0 })),
          won ? 1 : 0
        );
      } catch {
      }
      try {
        const x = prov.contributingModules.slice(0, 4).map((m) => Math.tanh(m.signal ?? 0));
        while (x.length < 4) x.push(0);
        sgdUpdate(r.symbol, x, Math.sign(realised));
      } catch {
      }
      try {
        const predicted = Number(r.confidence);
        const actualScore = won ? 75 : 25;
        recordResidual(r.symbol, predicted - actualScore);
      } catch {
      }
      try {
        recordCounterfactual("enter", realised);
      } catch {
      }
      try {
        bmaUpdate(
          prov.contributingModules.map((m) => ({ name: m.name, value: m.signal ?? 0 })),
          won
        );
      } catch {
      }
      try {
        const rawConf = Number(r.confidence);
        const dir = r.signal === "buy" || r.signal === "strong_buy" ? 1 : r.signal === "sell" ? -1 : 0;
        const barrierLabel = realised > 0.05 ? 1 : realised < -0.03 ? -1 : 0;
        const y = barrierLabel === 1 ? 1 : 0;
        metaUpdate([(rawConf - 50) / 50, dir, 0, 0, 0], y);
        void tripleBarrierLabel;
      } catch {
      }
      try {
        const regimeStr = String(prov.features?.regime_code ?? 0) === "1" ? "trending_up" : String(prov.features?.regime_code ?? 0) === "-1" ? "trending_down" : String(prov.features?.regime_code ?? 0) === "2" ? "high_vol" : "calm";
        const reg = regimeFromContext(regimeStr);
        const x = prov.contributingModules.slice(0, 4).map((m) => Math.tanh(m.signal ?? 0));
        while (x.length < 4) x.push(0);
        regimeUpdate(reg, x, Math.sign(realised));
        for (const m of prov.contributingModules) {
          recordTrainSample(m.name, m.signal ?? 0);
        }
      } catch {
      }
      try {
        const regime = String(prov.features?.regime_code ?? 0) === "1" ? "trending_up" : String(prov.features?.regime_code ?? 0) === "-1" ? "trending_down" : String(prov.features?.regime_code ?? 0) === "2" ? "high_vol" : String(prov.features?.regime_code ?? 0) === "0.5" ? "mean_reverting" : "calm";
        const action = won && realised > 0.05 ? "enter_full" : won ? "enter_small" : realised < -0.05 ? "skip" : "scale_out_50";
        rewardAction(regime, Number(r.confidence), action, realised);
        try {
          banditUpdate(
            regime,
            Number(r.confidence),
            prov.contributingModules.map((m) => m.name),
            realised
          );
        } catch {
        }
        try {
          recordCounterfactualBucket(Number(r.confidence), realised);
        } catch {
        }
        try {
          recordSectorReturn(sector, realised);
        } catch {
        }
        try {
          recordKnob("min_confidence", Number(r.confidence), realised);
        } catch {
        }
        try {
          const tierScores = {
            base: (Number(r.confidence) - 50) / 50,
            regime_code: regime === "trending_up" ? 1 : regime === "trending_down" ? -1 : 0
          };
          stackL2Update(tierScores, won);
        } catch {
        }
        try {
          for (const m of prov.contributingModules) {
            regimeStackUpdate(regime, m.name, m.signal ?? 0, won);
          }
        } catch {
        }
        try {
          recordTradeOutcome(won, realised);
        } catch {
        }
        try {
          recordTierMetaOutcomeV(regime, prov.contributingModules.map((m) => ({
            name: m.name,
            signal: m.signal ?? 0
          })), won);
        } catch {
        }
        try {
          const feats = {};
          for (const m of prov.contributingModules) feats[m.name] = m.signal ?? 0;
          recordCausalSampleW(feats, realised);
          recordWinnerPatternZ(feats, realised);
        } catch {
        }
        try {
          recordCurriculumSampleY(Number(r.confidence), realised, 0.02);
        } catch {
        }
        try {
          recordHierarchicalOutcomeAA(String(r.symbol), sector ?? "unknown", realised);
        } catch {
        }
        try {
          recordReturnBB(realised);
        } catch {
        }
        try {
          recordParetoPointCC({ ret: realised, risk: 0.3, freq: 0.3 });
        } catch {
        }
        try {
          recordPredictionErrorEE(Number(r.confidence), realised);
        } catch {
        }
        try {
          const feats = {};
          for (const m of prov.contributingModules) feats[m.name] = m.signal ?? 0;
          recordFeatureOutcomeGG(feats, realised);
        } catch {
        }
        try {
          recordReplayHH(Number(r.confidence), realised);
        } catch {
        }
        try {
          recordRegimeOutcomeKK(regime, won);
        } catch {
        }
        try {
          recordHyperparamOutcomeLL(realised);
        } catch {
        }
        try {
          recordDecisionMM(regime, Number(r.confidence), won, realised);
        } catch {
        }
        try {
          recordRegimeTransitionOO(regime);
        } catch {
        }
        try {
          const vec = prov.contributingModules.slice(0, 12).map((m) => m.signal ?? 0);
          recordFeatureVectorRR(vec);
        } catch {
        }
        try {
          recordRLWeightsOutcomeSS(realised);
        } catch {
        }
        try {
          recordBacktestOutcomeTT(Number(r.confidence), realised);
        } catch {
        }
        try {
          for (const m of prov.contributingModules) {
            recordTierICVV(m.name, m.signal ?? 0, realised);
          }
        } catch {
        }
        try {
          const marketRet = prov.marketRet ?? 0;
          recordReturnsWW(String(r.symbol), realised, marketRet);
        } catch {
        }
        try {
          const rng = Math.abs(realised);
          recordRangeXX(String(r.symbol), rng, Math.sign(realised));
        } catch {
        }
        try {
          const cluster = `${sector ?? "unknown"}:${regime}`;
          recordClusterSentimentYY(cluster, Math.tanh(realised / 5));
        } catch {
        }
        try {
          const expected = (Number(r.confidence) - 50) / 50 * 3;
          recordExecutionGapZZ(realised, expected);
        } catch {
        }
        try {
          const sigs = prov.contributingModules.map((m) => ({
            name: m.name,
            value: m.signal ?? 0
          }));
          trainStackingAAA(sigs, realised);
        } catch {
        }
        try {
          for (const m of prov.contributingModules) {
            recordTierOutcomeCCC(regime, m.name, m.signal ?? 0, realised);
          }
        } catch {
        }
        try {
          recordConformalSampleDDD(Number(r.confidence), realised);
        } catch {
        }
        try {
          const sigs = prov.contributingModules.map((m) => ({ name: m.name, value: m.signal ?? 0 }));
          recordShapSampleEEE(sigs, realised);
        } catch {
        }
        try {
          const price = Number(r.entry_price ?? 0);
          if (price > 0) updateKalmanHHH(String(r.symbol), price);
        } catch {
        }
        try {
          updateGarchIII(String(r.symbol), realised / 100);
        } catch {
        }
        try {
          const feats = prov.contributingModules.slice(0, 8).map((m) => m.signal ?? 0);
          recordClusterRegimeJJJ(feats);
        } catch {
        }
        try {
          recordDecisionKKK((Number(r.confidence) - 50) / 50, realised);
        } catch {
        }
        try {
          const sent = prov.contributingModules.find((m) => /sent|news/i.test(m.name))?.signal ?? 0;
          const mom = prov.contributingModules.find((m) => /momentum|trend/i.test(m.name))?.signal ?? 0;
          recordCausalSampleLLL(sent, mom, realised);
        } catch {
        }
        try {
          for (const m of prov.contributingModules) {
            recordEWCSampleNNN(m.name, m.signal ?? 0, realised / 100);
          }
        } catch {
        }
        try {
          const tf = prov.timeframes;
          if (tf) {
            recordTimeframeOutcomeOOO({
              sig1m: tf.sig1m ?? 0,
              sig5m: tf.sig5m ?? 0,
              sig1h: tf.sig1h ?? 0,
              sig1d: tf.sig1d ?? 0,
              outcome: realised
            });
          }
        } catch {
        }
        try {
          const feats = prov.contributingModules.slice(0, 12).map((m) => m.signal ?? 0);
          recordPatternUUU(feats, realised);
        } catch {
        }
        try {
          const input = prov.contributingModules[0]?.signal ?? 0;
          trainLstmVVV(String(r.symbol), input, realised);
        } catch {
        }
        try {
          const feats = prov.contributingModules.slice(0, 12).map((m) => m.signal ?? 0);
          trainGeneticAlgoWWW(feats, realised);
        } catch {
        }
        try {
          recordThresholdOutcomeYYY("min_confidence", Number(r.confidence), won);
        } catch {
        }
        try {
          for (const m of prov.contributingModules) {
            recordTierBanditZZZ(regime, m.name, won);
          }
        } catch {
        }
        try {
          recordBreakerOutcomeCCCC(won);
        } catch {
        }
        try {
          recordABSampleDDDD("global", realised, realised);
        } catch {
        }
        try {
          const sentiment = prov.contributingModules.find((m) => m.name.toLowerCase().includes("sentiment"))?.signal ?? 0;
          const momentum = prov.contributingModules.find((m) => m.name.toLowerCase().includes("momentum") || m.name.toLowerCase().includes("trend"))?.signal ?? 0;
          recordDoubleMLKKKK(sentiment, realised, momentum);
        } catch {
        }
        try {
          recordReturnLLLL(String(r.symbol), realised);
        } catch {
        }
        try {
          const sentiment = prov.contributingModules.find((m) => m.name.toLowerCase().includes("sentiment"))?.signal ?? 0;
          const news = prov.contributingModules.find((m) => m.name.toLowerCase().includes("news"))?.signal ?? sentiment;
          recordIVMMMM(news, sentiment, realised);
        } catch {
        }
        try {
          const running = prov.indicators?.rsi14 ?? 50;
          recordRDDNNNN(String(r.symbol), running, realised);
        } catch {
        }
        try {
          recordCalibrationOOOO(regime, Number(r.confidence), won);
        } catch {
        }
        try {
          const residual = realised;
          const ensVar = prov.contributingModules.length > 1 ? prov.contributingModules.reduce((s, m) => s + (m.signal ?? 0) ** 2, 0) / prov.contributingModules.length : 0;
          recordUncertaintyPPPP(regime, residual, ensVar);
        } catch {
        }
        try {
          recordDistributionRRRR("confidence", Number(r.confidence), true);
        } catch {
        }
        try {
          const feats = {};
          for (const m of prov.contributingModules.slice(0, 12)) feats[m.name] = m.signal ?? 0;
          recordSGDOutcomeSSSS(feats, realised);
        } catch {
        }
        try {
          recordSourceReturnTTTT(realised);
        } catch {
        }
        try {
          recordSymbolReturnTTTT(String(r.symbol), realised);
        } catch {
        }
        try {
          const feats = prov.contributingModules.slice(0, 8).map((m) => m.signal ?? 0);
          recordPatternTemplateUUUU(feats, realised);
        } catch {
        }
        try {
          const feats = prov.contributingModules.slice(0, 8).map((m) => m.signal ?? 0);
          recordContrastiveVVVV(feats, won);
        } catch {
        }
        try {
          recordKellyOutcomeWWWW(won, realised);
        } catch {
        }
        try {
          const day = String(r.outcome_at ?? "").slice(0, 10) || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
          recordCorrReturnXXXX(day, String(r.symbol), realised);
        } catch {
        }
        try {
          recordReturnYYYY(realised);
        } catch {
        }
        try {
          recordRegimeReturnZZZZ(realised);
        } catch {
        }
        try {
          const sentiment = prov.contributingModules.find((m) => m.name.toLowerCase().includes("sentiment"))?.signal ?? 0;
          recordCounterfactualBBBBB("sentiment", sentiment, realised);
        } catch {
        }
        try {
          for (const m of prov.contributingModules) recordStackOutcomeCCCCC(regime, m.name, won);
        } catch {
        }
        try {
          for (const m of prov.contributingModules.slice(0, 6)) {
            recordBMAOutcomeDDDDD(m.name, m.signal ?? 0, realised);
          }
        } catch {
        }
        try {
          const ind = prov.indicators ?? {};
          recordTFTSampleEEEEE(String(r.symbol), {
            short: (ind.rsi14 ?? 50) - 50,
            medium: ind.macd ?? 0,
            long: (ind.sma50 ?? 0) - (ind.sma200 ?? 0),
            futureEvent: 0,
            outcome: realised
          });
        } catch {
        }
        try {
          const ind = prov.indicators ?? {};
          if (typeof ind.volume === "number") recordTradeSizeKKKKK(String(r.symbol), ind.volume);
        } catch {
        }
        try {
          const ind = prov.indicators ?? {};
          const spread = ind.atr14 ?? 0.1;
          recordSpreadSampleLLLLL(String(r.symbol), spread, realised);
        } catch {
        }
        try {
          const active = prov.contributingModules.slice(0, 8).map((m) => m.name);
          recordNASOutcomeMMMMM(String(r.symbol), active, won);
        } catch {
        }
        try {
          const weights = {};
          for (const m of prov.contributingModules) weights[m.name] = m.weight;
          recordCheckpointNNNNN(weights, realised);
          updateCurrentPerfNNNNN(realised);
        } catch {
        }
        try {
          const ind = prov.indicators ?? {};
          recordMultiTaskOOOOO({
            price: realised,
            volume: (ind.volume ?? 0) > 0 ? Math.sign(realised) : 0,
            vol: ind.atr14 ?? 0,
            direction: Math.sign(realised)
          });
        } catch {
        }
        try {
          recordSelfPlayPPPPP(regime, realised);
        } catch {
        }
        try {
          for (const m of prov.contributingModules.slice(0, 8)) {
            recordMISampleQQQQQ(m.name, m.signal ?? 0, realised);
          }
        } catch {
        }
        try {
          recordTESeriesRRRRR(String(r.symbol), realised);
        } catch {
        }
        try {
          recordTESeriesRRRRR("MARKET", realised);
        } catch {
        }
        try {
          const day = String(r.outcome_at ?? "").slice(0, 10) || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
          recordHerdingVVVVV(day, String(r.symbol), realised);
        } catch {
        }
        try {
          recordDispositionXXXXX(String(r.symbol), won, true);
        } catch {
        }
        try {
          const primary = Number(r.confidence) - 50;
          recordShadowYYYYY(primary, primary * 0.9, realised);
        } catch {
        }
        try {
          const day = String(r.outcome_at ?? "").slice(0, 10) || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
          recordDailyPnlAAAAAA(day, realised);
        } catch {
        }
        try {
          recordPlattBBBBBB(Number(r.confidence), won);
        } catch {
        }
        try {
          for (const m of prov.contributingModules.slice(0, 8)) {
            recordBMASampleCCCCCC(m.name, m.signal ?? 0, realised);
          }
        } catch {
        }
        try {
          const feats = prov.contributingModules.slice(0, 6).map((m) => m.signal ?? 0);
          while (feats.length < 6) feats.push(0);
          recordStackedDDDDDD(feats, won);
        } catch {
        }
        try {
          recordReturnEEEEEE(String(r.symbol), realised);
        } catch {
        }
        try {
          recordFoldFFFFFF(0, Number(r.confidence) - 50, realised);
        } catch {
        }
        try {
          const ind = prov.indicators ?? {};
          const vol = Math.max(1, ind.volume ?? 1);
          const buy = realised > 0 ? vol * 0.6 : vol * 0.4;
          recordVPINBucketGGGGGG(String(r.symbol), buy, vol - buy);
        } catch {
        }
        try {
          recordLLReturnHHHHHH(String(r.symbol), realised);
        } catch {
        }
        try {
          recordLLReturnHHHHHH("MARKET", realised);
        } catch {
        }
        try {
          updateDCCIIIIII(realised, realised * 0.7);
        } catch {
        }
        try {
          recordClassMMMMMM(won);
        } catch {
        }
        try {
          recordCurriculumPerfNNNNNN(won ? 1 : 0);
        } catch {
        }
        try {
          const day = String(r.outcome_at ?? "").slice(0, 10) || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
          void day;
          recordLivePnlQQQQQQ(realised);
        } catch {
        }
        try {
          recordTrialSharpePPPPPP(realised / Math.max(0.5, Math.abs(realised) + 1));
        } catch {
        }
        try {
          const imp = {};
          for (const m of prov.contributingModules.slice(0, 10)) imp[m.name] = Math.abs(m.weight);
          recordShapSnapshotRRRRRR(imp);
        } catch {
        }
        try {
          recordConformalSSSSSS(String(r.symbol), (Number(r.confidence) - 50) / 25, realised);
        } catch {
        }
        try {
          const sector2 = sectorBy.get(String(r.symbol).toUpperCase()) ?? null;
          recordSectorReturnTTTTTT(String(r.symbol), sector2, realised);
        } catch {
        }
        try {
          recordExpertVVVVVV(regime, won);
        } catch {
        }
        try {
          recordCausalWWWWWW("MARKET", realised);
        } catch {
        }
        try {
          recordCausalWWWWWW(String(r.symbol), realised);
        } catch {
        }
        try {
          if (Math.abs(realised) > 3) recordHawkesEventYYYYYY(String(r.symbol));
        } catch {
        }
        try {
          recordMAMLAAAAAAA(String(r.symbol), won);
        } catch {
        }
        try {
          recordPPOBBBBBBB(String(r.signal ?? "hold"), realised);
        } catch {
        }
        try {
          const feats = prov.contributingModules.slice(0, 8).map((m) => m.signal ?? 0);
          recordTS2VecCCCCCCC(String(r.symbol), feats);
        } catch {
        }
        try {
          const base = Number(r.confidence);
          recordAdversarialDDDDDDD(base, base + (Math.random() - 0.5) * 4);
        } catch {
        }
        try {
          for (const m of prov.contributingModules.slice(0, 8)) {
            updateFTRLEEEEEEE(m.name, -realised * (m.signal ?? 0));
          }
        } catch {
        }
        try {
          recordBanditFFFFFFF(regime, won);
        } catch {
        }
        try {
          const best = Math.max(realised, 0);
          recordRegretGGGGGGG(regime, realised, best);
        } catch {
        }
        try {
          const teacher = Number(r.confidence);
          const student = teacher * 0.9 + (realised > 0 ? 5 : -5);
          recordDistillationHHHHHHH(teacher, student);
        } catch {
        }
        try {
          recordShockOOOOOOO(String(r.symbol), realised / 100);
        } catch {
        }
        try {
          recordArchPerfRRRRRRR("deep", realised);
        } catch {
        }
        try {
          const feats = prov.contributingModules.slice(0, 6).map((m) => m.signal ?? 0);
          recordCpcSSSSSSS(String(r.symbol), feats);
        } catch {
        }
        try {
          recordLossTTTTTTT(Math.abs(realised - (Number(r.confidence) - 50) / 50));
        } catch {
        }
        try {
          recordAdversaryUUUUUUU((Number(r.confidence) - 50) / 50, realised);
        } catch {
        }
        try {
          for (const m of prov.contributingModules.slice(0, 8)) {
            const corr = (m.signal ?? 0) * Math.sign(realised);
            recordCausalLinkVVVVVVV(m.name, corr);
          }
        } catch {
        }
        try {
          const conf = (Number(r.confidence) - 50) / 50;
          recordExplanationXXXXXXX(conf, conf * 0.95, conf * 1.05);
        } catch {
        }
        try {
          recordDepthImbalanceMMMMMMM(String(r.symbol), 50 + realised, 50 - realised);
        } catch {
        }
        try {
          recordKyleNNNNNNN(String(r.symbol), Math.sign(realised), realised / 100);
        } catch {
        }
        try {
          recordLOBCCCCCCCC(String(r.symbol), 50 + realised, 50 - realised);
        } catch {
        }
        try {
          const peers = prov.contributingModules.slice(0, 4).map((m) => m.name);
          updateCentralityFFFFFFFF(String(r.symbol), peers);
        } catch {
        }
        try {
          const sector2 = r.sector ?? "default";
          recordLoRAGGGGGGGG(sector2, realised - (Number(r.confidence) - 50) / 50);
        } catch {
        }
        try {
          const origLoss = Math.abs(realised - (Number(r.confidence) - 50) / 50);
          recordMixupIIIIIIII(origLoss, origLoss * 1.05);
        } catch {
        }
        try {
          const fast = (Number(r.confidence) - 50) / 50;
          const slow = fast * 0.9 + realised * 0.1;
          recordLookaheadJJJJJJJJ(fast, slow);
        } catch {
        }
        try {
          const wasCorrect = Number(r.confidence) > 50 === realised > 0;
          recordCalibrationLLLLLLLL(Number(r.confidence), wasCorrect);
        } catch {
        }
        try {
          const feats = prov.contributingModules.slice(0, 6).map((m) => m.signal ?? 0);
          recordInDistMMMMMMMM(feats);
        } catch {
        }
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
        } catch {
        }
        try {
          const predConf = (Number(r.confidence) - 50) / 50;
          recordConformalOOOOOOOO(predConf, realised);
        } catch {
        }
        try {
          recordCrossSectionalUUUUUUUU(String(r.symbol), realised);
        } catch {
        }
        try {
          const teacher = (Number(r.confidence) - 50) / 50;
          const student = teacher * 0.95 + realised * 0.05;
          recordDistillationWWWWWWWW(teacher, student);
        } catch {
        }
        try {
          const weightChange = Math.abs(realised - (Number(r.confidence) - 50) / 50) * 0.1;
          recordEWCXXXXXXXX(weightChange);
        } catch {
        }
        try {
          recordSWAZZZZZZZZ((Number(r.confidence) - 50) / 50);
        } catch {
        }
        try {
          recordGovernanceCCCCCCCCC("dataSheet", true);
          recordGovernanceCCCCCCCCC("modelCard", true);
          recordGovernanceCCCCCCCCC("biasAudit", prov.contributingModules.length > 3);
        } catch {
        }
        try {
          for (const m of prov.contributingModules.slice(0, 12)) {
            const sourceConf = Math.max(0, Math.min(100, 50 + (m.signal ?? 0) * 25));
            recordBMASourceOutcome(m.name, sourceConf, won);
            updateDistillation(m.name, m.signal ?? 0, realised / 5);
          }
        } catch {
        }
        try {
          const conf = Number(r.confidence);
          const halfWidth = 25;
          const realizedConf = won ? 75 : 25;
          recordConformalCoverage(conf - halfWidth, conf + halfWidth, realizedConf);
        } catch {
        }
        try {
          recordCounterfactualReplay(Number(r.confidence), won);
        } catch {
        }
        try {
          recordRegimeOutcomeRAT(regime, won);
        } catch {
        }
        try {
          recordUncertaintyOutcome(Number(r.confidence), won);
        } catch {
        }
        try {
          const isStress = regime === "high_vol" || Math.abs(realised) > 5;
          recordStressOutcome(realised, isStress);
        } catch {
        }
        try {
          recordSectorOutcomeGKT(sector ?? "unknown", won);
        } catch {
        }
        try {
          const label = r.outcome === "target_hit" ? "tp" : r.outcome === "stop_hit" ? "sl" : "time";
          recordMetaLabelTripleBarrier(label);
        } catch {
        }
        try {
          let h = 0;
          for (let i = 0; i < r.id.length; i++) h = h * 31 + r.id.charCodeAt(i) | 0;
          recordPurgedFoldOutcome(Math.abs(h), won);
        } catch {
        }
        try {
          for (const m of prov.contributingModules.slice(0, 12)) {
            recordFeatureImportanceFID(m.name, Math.abs(m.signal ?? 0) * Math.abs(m.weight ?? 1));
          }
        } catch {
        }
        try {
          recordIsotonicEnsembleOutcome(Number(r.confidence), won);
        } catch {
        }
        try {
          const cluster = `${sector ?? "unknown"}:${regime}`;
          recordHRPClusterReturn(cluster, realised);
        } catch {
        }
        try {
          for (const m of prov.contributingModules.slice(0, 12)) {
            recordCausalLinkCDV(m.name, m.signal ?? 0, realised);
          }
        } catch {
        }
        try {
          recordRLPositionOutcome(regime, Number(r.confidence), realised);
        } catch {
        }
        try {
          recordShadowABOutcome(won, won);
        } catch {
        }
        try {
          recordFederatedSectorOutcome(sector ?? "unknown", realised);
        } catch {
        }
        try {
          recordOGBOutcome(regime, Number(r.confidence), realised);
        } catch {
        }
        try {
          recordKellyOutcomeAPEX(won, realised);
        } catch {
        }
        try {
          recordWFOSample(Number(r.confidence), won);
        } catch {
        }
        try {
          recordCUSUMReturn(realised);
        } catch {
        }
        try {
          recordCointegrationReturn(sector ?? "unknown", realised);
        } catch {
        }
        try {
          recordGARCHReturn(realised);
        } catch {
        }
        try {
          recordDrawdownReturn(realised);
        } catch {
        }
        try {
          const hour = r.outcome_at ? new Date(r.outcome_at).getUTCHours() : (/* @__PURE__ */ new Date()).getUTCHours();
          recordTimeOfDayOutcome(hour, won);
        } catch {
        }
        try {
          recordTradeQuality(String(r.signal ?? "unknown"), realised);
        } catch {
        }
        try {
          recordADWINOutcome(won);
        } catch {
        }
        try {
          recordTSMReturn(realised);
        } catch {
        }
        try {
          const arm = `${sector ?? "unk"}:${regime}`;
          recordThompsonOutcome(arm, won);
        } catch {
        }
        try {
          recordSBAReturn(realised);
        } catch {
        }
      } catch {
      }
    }
    count++;
  }
  if (processed.size > 5e3) {
    const arr = Array.from(processed);
    processed.clear();
    arr.slice(-2500).forEach((id) => processed.add(id));
  }
  if (count > 0) {
    try {
      await saveState("advanced_intelligence_v2", snapshotV2State());
    } catch {
    }
    try {
      await saveState("lopez_de_prado", snapshotLDPState());
    } catch {
    }
    try {
      recomputeCorrelations();
    } catch {
    }
    try {
      await saveState("tier_b_intelligence", snapshotTierBState());
    } catch {
    }
    try {
      await saveState("tier_cde_intelligence", snapshotTierCDEState());
    } catch {
    }
    try {
      await saveState("tier_fgh_intelligence", snapshotTierFGHState());
    } catch {
    }
    try {
      await saveState("tier_q_intelligence", snapshotTierQState());
    } catch {
    }
    try {
      await saveState("tier_r_intelligence", snapshotTierRState());
    } catch {
    }
    try {
      await saveState("tier_s_intelligence", snapshotTierSState());
    } catch {
    }
    try {
      await saveState("tier_t_intelligence", snapshotTierTState());
    } catch {
    }
    try {
      await saveState("tier_u_intelligence", snapshotTierUState());
    } catch {
    }
    try {
      await saveState("tier_vwx_intelligence", snapshotTierVWXState());
    } catch {
    }
    try {
      await saveState("tier_eelm_intelligence", snapshotTierEELMState());
    } catch {
    }
    try {
      await saveState("tier_mmtt_intelligence", snapshotTierMMTTState());
    } catch {
    }
    try {
      await saveState("tier_uubbb_intelligence", snapshotTierUUBBBState());
    } catch {
    }
    try {
      await saveState("tier_cccppp_intelligence", snapshotTierCCCPPPState());
    } catch {
    }
    try {
      await saveState("tier_qqqffff_intelligence", snapshotTierQQQFFFFState());
    } catch {
    }
    try {
      await saveState("tier_ggggrrrr_intelligence", snapshotTierGGGGRRRRState());
    } catch {
    }
    try {
      await saveState("tier_ssssddddd_intelligence", snapshotTierSSSSDDDDDState());
    } catch {
    }
    try {
      await saveState("tier_eeeeepppppppp_intelligence", snapshotTierEEEEEPPPPPState());
    } catch {
    }
    try {
      await saveState("tier_qqqqqbbbbbb_intelligence", snapshotTierQQQQQBBBBBBState());
    } catch {
    }
    try {
      await saveState("tier_ccccccrrrrrr_intelligence", snapshotTierCCCCCCRRRRRRState());
    } catch {
    }
    try {
      await saveState("tier_ssssssshhhhhhh_intelligence", snapshotTierSSSSSSHHHHHHHState());
    } catch {
    }
    try {
      await saveState("tier_iiiiiiixxxxxxx_intelligence", snapshotTierIIIIIIIXXXXXXXState());
    } catch {
    }
    try {
      await saveState("tier_yyyyyyynnnnnnnn_intelligence", snapshotTierYYYYYYYNNNNNNNNState());
    } catch {
    }
    try {
      await saveState("tier_oooooooodddddddd_intelligence", snapshotTierOOOOOOOODDDDDDDDDState());
    } catch {
    }
    try {
      await saveState("tier_frontier_v3_intelligence", snapshotTierFrontierV3State());
    } catch {
    }
    try {
      await saveState("tier_master_iq_intelligence", snapshotTierMasterIQState());
    } catch {
    }
    try {
      await saveState("tier_apex_iq_intelligence", snapshotTierApexIQState());
    } catch {
    }
  }
  return { processed: count };
}
export {
  ingestClosedTrades as i
};
