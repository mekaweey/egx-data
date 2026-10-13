import { c as createServerRpc } from "./createServerRpc-BEwYw6bn.mjs";
import { c as createServerFn } from "./server-BpMZvK1r.mjs";
import { supabaseAdmin } from "./client.server-D5ro3rAQ.mjs";
import { p as provenanceLog } from "./auto-orchestrator.server-Cobs3ZBw.mjs";
import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "node:http";
import "node:stream";
import "node:stream/promises";
import "node:https";
import "node:http2";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "../_libs/tanstack__react-router.mjs";
import "../_libs/react-dom.mjs";
import "util";
import "async_hooks";
import "stream";
import "crypto";
import "../_libs/isbot.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "./chat-fallback.server-HMcdWJQs.mjs";
import "./tier-k-intelligence.server-IqAM99dH.mjs";
const TIER_CATALOG = [{
  id: "V2",
  stateKey: "advanced_intelligence_v2",
  title: "Advanced Intelligence V2",
  description: "Bayesian intervals, drift PSI, anomaly detection, active learning queue.",
  features: ["bayesianInterval", "driftPSI", "anomalyCheck", "activeLearning"]
}, {
  id: "LDP",
  stateKey: "lopez_de_prado",
  title: "Lopez de Prado Stack",
  description: "Bayesian Model Averaging + meta-labelling for false-positive filtering.",
  features: ["bmaMultiplier", "metaMultiplier"]
}, {
  id: "B",
  stateKey: "tier_b_intelligence",
  title: "Tier B — Calibration & Stacking",
  description: "Isotonic calibration, day-of-week edge, regime-conditional stacking.",
  features: ["isotonicCalibrate", "dowMultiplier", "regimeStackWeight"]
}, {
  id: "CDE",
  stateKey: "tier_cde_intelligence",
  title: "Tier C/D/E — SGD, Conformal, HMM",
  description: "Online SGD predictor, conformal intervals, stacking, CUSUM changepoint, contagion, HMM regime, lead-lag, order-book imbalance.",
  features: ["sgdPredict", "conformalInterval", "stackMultiplier", "cusumChangePoint", "contagionMultiplier", "hmmState", "leadLagScore", "obImbalance"]
}, {
  id: "FGH",
  stateKey: "tier_fgh_intelligence",
  title: "Tier F/G/H — Strategy BMA & SHAP",
  description: "Liquidity, suspension, decay, strategy-class BMA, cross-sectional, SHAP-lite attribution.",
  features: ["liquidityMultiplier", "decayMultiplier", "strategyBMAMultiplier", "crossSectionalMultiplier", "shapAttribution"]
}, {
  id: "I",
  stateKey: "tier_i_intelligence",
  title: "Tier I — Regime & Microstructure",
  description: "Regime detection, neighbour effects, microstructure, drift, events.",
  features: ["regimeMultiplier", "neighborMultiplier", "microMultiplier", "globalDriftMultiplier", "eventMultiplier"]
}, {
  id: "J",
  stateKey: "tier_j_intelligence",
  title: "Tier J — Bandit & Kalman",
  description: "Bandit allocator, order-flow imbalance, news similarity, sector rotation, Kalman beta decouple, ADWIN drift.",
  features: ["banditMultiplier", "ofiMultiplier", "newsSimilarityMultiplier", "sectorRotationMultiplier", "kalmanDecoupleMultiplier", "adwinMultiplier"]
}, {
  id: "K",
  stateKey: "tier_k_intelligence",
  title: "Tier K — Semantic RAG & Online Nudge",
  description: "RAG over past news embeddings + online-learned additive nudge from feature contributions.",
  features: ["ragQuerySimilarNews", "olScoreNudge"]
}, {
  id: "M",
  stateKey: "tier_m_intelligence",
  title: "Tier M — Multi-timeframe & Rotation",
  description: "Daily/weekly/bi-weekly confirmation, sector rotation re-weighting.",
  features: ["multiTimeframeConfirm", "sectorRotationMultiplierM"]
}, {
  id: "N",
  stateKey: "tier_n_intelligence",
  title: "Tier N — Pattern Memory & Anomaly",
  description: "Outcome-weighted pattern memory, regime-aware confidence, outlier filter.",
  features: ["patternOutcomeMultiplier", "regimeAwareMultiplier", "anomalyOutlierFilter"]
}, {
  id: "O",
  stateKey: "tier_o_intelligence",
  title: "Tier O — Concentration, Earnings, Meta",
  description: "Sector-concentration filter, learned DoW, strict earnings guard, meta-weighted score, reliability curve, Kelly fraction.",
  features: ["sectorConcentrationMultiplier", "dowLearnedMultiplier", "earningsProximityGuard", "metaWeightedMultiplier", "reliabilityCalibrate", "kellyFraction"]
}, {
  id: "P",
  stateKey: "tier_p_intelligence",
  title: "Tier P — Persistence & Decay",
  description: "Long-term persistence helpers, decay curves.",
  features: ["persistence", "decay"]
}, {
  id: "Q",
  stateKey: "tier_q_intelligence",
  title: "Tier Q — HMM, Shrinkage, KNN",
  description: "HMM regime Q, Bayesian shrinkage, feature impact, drift alarm, KNN similarity, winsorization.",
  features: ["hmmMultiplierQ", "bayesShrinkMultiplierQ", "featureImpactMultiplierQ", "driftAlarmMultiplierQ", "knnSimilarityMultiplierQ", "winsorizedConfidenceQ"]
}, {
  id: "R",
  stateKey: "tier_r_intelligence",
  title: "Tier R — Thompson, IPW, VWAP",
  description: "Thompson sampling, IPW, sector momentum, earnings proximity, anchored VWAP, sentiment velocity, volume profile.",
  features: ["thompsonMultiplierR", "ipwMultiplierR", "sectorMomentumMultiplierR", "earningsProximityMultiplierR", "anchoredVwapMultiplierR", "sentimentVelocityMultiplierR", "volumeProfileMultiplierR"]
}, {
  id: "S",
  stateKey: "tier_s_intelligence",
  title: "Tier S — Kalman, Hurst, IC, Order Flow",
  description: "Kalman trend, Hurst exponent, CUSUM change, IC tracking, vol targeting, order-flow imbalance.",
  features: ["kalmanTrendMultiplierS", "hurstMultiplierS", "cusumMultiplierS", "icMultiplierS", "volTargetMultiplierS", "orderFlowMultiplierS"]
}, {
  id: "T",
  stateKey: "tier_t_intelligence",
  title: "Tier T — HMM Transition, GARCH, Platt",
  description: "HMM transitions, GARCH vol, beta, concentration, KS drift, permutation importance, MW-ensemble, Platt calibration.",
  features: ["hmmTransitionMultiplierT", "garchVolMultiplierT", "betaMultiplierT", "concentrationMultiplierT", "ksDriftMultiplierT", "permImportanceMultiplierT", "mwEnsembleMultiplierT", "plattCalibrateT"]
}, {
  id: "U",
  stateKey: "tier_u_intelligence",
  title: "Tier U — Conformal Quantile, BOCPD, SGLD, EVT",
  description: "Isotonic re-map, conformal quantile width, BOCPD changepoint, transfer entropy, SGLD posterior, EVT tail, symbol-adaptive LR, OOF regularizer.",
  features: ["isotonicCalibrateU", "conformalWidthMultiplierU", "bocpdMultiplierU", "transferEntropyLeaderMultiplierU", "sgldUncertaintyMultiplierU", "evtTailMultiplierU", "symbolAdaptiveMultiplierU", "oofRegularizerMultiplierU"]
}, {
  id: "V-DD",
  stateKey: "tier_vwx_intelligence",
  title: "Tier V/W/X/Y/Z/AA/BB/CC/DD — Meta & Robustness",
  description: "Meta-learning across tiers, causal lift (PSM), adversarial robustness, curriculum learning, imitation from winners, hierarchical Bayes, Sortino risk-adjustment, Pareto multi-objective, explainability concentration.",
  features: ["tierMetaMultiplierV", "causalLiftMultiplierW", "adversarialRobustnessMultiplierX", "curriculumMultiplierY", "imitationMultiplierZ", "hierarchicalShrinkageMultiplierAA", "sortinoMultiplierBB", "paretoMultiplierCC", "explainabilityMultiplierDD"]
}, {
  id: "EE-LL",
  stateKey: "tier_eelm_intelligence",
  title: "Tier EE/FF/GG/HH/II/JJ/KK/LL — Drift, Ensemble, Decay, Replay",
  description: "Concept-drift (Page-Hinkley), ensemble disagreement uncertainty, feature-importance decay, counterfactual replay, multi-timeframe confluence, microstructure proxy, self-diagnostic per regime, meta-hyperparameter search.",
  features: ["driftMultiplierEE", "ensembleDisagreementMultiplierFF", "featureDecayMultiplierGG", "counterfactualMultiplierHH", "multiTimeframeConfluenceMultiplierII", "microstructureMultiplierJJ", "selfDiagnosticMultiplierKK", "hyperparamMultiplierLL"]
}, {
  id: "MM-TT",
  stateKey: "tier_mmtt_intelligence",
  title: "Tier MM/OO/PP/QQ/RR/SS/TT — Agent, Regime Switching, RL Weights",
  description: "Self-diagnostic mistake-pattern agent, HMM-lite regime switching, sentiment velocity, order-book replay proxy, Mahalanobis anomaly auto-quarantine, RL-over-weights bandit, backtesting-in-production with parallel strategies.",
  features: ["selfDiagnosticAgentMultiplierMM", "regimeSwitchingMultiplierOO", "sentimentVelocityMultiplierPP", "orderBookReplayMultiplierQQ", "anomalyAutoQuarantineMultiplierRR", "rlOverWeightsMultiplierSS", "backtestingInProductionMultiplierTT"]
}, {
  id: "UU-BBB",
  stateKey: "tier_uubbb_intelligence",
  title: "Tier UU/VV/WW/XX/YY/ZZ/AAA/BBB — LLM Meta, Stacking, RLHF",
  description: "LLM meta-analyst cached vote, walk-forward Information Coefficient per tier, cross-asset correlation, options-flow proxy (vol skew), narrative clustering (sentiment momentum), execution-quality slippage tracking, Ridge-lite meta-learner stacking, human-feedback RLHF loop.",
  features: ["llmMetaAnalystMultiplierUU", "walkForwardICMultiplierVV", "crossAssetCorrelationMultiplierWW", "optionsFlowMultiplierXX", "narrativeClusteringMultiplierYY", "executionQualityMultiplierZZ", "metaLearnerStackingMultiplierAAA", "humanFeedbackMultiplierBBB"]
}, {
  id: "CCC-PPP",
  stateKey: "tier_cccppp_intelligence",
  title: "Tier CCC–PPP — BMA, Conformal, SHAP, Microstructure, Events, Kalman, GARCH, Clusters, Transformer-lite, Causal, Adversarial, EWC, Multi-TF, Risk Parity",
  description: "Bayesian Model Averaging per regime, conformal prediction intervals, SHAP-lite feature importance, microstructure tick analysis (VWAP/imbalance), event-study abnormal returns, Kalman trend filter, GARCH(1,1) volatility forecast, online K-means cluster regimes, transformer-lite attention over decisions, causal inference (Frisch–Waugh), adversarial robustness scoring, EWC-lite continual learning, multi-timeframe hierarchical fusion, portfolio-level risk parity & concentration (HHI).",
  features: ["bayesianModelAveragingMultiplierCCC", "conformalMultiplierDDD", "featureImportanceMultiplierEEE", "microstructureTickMultiplierFFF", "eventStudyMultiplierGGG", "kalmanTrendMultiplierHHH", "garchVolMultiplierIII", "clusterRegimeMultiplierJJJ", "transformerSeqMultiplierKKK", "causalInferenceMultiplierLLL", "adversarialRobustnessMultiplierMMM", "continualLearningMultiplierNNN", "multiTimeframeFusionMultiplierOOO", "portfolioRiskParityMultiplierPPP"]
}, {
  id: "QQQ-FFFF",
  stateKey: "tier_qqqffff_intelligence",
  title: "Tier QQQ–FFFF — Alt Data, Insider, Analyst, Dark Pool, RAG, LSTM, GA, Quantum-Opt, AutoML, Bandit, MC Planning, CoT, Circuit Breaker, A/B, XAI, Alerts",
  description: "Alternative data fusion (Trends/Social/Wiki velocity), insider activity tracker (Form-4 cluster), analyst revision momentum, dark-pool / block-trade flow imbalance, vector-DB RAG (cosine NN over historical patterns), LSTM-lite recurrent learner, genetic-algorithm feature engineering, quantum-inspired simulated annealing, AutoML UCB threshold tuner, Thompson-sampling multi-armed bandit per regime, Monte-Carlo simulation planning, chain-of-thought cached LLM bias, accuracy-guarded circuit breaker (safe mode), A/B testing with t-stat, explainable-AI contribution decomposer, real-time critical-signal alert queue.",
  features: ["alternativeDataFusionMultiplierQQQ", "insiderActivityMultiplierRRR", "analystRevisionMultiplierSSS", "darkPoolFlowMultiplierTTT", "vectorRAGMultiplierUUU", "lstmDeepLearningMultiplierVVV", "geneticAlgoMultiplierWWW", "quantumInspiredMultiplierXXX", "autoMLMultiplierYYY", "multiArmedBanditMultiplierZZZ", "simulationPlanningMultiplierAAAA", "chainOfThoughtMultiplierBBBB", "circuitBreakerMultiplierCCCC", "abShadowReadyDDDD", "decomposeContributionsEEEE", "checkCriticalSignalFFFF"]
}, {
  id: "GGGG-RRRR",
  stateKey: "tier_ggggrrrr_intelligence",
  title: "Tier GGGG–RRRR — Deep Microstructure, Causal Inference, Meta-Cognition",
  description: "Order-flow toxicity VPIN, Hawkes self-exciting trade clustering, Kyle's lambda market depth, PIN informed-trading proxy, Double-ML residualised causal effect, synthetic control counterfactual, instrumental-variables 2SLS, regression discontinuity threshold discovery, metacognitive confidence calibration, epistemic vs aleatoric uncertainty decomposition, Mahalanobis OOD detection, PSI/KL model-decay monitoring.",
  features: ["vpinMultiplierGGGG", "hawkesMultiplierHHHH", "kyleLambdaMultiplierIIII", "pinMultiplierJJJJ", "doubleMLMultiplierKKKK", "syntheticControlMultiplierLLLL", "ivMultiplierMMMM", "rddMultiplierNNNN", "metacognitiveMultiplierOOOO", "uncertaintyMultiplierPPPP", "oodMultiplierQQQQ", "modelDecayMultiplierRRRR"]
}, {
  id: "SSSS-DDDDD",
  stateKey: "tier_ssssddddd_intelligence",
  title: "Tier SSSS–DDDDD — Adaptive Learning, Risk Intelligence, Robustness",
  description: "Online SGD per-feature weight updates, cross-market transfer prior, few-shot rare-pattern matching, contrastive win/loss centroids, Kelly criterion position sizing, correlation-regime crisis detection, tail-risk CVaR @ 5%, Hidden-Markov regime switching (bull/bear/sideways/crash), adversarial robustness perturbation tests, counterfactual what-if causal reasoning, ensemble stacking meta-learner per regime, Bayesian model averaging by log-likelihood.",
  features: ["sgdMultiplierSSSS", "transferMultiplierTTTT", "fewShotMultiplierUUUU", "contrastiveMultiplierVVVV", "kellyMultiplierWWWW", "correlationRegimeMultiplierXXXX", "cvarMultiplierYYYY", "hmmRegimeMultiplierZZZZ", "adversarialRobustnessMultiplierAAAAA", "counterfactualMultiplierBBBBB", "stackMultiplierCCCCC", "bmaMultiplierDDDDD"]
}, {
  id: "EEEEE-PPPPP",
  stateKey: "tier_eeeeepppppppp_intelligence",
  title: "Tier EEEEE–PPPPP — Deep Temporal, Microstructure 2.0, Self-Improving Meta-System",
  description: "Temporal Fusion Transformer multi-horizon fusion, neural Hawkes self-exciting process, WaveNet dilated CNN long-range trend, N-BEATS interpretable trend/seasonality decomposition, quote-stuffing detection, spoofing/layering detector, retail-vs-institutional trade-size clustering, effective spread decomposition (adverse selection), neural architecture search (per-symbol best feature subset), gradient-checkpoint replay on performance drift, multi-task co-learning across price/volume/volatility, self-play adversarial trader exploit search.",
  features: ["tftMultiplierEEEEE", "hawkesMultiplierFFFFF", "wavenetMultiplierGGGGG", "nbeatsMultiplierHHHHH", "quoteStuffingMultiplierIIIII", "spoofingMultiplierJJJJJ", "tradeSizeMultiplierKKKKK", "effectiveSpreadMultiplierLLLLL", "nasMultiplierMMMMM", "checkpointReplayMultiplierNNNNN", "multiTaskMultiplierOOOOO", "selfPlayMultiplierPPPPP"]
}, {
  id: "QQQQQ-BBBBBB",
  stateKey: "tier_qqqqqbbbbbb_intelligence",
  title: "Tier QQQQQ–BBBBBB — Information Theory, Behavioral Finance, Production Hardening",
  description: "Mutual-information feature selection (non-linear), transfer-entropy causality direction, signal-to-noise spectral decomposition, Lempel-Ziv complexity proxy for predictability, prospect-theory loss-aversion asymmetry, herding behavior via cross-sectional dispersion, 52-week high/low anchoring bias, disposition-effect contrarian signal, shadow-model A/B degradation detector, signal latency decay, catastrophic-loss circuit breaker (daily >5% or weekly >12%), Platt-scaling confidence calibration.",
  features: ["miMultiplierQQQQQ", "transferEntropyMultiplierRRRRR", "snrMultiplierSSSSS", "complexityMultiplierTTTTT", "prospectMultiplierUUUUU", "herdingMultiplierVVVVV", "anchoringMultiplierWWWWW", "dispositionMultiplierXXXXX", "shadowMultiplierYYYYY", "latencyMultiplierZZZZZ", "circuitBreakerMultiplierAAAAAA", "plattMultiplierBBBBBB"]
}, {
  id: "CCCCCC-RRRRRR",
  stateKey: "tier_ccccccrrrrrr_intelligence",
  title: "Tier CCCCCC–RRRRRR — Bayesian Ensembles, Advanced CV, Deep Microstructure, Smarter Training, Production Trust",
  description: "Bayesian model averaging by posterior likelihood, stacked logistic meta-learner over base contributions, quantile regression skew (P10/P50/P90), purged K-fold leakage detector, order-flow toxicity V2 (VPIN bucket clock), lead-lag Granger network, DCC-GARCH-lite regime correlations, two-scale realized volatility noise filter, active-learning uncertainty queue, EWC anti-forgetting penalty, SMOTE-TS class-imbalance metric, curriculum learning scheduler, probability of backtest overfitting (PBO), deflated Sharpe ratio, live-vs-backtest divergence monitor, SHAP-based feature-importance drift.",
  features: ["bmaMultiplierCCCCCC", "stackedMultiplierDDDDDD", "quantileMultiplierEEEEEE", "leakageMultiplierFFFFFF", "toxicityMultiplierGGGGGG", "leadLagMultiplierHHHHHH", "dccMultiplierIIIIII", "tsrvMultiplierJJJJJJ", "activeLearningMultiplierKKKKKK", "ewcMultiplierLLLLLL", "smoteMultiplierMMMMMM", "curriculumMultiplierNNNNNN", "pboMultiplierOOOOOO", "deflatedSharpeMultiplierPPPPPP", "divergenceMultiplierQQQQQQ", "shapDriftMultiplierRRRRRR"]
}, {
  id: "SSSSSS-HHHHHHH",
  stateKey: "tier_ssssssshhhhhhh_intelligence",
  title: "Tier SSSSSS–HHHHHHH — Next-Gen Accuracy, Causal Inference, Smart Training, Operational Intelligence",
  description: "Split-conformal prediction with coverage guarantee, hierarchical Bayesian sector shrinkage, Gaussian Process RBF uncertainty, Mixture-of-Experts regime gating, causal partial-correlation do-calculus, counterfactual feature-stability analysis, Hawkes self-exciting cascade detector, Haar wavelet trend/cycle/noise decomposition, MAML per-symbol adaptive learning rate, PPO-lite reinforcement action rewards, TS2Vec self-supervised pattern similarity, adversarial noise-robustness check, FTRL online sparse learning, Thompson-sampling bandit per regime, counterfactual regret minimization, knowledge-distillation teacher-student agreement.",
  features: ["conformalMultiplierSSSSSS", "shrinkageMultiplierTTTTTT", "gpMultiplierUUUUUU", "moeMultiplierVVVVVV", "causalMultiplierWWWWWW", "counterfactualMultiplierXXXXXX", "hawkesMultiplierYYYYYY", "waveletMultiplierZZZZZZ", "mamlMultiplierAAAAAAA", "ppoMultiplierBBBBBBB", "ts2vecMultiplierCCCCCCC", "adversarialMultiplierDDDDDDD", "ftrlMultiplierEEEEEEE", "banditMultiplierFFFFFFF", "cfrMultiplierGGGGGGG", "distillationMultiplierHHHHHHH"]
}, {
  id: "IIIIIII-XXXXXXX",
  stateKey: "tier_iiiiiiixxxxxxx_intelligence",
  title: "Tier IIIIIII–XXXXXXX — Frontier Accuracy, Microstructure 2.0, Next-Gen Training, Strategic Intelligence",
  description: "Neural ODE continuous-time smoothness, Temporal Fusion Transformer multi-horizon agreement, Diffusion-model probabilistic path spread, Kalman ensemble signal/noise filter, deep order-book depth imbalance, Kyle's-Lambda toxicity detector, cross-asset contagion network, HMM hidden-regime stability, federated-learning consensus, Neural Architecture Search auto-arch picker, Contrastive Predictive Coding pattern familiarity, Sharpness-Aware Minimization flatness check, game-theoretic adversary modeling, PC-algorithm causal discovery, Information Bottleneck compression efficiency, and SHAP+LIME+Anchors explanation consensus.",
  features: ["neuralOdeMultiplierIIIIIII", "tftMultiplierJJJJJJJ", "diffusionMultiplierKKKKKKK", "kalmanMultiplierLLLLLLL", "depthMultiplierMMMMMMM", "kyleMultiplierNNNNNNN", "contagionMultiplierOOOOOOO", "hmmMultiplierPPPPPPP", "federatedMultiplierQQQQQQQ", "nasMultiplierRRRRRRR", "cpcMultiplierSSSSSSS", "samMultiplierTTTTTTT", "gameTheoryMultiplierUUUUUUU", "causalDiscoveryMultiplierVVVVVVV", "infoBottleneckMultiplierWWWWWWW", "explainabilityMultiplierXXXXXXX"]
}, {
  id: "YYYYYYY-NNNNNNNN",
  stateKey: "tier_yyyyyyynnnnnnnn_intelligence",
  title: "Tier YYYYYYY–NNNNNNNN — Frontier Accuracy v2, Microstructure 3.0, Next-Gen Training v2, Robustness & Governance",
  description: "Quantile Regression Forest asymmetric intervals, N-BEATS trend/seasonality decomposition, Echo State reservoir computing at edge-of-chaos, Topological Data Analysis persistent-structure detection, Limit Order Book queue-reactive dynamics, Lee-Mykland jump detection, Realized Kernel volatility estimator, network PageRank centrality for hub stocks, LoRA per-sector fine-tuning, Curriculum Learning v2 easy→hard stage sequencer, Mixup augmentation regularizer, Lookahead optimizer fast/slow stability, adversarial robustness verification, isotonic calibration (confidence↔accuracy), Mahalanobis out-of-distribution detection, and Concept Bottleneck human-interpretable concepts.",
  features: ["quantileRegressionMultiplierYYYYYYY", "nbeatsMultiplierZZZZZZZ", "echoStateMultiplierAAAAAAAA", "tdaMultiplierBBBBBBBB", "lobDynamicsMultiplierCCCCCCCC", "jumpDetectionMultiplierDDDDDDDD", "realizedKernelMultiplierEEEEEEEE", "centralityMultiplierFFFFFFFF", "loraMultiplierGGGGGGGG", "curriculumMultiplierHHHHHHHH", "mixupMultiplierIIIIIIII", "lookaheadMultiplierJJJJJJJJ", "adversarialRobustnessMultiplierKKKKKKKK", "isotonicCalibrationMultiplierLLLLLLLL", "mahalanobisOODMultiplierMMMMMMMM", "conceptBottleneckMultiplierNNNNNNNN"]
}, {
  id: "OOOOOOOO-DDDDDDDDD",
  stateKey: "tier_oooooooodddddddd_intelligence",
  title: "Tier OOOOOOOO–DDDDDDDDD — Ultra Accuracy, Deep Market, Advanced Training, Governance v2",
  description: "Conformal Prediction coverage-guaranteed intervals, Mixture Density Network multi-modal sharpness, Deep Gaussian Process bayesian uncertainty, Spectral Residual FFT-based anomaly detection, Hawkes Process self-exciting event clustering, Rough Volatility (rBergomi-style) Hurst exponent, cross-sectional momentum ranking, liquidity-adjusted VaR, knowledge distillation teacher↔student agreement, Elastic Weight Consolidation against catastrophic forgetting, self-distillation snapshot ensemble agreement, Stochastic Weight Averaging convergence, counterfactual decision-flip distance, bootstrap empirical prediction intervals, Model Cards governance completeness, and Shapley-value attribution balance.",
  features: ["conformalPredictionMultiplierOOOOOOOO", "mixtureDensityMultiplierPPPPPPPP", "deepGaussianProcessMultiplierQQQQQQQQ", "spectralResidualMultiplierRRRRRRRR", "hawkesProcessMultiplierSSSSSSSS", "roughVolatilityMultiplierTTTTTTTT", "crossSectionalMomentumMultiplierUUUUUUUU", "liquidityVaRMultiplierVVVVVVVV", "distillationMultiplierWWWWWWWW", "ewcMultiplierXXXXXXXX", "selfDistillationMultiplierYYYYYYYY", "swaMultiplierZZZZZZZZ", "counterfactualMultiplierAAAAAAAAA", "bootstrapIntervalMultiplierBBBBBBBBB", "modelCardMultiplierCCCCCCCCC", "shapleyMultiplierDDDDDDDDD"]
}];
const getTierDashboard_createServerFn_handler = createServerRpc({
  id: "bdf462cd26fc76083cc992f2c73674102970d9181654df0e9f023bb1db88ea0f",
  name: "getTierDashboard",
  filename: "src/lib/dashboard/tier-dashboard.functions.ts"
}, (opts) => getTierDashboard.__executeServer(opts));
const getTierDashboard = createServerFn({
  method: "GET"
}).handler(getTierDashboard_createServerFn_handler, async () => {
  const keys = TIER_CATALOG.map((t) => t.stateKey);
  const {
    data: rows
  } = await supabaseAdmin.from("model_state").select("key,data,updated_at").in("key", keys);
  const byKey = /* @__PURE__ */ new Map();
  for (const r of rows ?? []) {
    byKey.set(r.key, {
      data: r.data,
      updated_at: r.updated_at ?? null
    });
  }
  const tiers = TIER_CATALOG.map((t) => {
    const row = byKey.get(t.stateKey);
    const payload = row?.data ?? null;
    const json = payload ? JSON.stringify(payload) : "";
    return {
      id: t.id,
      stateKey: t.stateKey,
      title: t.title,
      description: t.description,
      features: t.features,
      hasData: !!payload,
      payloadKeys: payload && typeof payload === "object" ? Object.keys(payload) : [],
      payloadSizeBytes: json.length,
      updatedAt: row?.updated_at ?? null
    };
  });
  const log = provenanceLog ?? [];
  const recentDecisions = log.length;
  const agg = /* @__PURE__ */ new Map();
  for (const entry of log.slice(-1e3)) {
    const mods = entry.contributingModules ?? [];
    for (const m of mods) {
      const cur = agg.get(m.name) ?? {
        count: 0,
        w: 0,
        s: 0,
        c: 0
      };
      cur.count += 1;
      cur.w += m.weight ?? 0;
      cur.s += m.signal ?? 0;
      cur.c += Math.abs((m.weight ?? 0) * (m.signal ?? 0));
      agg.set(m.name, cur);
    }
  }
  const topModules = Array.from(agg.entries()).map(([name, v]) => ({
    name,
    count: v.count,
    avgWeight: v.w / Math.max(1, v.count),
    avgSignal: v.s / Math.max(1, v.count),
    avgAbsContribution: v.c / Math.max(1, v.count)
  })).sort((a, b) => b.avgAbsContribution - a.avgAbsContribution).slice(0, 25);
  const recentDecisionSamples = log.slice(-15).reverse().map((e) => {
    const r = e;
    const at = r.ts ? new Date(r.ts).toISOString() : (/* @__PURE__ */ new Date()).toISOString();
    return {
      symbol: r.symbol ?? "?",
      action: r.action ?? "hold",
      baseConfidence: r.baseConfidence ?? 0,
      adjustedConfidence: r.adjustedConfidence ?? 0,
      rationale: r.rationale ?? "",
      at
    };
  });
  return {
    tiers,
    recentDecisions,
    topModules,
    recentDecisionSamples
  };
});
export {
  getTierDashboard_createServerFn_handler
};
