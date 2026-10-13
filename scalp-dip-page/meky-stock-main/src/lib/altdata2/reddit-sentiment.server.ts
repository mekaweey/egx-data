/**
 * Reddit / r/wallstreetbets sentiment tracking.
 */

export interface RedditMention {
  text: string;
  upvotes: number;
  comments: number;
  timestamp: number;
}

export interface RedditSignal {
  mentionCount: number;
  weightedSentiment: number; // -1 to +1
  bullishness: number;
  trendingScore: number;
  signal: "wsb_pump" | "bullish_chatter" | "neutral" | "bearish_chatter";
}

const BULLISH_WORDS = ["moon", "rocket", "🚀", "calls", "buy", "long", "yolo", "tendies", "diamond", "hold"];
const BEARISH_WORDS = ["puts", "short", "crash", "dump", "rug", "bear", "sell", "💩"];

function scoreText(text: string): number {
  const t = text.toLowerCase();
  let bull = 0;
  let bear = 0;
  for (const w of BULLISH_WORDS) if (t.includes(w)) bull++;
  for (const w of BEARISH_WORDS) if (t.includes(w)) bear++;
  const total = bull + bear;
  return total === 0 ? 0 : (bull - bear) / total;
}

export function analyzeReddit(mentions: RedditMention[], baselineCount: number = 10): RedditSignal {
  if (mentions.length === 0) {
    return { mentionCount: 0, weightedSentiment: 0, bullishness: 0.5, trendingScore: 0, signal: "neutral" };
  }

  let totalWeight = 0;
  let weightedSum = 0;
  let bullishWeight = 0;
  let bearishWeight = 0;

  for (const m of mentions) {
    const weight = Math.log1p(m.upvotes) + Math.log1p(m.comments);
    const sentiment = scoreText(m.text);
    weightedSum += sentiment * weight;
    totalWeight += weight;
    if (sentiment > 0) bullishWeight += weight;
    else if (sentiment < 0) bearishWeight += weight;
  }

  const weightedSentiment = totalWeight === 0 ? 0 : weightedSum / totalWeight;
  const bullishness = bullishWeight + bearishWeight === 0 ? 0.5 : bullishWeight / (bullishWeight + bearishWeight);
  const trendingScore = mentions.length / Math.max(baselineCount, 1);

  let signal: RedditSignal["signal"] = "neutral";
  if (trendingScore > 5 && weightedSentiment > 0.3) signal = "wsb_pump";
  else if (weightedSentiment > 0.2) signal = "bullish_chatter";
  else if (weightedSentiment < -0.2) signal = "bearish_chatter";

  return { mentionCount: mentions.length, weightedSentiment, bullishness, trendingScore, signal };
}