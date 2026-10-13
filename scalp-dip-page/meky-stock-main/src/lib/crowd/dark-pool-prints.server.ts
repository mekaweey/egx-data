/**
 * Dark Pool Print Detection — flag large prints occurring off-exchange.
 */
export interface DarkPrint {
  timestamp: string;
  price: number;
  size: number;
  avgDailyVolume: number;
}

export interface DarkPrintAlert {
  print: DarkPrint;
  significance: number; // size / ADV
  pricePremium: number; // relative to ref price
}

export function detectSignificantPrints(prints: DarkPrint[], referencePrice: number, minSizeRatio: number = 0.01): DarkPrintAlert[] {
  return prints
    .map((p) => ({
      print: p,
      significance: p.avgDailyVolume === 0 ? 0 : p.size / p.avgDailyVolume,
      pricePremium: (p.price - referencePrice) / referencePrice,
    }))
    .filter((a) => a.significance >= minSizeRatio)
    .sort((a, b) => b.significance - a.significance);
}