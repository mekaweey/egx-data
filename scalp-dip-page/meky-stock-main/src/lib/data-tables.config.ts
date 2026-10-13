/**
 * Single source of truth for all Supabase archive table metadata.
 *
 * Every module that iterates over the exportable tables — the browser UI table
 * selector, the backend `runExport` orchestration, and the local-file dry-run
 * writer — imports from this file instead of maintaining its own hard-coded
 * list. Adding or removing a table only requires editing this one file.
 */
export interface TableConfig {
  /** Column used for chronological ordering and date-range filtering. */
  timestampCol: string;
  /** Source-table column → unified CSV column mapping (omitted = not applicable). */
  priceCol?: string;
  volumeCol?: string;
  bidCol?: string;
  askCol?: string;
}

export const DATA_TABLES: Record<string, TableConfig> = {
  live_ticks: { timestampCol: "ts", priceCol: "price", volumeCol: "volume" },
  marketwatch_snapshots: {
    timestampCol: "captured_at",
    priceCol: "last_price",
    volumeCol: "total_volume",
    bidCol: "highest_bid",
    askCol: "lowest_ask",
  },
  orderbook_snapshots: {
    timestampCol: "ts",
    bidCol: "best_bid",
    askCol: "best_ask",
  },
  live_quotes: { timestampCol: "ts", bidCol: "bid", askCol: "ask" },
  smart_exit_log: { timestampCol: "ts", priceCol: "price" },
  thunder_auth_events: { timestampCol: "ts" },
  mubasher_news: { timestampCol: "published_at" },
};

/** Convenience: the ordered array of table names. */
export const DATA_TABLE_NAMES = Object.keys(DATA_TABLES);
