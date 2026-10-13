export type LiveTick = {
  symbol: string;
  price: number;
  volume?: number | null;
  source: "mubasher" | "investing" | "egx" | "ai-fallback";
  ts: string; // ISO
  meta?: Record<string, unknown>;
};

export type LiveScraper = {
  name: LiveTick["source"];
  fetchTick: (symbol: string, yahooSymbol: string, investingSlug?: string | null) => Promise<LiveTick>;
};