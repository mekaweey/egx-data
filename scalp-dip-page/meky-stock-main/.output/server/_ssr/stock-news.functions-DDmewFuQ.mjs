import { c as createServerRpc } from "./createServerRpc-BEwYw6bn.mjs";
import { c as createServerFn } from "./server-BpMZvK1r.mjs";
import { supabaseAdmin } from "./client.server-D5ro3rAQ.mjs";
import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
import { o as object, b as string } from "../_libs/zod.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "node:http";
import "node:stream";
import "node:stream/promises";
import "node:https";
import "node:http2";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "../_libs/tanstack__react-router.mjs";
import "../_libs/react-dom.mjs";
import "util";
import "async_hooks";
import "stream";
import "crypto";
import "../_libs/isbot.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
const getStockNews_createServerFn_handler = createServerRpc({
  id: "297560c49847d61c20ab81a0ac45dfc844076edc29130e601211719a51a97462",
  name: "getStockNews",
  filename: "src/lib/news/stock-news.functions.ts"
}, (opts) => getStockNews.__executeServer(opts));
const getStockNews = createServerFn({
  method: "POST"
}).inputValidator((data) => object({
  symbol: string().min(1).max(20).regex(/^[A-Za-z0-9._-]+$/)
}).parse(data)).handler(getStockNews_createServerFn_handler, async ({
  data
}) => {
  const {
    data: rows,
    error
  } = await supabaseAdmin.from("news_sentiment").select("id, headline, summary_ar, source_url, source_name, published_at, sentiment, sentiment_score, impact_level").eq("symbol", data.symbol.toUpperCase()).order("published_at", {
    ascending: false,
    nullsFirst: false
  }).limit(10);
  if (error || !rows) return {
    items: [],
    avgScore: null,
    posCount: 0,
    negCount: 0,
    neuCount: 0
  };
  const items = rows.map((r) => ({
    id: r.id,
    headline: r.headline,
    summary_ar: r.summary_ar ?? null,
    source_url: r.source_url ?? null,
    source_name: r.source_name ?? null,
    published_at: r.published_at ?? null,
    sentiment: r.sentiment,
    sentiment_score: Number(r.sentiment_score ?? 0),
    impact_level: r.impact_level
  }));
  const avgScore = items.length ? items.reduce((a, b) => a + b.sentiment_score, 0) / items.length : null;
  return {
    items,
    avgScore,
    posCount: items.filter((i) => i.sentiment === "positive").length,
    negCount: items.filter((i) => i.sentiment === "negative").length,
    neuCount: items.filter((i) => i.sentiment === "neutral").length
  };
});
export {
  getStockNews_createServerFn_handler
};
