/**
 * Options Flow Analysis: detect unusual options activity (smart money signal).
 */

export interface OptionTrade {
  type: "call" | "put";
  strike: number;
  volume: number;
  openInterest: number;
  premium: number;
  side: "buy" | "sell";
  isSweep?: boolean;
}

export interface OptionsFlowSignal {
  unusualScore: number;
  bullishness: number;
  largestTrade: OptionTrade | null;
  signal: "bullish" | "bearish" | "neutral";
  sweepCount: number;
}

export function analyzeOptionsFlow(trades: OptionTrade[]): OptionsFlowSignal {
  if (trades.length === 0) {
    return { unusualScore: 0, bullishness: 0, largestTrade: null, signal: "neutral", sweepCount: 0 };
  }

  let bullishPremium = 0;
  let bearishPremium = 0;
  let unusualScore = 0;
  let sweepCount = 0;
  let largestTrade: OptionTrade = trades[0];

  for (const t of trades) {
    const notional = t.volume * t.premium * 100;
    const ratio = t.openInterest > 0 ? t.volume / t.openInterest : 10;
    if (ratio > 2) unusualScore += Math.min(ratio, 10);
    if (t.isSweep) sweepCount++;

    const isBullish = (t.type === "call" && t.side === "buy") || (t.type === "put" && t.side === "sell");
    if (isBullish) bullishPremium += notional;
    else bearishPremium += notional;

    if (notional > largestTrade.volume * largestTrade.premium * 100) largestTrade = t;
  }

  const totalPremium = bullishPremium + bearishPremium;
  const bullishness = totalPremium === 0 ? 0.5 : bullishPremium / totalPremium;

  let signal: "bullish" | "bearish" | "neutral" = "neutral";
  if (bullishness > 0.65 && unusualScore > 5) signal = "bullish";
  else if (bullishness < 0.35 && unusualScore > 5) signal = "bearish";

  return { unusualScore, bullishness, largestTrade, signal, sweepCount };
}