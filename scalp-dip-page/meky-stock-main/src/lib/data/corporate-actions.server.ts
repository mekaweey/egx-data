// Adjust historical prices for dividends and splits
export type Candle = { date: string; open: number; high: number; low: number; close: number; volume: number };
export type CorporateAction = { date: string; type: 'split' | 'dividend'; ratio?: number; amountPerShare?: number };

export function adjustForCorporateActions(candles: Candle[], actions: CorporateAction[]): Candle[] {
  if (actions.length === 0) return candles;
  const sorted = [...actions].sort((a, b) => b.date.localeCompare(a.date));
  const adjusted = candles.map(c => ({ ...c }));
  for (const action of sorted) {
    const idx = adjusted.findIndex(c => c.date >= action.date);
    if (idx < 0) continue;
    for (let i = 0; i < idx; i++) {
      if (action.type === 'split' && action.ratio) {
        adjusted[i].open /= action.ratio;
        adjusted[i].high /= action.ratio;
        adjusted[i].low /= action.ratio;
        adjusted[i].close /= action.ratio;
        adjusted[i].volume = Math.round(adjusted[i].volume * action.ratio);
      } else if (action.type === 'dividend' && action.amountPerShare) {
        const factor = (adjusted[i].close - action.amountPerShare) / adjusted[i].close;
        adjusted[i].open *= factor;
        adjusted[i].high *= factor;
        adjusted[i].low *= factor;
        adjusted[i].close *= factor;
      }
    }
  }
  return adjusted;
}
