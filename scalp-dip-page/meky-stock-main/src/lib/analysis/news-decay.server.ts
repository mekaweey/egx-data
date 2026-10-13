/**
 * News Impact Decay.
 *
 * Older news is exponentially down-weighted: weight = exp(-age_hours / 48).
 * A 2-day-old headline counts ~37% of a fresh one; a week-old, ~3%.
 */

const HALF_LIFE_HOURS = 48;

export function newsDecayWeight(publishedAt: Date | string | null | undefined): number {
  if (!publishedAt) return 0.3;
  const t = typeof publishedAt === "string" ? new Date(publishedAt).getTime() : publishedAt.getTime();
  if (!isFinite(t)) return 0.3;
  const ageHours = Math.max(0, (Date.now() - t) / (1000 * 60 * 60));
  return Math.exp(-ageHours / HALF_LIFE_HOURS);
}

/**
 * Apply decay to an array of sentiment scores with timestamps,
 * returning a single time-weighted aggregate in [-1, +1].
 */
export function decayedSentiment(
  items: Array<{ score: number; published_at?: string | Date | null }>,
): { score: number; effectiveSamples: number } {
  if (items.length === 0) return { score: 0, effectiveSamples: 0 };
  let num = 0;
  let den = 0;
  for (const it of items) {
    const w = newsDecayWeight(it.published_at ?? null);
    num += it.score * w;
    den += w;
  }
  return {
    score: den === 0 ? 0 : +(num / den).toFixed(3),
    effectiveSamples: +den.toFixed(2),
  };
}