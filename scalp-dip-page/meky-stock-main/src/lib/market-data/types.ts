export type Candle = {
  date: string; // ISO date
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type OHLCVResult = {
  symbol: string;
  candles: Candle[];
  provider: string;
};

export interface MarketDataProvider {
  name: string;
  fetchOHLCV(
    yahooSymbol: string,
    days: number,
    meta?: { investingSlug?: string | null },
  ): Promise<Candle[]>;
}