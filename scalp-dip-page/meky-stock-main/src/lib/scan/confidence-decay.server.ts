/**
 * Confidence decay schedule.
 *
 * After a recommendation ages, its confidence number is no longer reliable
 * — the market has moved. We apply a deterministic decay so the UI shows
 * a more honest figure:
 *   - Days 0-2: no decay (fresh)
 *   - Day 3 onward: -5% per day, floored at 30%.
 */

export function applyConfidenceDecay(
  originalConfidence: number,
  createdAt: string | Date,
  now: Date = new Date(),
): { decayed: number; ageDays: number; decayApplied: number } {
  const created = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  const ageMs = now.getTime() - created.getTime();
  const ageDays = Math.max(0, Math.floor(ageMs / 86_400_000));
  if (ageDays <= 2) return { decayed: originalConfidence, ageDays, decayApplied: 0 };
  const days = ageDays - 2;
  const decayApplied = Math.min(originalConfidence - 30, days * 5);
  return {
    decayed: Math.max(30, originalConfidence - decayApplied),
    ageDays,
    decayApplied,
  };
}
