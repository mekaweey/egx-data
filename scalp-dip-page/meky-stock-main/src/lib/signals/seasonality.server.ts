/**
 * Seasonality Detection: daily/monthly/yearly recurring patterns.
 */

export interface SeasonalityPattern {
  period: "daily" | "monthly" | "yearly";
  strongestPeriod: number;
  averageReturn: number;
  consistency: number; // 0-1, fraction of periods with same sign
  significance: number;
}

/**
 * Compute average return for each bucket of a given period length.
 */
function bucketReturns(returns: number[], periodLength: number): Map<number, number[]> {
  const buckets = new Map<number, number[]>();
  for (let i = 0; i < returns.length; i++) {
    const bucket = i % periodLength;
    if (!buckets.has(bucket)) buckets.set(bucket, []);
    buckets.get(bucket)!.push(returns[i]);
  }
  return buckets;
}

export function detectSeasonality(
  returns: number[],
  period: "daily" | "monthly" | "yearly",
): SeasonalityPattern {
  const periodLength = period === "daily" ? 5 : period === "monthly" ? 21 : 252;
  const buckets = bucketReturns(returns, periodLength);

  let strongestPeriod = 0;
  let strongestAvg = 0;
  let strongestConsistency = 0;

  for (const [bucket, vals] of buckets) {
    if (vals.length < 3) continue;
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    const sameSign = vals.filter((v) => Math.sign(v) === Math.sign(avg)).length;
    const consistency = sameSign / vals.length;
    if (Math.abs(avg) * consistency > Math.abs(strongestAvg) * strongestConsistency) {
      strongestPeriod = bucket;
      strongestAvg = avg;
      strongestConsistency = consistency;
    }
  }

  const totalMean = returns.reduce((a, b) => a + b, 0) / Math.max(returns.length, 1);
  const totalStd = Math.sqrt(returns.reduce((s, r) => s + (r - totalMean) ** 2, 0) / Math.max(returns.length, 1));
  const significance = totalStd === 0 ? 0 : Math.abs(strongestAvg - totalMean) / totalStd;

  return {
    period,
    strongestPeriod,
    averageReturn: strongestAvg,
    consistency: strongestConsistency,
    significance,
  };
}