---
name: modules-catalog
description: Complete inventory of all 150+ analysis/ML/data/signal modules in the EGX scanner project — consult before adding new features to prevent duplication
type: feature
---

# Modules Catalog

Read this BEFORE proposing any new module to check for overlap/conflict.

## Core Pipeline
- `src/lib/scan/run-scan.server.ts` — main scan orchestrator
- `src/lib/scan/adaptive-learning.server.ts` — weekly self-learning
- `src/lib/ai/gateway.server.ts` — Lovable AI Gateway (Gemini default)
- `src/lib/ai/analyze.server.ts`, `ensemble.server.ts`

## analysis/ (60 files — technical, statistical, scoring)
advanced-patterns, anomaly-alerts, anomaly-detection, bayesian-calibration, bayesian-network, bayesian-update, block-trade, candlestick-patterns, causal-inference, confidence-decomposition, confidence-interval, confluence, contrarian, cross-asset, divergence, earnings-surprise, elliott-wave, ensemble-disagreement, explainability, fibonacci, five-dim-score, genetic-optimizer, harmonic-patterns, hidden-markov-model, hyperparameter-tuning, ichimoku, indicators, insider-volume, k-fold-cv, liquidity, lstm-lite, market-breadth, meta-learner, meta-symbol-transfer, monte-carlo, multi-horizon, multi-timeframe, news-decay, news-entity-extraction, performance-attribution, probability-calibration, regime-detection, regime-specific-meta, regime, relative-strength, score, seasonality, sector-momentum, sector-rotation, sentiment-velocity, shap-importance, smote-augmentation, social-sentiment, stacking-ensemble, survival-analysis, training-window, volume-price-divergence, volume-profile, what-if-simulator

## ml/ (deep learning & advanced ML)
adversarial-training, automl-pipeline, concept-drift, ensemble-of-ensembles, graph-neural-network, reinforcement-agent, self-supervised, transformer-attention

## meta/ (meta-learning)
continual-learning (EWC), knowledge-distillation, maml, mixture-of-experts, neural-ode

## stats/ (advanced statistics)
cointegration, copula, extreme-value-theory (EVT/GPD), kalman-filter, wavelet-transform

## advstats/
garch, hawkes-process, mcmc, var-model (VAR)

## signals/
cross-asset-correlation, options-flow, put-call-ratio, seasonality, vix-term-structure

## robust/ (validation & robustness)
conformal-prediction, ensemble-disagreement, monte-carlo-dropout, stress-testing, walk-forward

## intelligence/ (LLM-driven)
active-learning, counterfactual, llm-news-reasoning, multi-agent-debate (bull vs bear)

## genai/ (LLM patterns)
chain-of-thought, rag-filings (10-K/10-Q), self-consistency, tree-of-thoughts

## features/ (feature engineering)
auto-feature-gen, polynomial-interactions, target-encoding, tsfresh-features

## simulation/
agent-based-market, gbm, jump-diffusion (Merton), synthetic-data (block bootstrap)

## altdata/
job-postings, patent-filings, satellite-proxy, supply-chain

## altdata2/
github-activity, google-trends, reddit-sentiment, shipping-data

## microstructure/
dark-pool, order-book-imbalance, smart-money-flow, wyckoff

## execution/
liquidity-score, market-impact, optimal-execution, slippage

## portfolio/
black-litterman, circuit-breaker, correlation-filter, portfolio-var, risk-parity

## risk/
atr-targets, kelly-fractional, levels, regime-stop-loss, smart-risk, trailing-stop

## perf/ (infra)
ab-testing, feature-store (TTL cache), incremental-learning (online SGD), wasm-simd

## scan/ (orchestration helpers)
ab-testing, adaptive-learning, auto-active-learning, confidence-decay, dashboard.functions, drift-detection, historical-performance, investment.functions, online-learning, paper-trading, pattern-auto-disable, pattern-memory, portfolio-filter, rl-bandit, rule-gate, run-scan, scan.functions, track-record.functions, verifier

## market-data/
alphavantage, firecrawl, fundamentals, history, macro, market-index, news-credibility, news, synthetic, tradingview, yahoo

## data/
corporate-actions, earnings-calendar, economic-calendar, feature-cache, sector-mapping

## alerts/
alert-system

## backtest/
backfill, backtest, day-trade-strategy, engine, strategy, walk-forward

## Cron hooks (`src/routes/api/public/hooks/`)
daily-scan (Mon-Thu 14:30 Cairo), weekly-learning (Fri 22:00), fetch-fundamentals, fetch-macro, run-backtest, update-outcomes, walk-forward

## Integration Notes
- Most new modules are STANDALONE — NOT yet wired into `run-scan.server.ts` `finalConfidence`. Ask user explicitly which to integrate.
- Pending user requests: optional Telegram alerts (`TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID` not yet added).

## integration/ (NEW — orchestration)
pipeline-integrator (learnable weights combiner), module-health (auto-disable bad modules), signal-fusion (cross-group vector)

## deep/ (NEW — advanced neural)
memory-augmented-network (DNC-style), diffusion-prices (DDPM paths), mamba-ssm (state space), mixture-density (return distribution)

## signals/ (additions)
vpin (toxic flow), realized-volatility, volatility-term-structure, insider-transactions (Form 4), short-interest, analyst-revisions

## labs/ (NEW — training improvements)
curriculum-learning, time-series-augmentation (jitter/scale/warp/mixup), advanced-losses (focal/label-smooth/class-balanced), stochastic-weight-averaging (SWA)

## reliability/ (NEW)
ood-detection (Mahalanobis), backtest-bias-detection (look-ahead/survivor/snooping)

## audit/ (NEW)
decision-provenance (full decision audit trail)

## evolve/ (NEW — architecture search)
nas (Neural Architecture Search), hypernetwork (regime-conditioned weights), population-based (PBT), model-souping (greedy soup)

## causal/ (NEW — true causal inference)
do-calculus (back-door adjustment), synthetic-control (donor weighted mimic), propensity-matching (ATT)

## altdata3/ (NEW — premium alt data)
earnings-call-nlp (Lovable AI tone analysis), web-traffic (momentum), credit-card-spending (revenue nowcast), esg-momentum

## crowd/ (NEW — collective intelligence)
crowd-wisdom (accuracy-weighted aggregation), smart-money-13f (fund holdings deltas), dark-pool-prints, auction-imbalance (open/close)

## execution2/ (NEW — execution v2)
smart-order-routing, iceberg-detection, trade-cost-analysis (TCA), adaptive-sizing (Sharpe-based)

## security/ (NEW)
model-watermarking (fingerprint + backdoor trigger verification)
