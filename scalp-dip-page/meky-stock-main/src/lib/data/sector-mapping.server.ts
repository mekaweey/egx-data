// Egyptian market sector mapping
export const EGYPT_SECTOR_MAP: Record<string, string> = {
  banking: 'Banking', finance: 'Banking',
  real_estate: 'Real Estate', construction: 'Real Estate',
  telecom: 'Telecommunications', communications: 'Telecommunications',
  food: 'Food & Beverage', beverage: 'Food & Beverage',
  industrial: 'Industrials', manufacturing: 'Industrials',
  energy: 'Energy', oil_gas: 'Energy', petroleum: 'Energy',
  healthcare: 'Healthcare', pharma: 'Healthcare',
  utilities: 'Utilities', power: 'Utilities',
  tech: 'Technology', it: 'Technology',
  materials: 'Materials', cement: 'Materials', steel: 'Materials',
  consumer: 'Consumer Goods', retail: 'Consumer Goods'
};

export function normalizeSector(raw: string | null | undefined): string {
  if (!raw) return 'Other';
  const lower = raw.toLowerCase();
  for (const [key, val] of Object.entries(EGYPT_SECTOR_MAP)) {
    if (lower.includes(key)) return val;
  }
  return raw;
}
