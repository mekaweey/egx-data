/**
 * #14 Web Scraping للوظائف (interface قابلة للتمديد).
 */
export interface JobPostingSignal { count: number; growthPct: number; bullish: boolean }

export async function fetchJobPostings(_symbol: string): Promise<JobPostingSignal> {
  // Placeholder: في الإنتاج، نستدعي LinkedIn/Wuzzuf API.
  return { count: 0, growthPct: 0, bullish: false };
}

export function scoreJobGrowth(current: number, prev: number): JobPostingSignal {
  const growth = ((current - prev) / Math.max(prev, 1)) * 100;
  return { count: current, growthPct: growth, bullish: growth > 20 };
}