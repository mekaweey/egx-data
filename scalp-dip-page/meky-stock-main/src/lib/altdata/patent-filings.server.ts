/**
 * #15 Patent Filings: مؤشر نمو مستقبلي.
 */
export interface PatentSignal { recentFilings: number; growthScore: number }

export function scorePatents(filingsByYear: number[]): PatentSignal {
  if (filingsByYear.length < 2) return { recentFilings: filingsByYear[0] ?? 0, growthScore: 0 };
  const recent = filingsByYear[filingsByYear.length - 1];
  const prev = filingsByYear[filingsByYear.length - 2];
  const growth = ((recent - prev) / Math.max(prev, 1)) * 100;
  return { recentFilings: recent, growthScore: Math.max(0, Math.min(100, 50 + growth)) };
}