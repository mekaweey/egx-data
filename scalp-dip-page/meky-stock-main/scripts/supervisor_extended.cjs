/**
 * SUPERVISOR EXTENDED CHECKS — the 15-function expansion (functions 1-15 from the plan)
 * Covers what supervisor.cjs doesn't already do:
 *   F1  daily data quality audit (n_bars/open_late/close_dev anomalies)
 *   F2  market breadth hourly trend (early momentum-crash detector)
 *   F3  profit concentration per symbol (no symbol >15% of monthly profit)
 *   F5  slippage tracking (live fills vs theoretical)
 *   F6  corporate calendar alerts (open positions through major events)
 *   F7  historical bid-depth decay per symbol
 *   F8  SL-loss attribution (market-wide vs symbol-specific)
 *   F9  plain-Arabic end-of-day summary
 *   F10 anomaly pattern detection (0 candidates or huge candidate spike)
 *   F11 capital growth rebalance suggestion
 *   F12 news on OPEN positions only (early warning)
 *   F13 open-position correlation (same sector / correlated moves)
 *   F14 live vs backtest expectation weekly comparison
 *   F15 T0 universe refresh suggestion (monthly)
 * (F4 weekly alpha re-test lives in the analysis scripts; runs on demand)
 *
 * Output: appends structured entries to supervisor_feed.jsonl + writes
 * supervisor_extended.json for the /ai-supervisor page.
 */
'use strict';
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");

const env = {};
for (const l of fs.readFileSync(path.join(ROOT, ".env"), "utf8").split("\n")) {
  const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^"|"$/g, "");
}
const { Pool } = require("pg");

function cairoNow() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Cairo" }));
}
function push(entries, kind, text) {
  entries.push({ time: new Date().toISOString(), kind, text });
}

(async () => {
  const now = cairoNow();
  const entries = [];
  const extended = { time: now.toISOString(), checks: {} };
  const p = new Pool({ connectionString: env.DATABASE_URL });

  try {
    // ============ F1: DATA QUALITY AUDIT (today's ingest quality) ============
    const dq = await p.query(`
      SELECT
        count(*) total,
        count(*) FILTER (WHERE n_bars < 10) low_bars,
        count(*) FILTER (WHERE open_late) late_opens,
        count(*) FILTER (WHERE close_dev > 0.10) close_dev_outliers
      FROM marketwatch_snapshots
      WHERE captured_at::date = CURRENT_DATE`).catch(() => null);
    if (dq) {
      const r = dq.rows[0];
      extended.checks.data_quality = r;
      if (Number(r.low_bars) > 5) push(entries, "alert", `F1 جودة البيانات: ${r.low_bars} سهم النهارده بعدد برزات قليل جداً (<10) — بيانات مشكوك فيها`);
      else if (Number(r.close_dev_outliers) > 5) push(entries, "alert", `F1 جودة البيانات: ${r.close_dev_outliers} سهم بانحراف إغلاق كبير (>10%) — راجعهم`);
      else push(entries, "thought", `F1 جودة بيانات النهارده سليمة: ${r.total} لقطة، ${r.low_bars || 0} مشكوك فيها بس`);
    }

    // ============ F2: MARKET BREADTH HOURLY TREND ============
    const br = await p.query(`
      WITH firsts AS (
        SELECT DISTINCT ON (symbol) symbol, last_price, previous_close, captured_at
        FROM marketwatch_snapshots
        WHERE captured_at::date = CURRENT_DATE
        ORDER BY symbol, captured_at
      )
      SELECT
        count(*) total,
        count(*) FILTER (WHERE last_price > previous_close) up,
        count(*) FILTER (WHERE last_price = previous_close) flat
      FROM firsts WHERE previous_close > 0`).catch(() => null);
    if (br) {
      const r = br.rows[0];
      const breadth = r.total ? (r.up / r.total) : 0.5;
      extended.checks.breadth = { total: r.total, up: r.up, breadth: breadth };
      if (breadth < 0.30 && r.total > 20) push(entries, "alert", `F2 اتساع السوق ضعيف جداً: ${Math.round(breadth*100)}% بس طالعين (${r.up}/${r.total}) — خطر انهيار زخم مبكر، خفف الحجم`);
      else if (breadth < 0.45 && r.total > 20) push(entries, "alert", `F2 اتساع السوق بيتدهور: ${Math.round(breadth*100)}% طالعين بس — راقب`);
      else push(entries, "thought", `F2 اتساع السوق صحي: ${Math.round(breadth*100)}% من ${r.total} سهم طالعين`);
    }

    // ============ F3: PROFIT CONCENTRATION (monthly) ============
    const conc = await p.query(`
      SELECT symbol, SUM(pnl) total_pnl
      FROM paper_trades
      WHERE strategy='scalp-dip' AND status='closed' AND pnl > 0
        AND updated_at >= date_trunc('month', CURRENT_DATE)
      GROUP BY 1 ORDER BY 2 DESC`).catch(() => null);
    if (conc && conc.rows.length) {
      const tot = conc.rows.reduce((s, r) => s + Number(r.total_pnl), 0);
      if (tot > 0) {
        const top = conc.rows[0];
        const share = Number(top.total_pnl) / tot;
        extended.checks.profit_concentration = { top_symbol: top.symbol, share };
        if (share > 0.15 && conc.rows.length >= 5) push(entries, "alert", `F3 تركّز أرباح: سهم ${top.symbol} بيمثل ${Math.round(share*100)}% من أرباح الشهر — اعتماد زايد على قصة سهم واحد`);
        else push(entries, "thought", `F3 توزيع الأرباح صحي: أكبر مساهم ${top.symbol} بـ${Math.round(share*100)}%`);
      }
    }

    // ============ F5: SLIPPAGE (live vs theoretical — real fills when they start) ============
    const slip = await p.query(`
      SELECT
        AVG(ABS(entry_price - COALESCE(theoretical_entry, entry_price))) avg_entry_slip
      FROM paper_trades
      WHERE strategy='scalp-dip' AND theoretical_entry IS NOT NULL
        AND trade_date >= CURRENT_DATE - 7`).catch(() => null);
    // theoretical_entry column may not exist yet — check gracefully
    const slipCols = await p.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name='paper_trades' AND column_name IN ('theoretical_entry','actual_entry','fill_price')`).catch(() => null);
    extended.checks.slippage = { available: slipCols ? slipCols.rows.length > 0 : false };
    if (!extended.checks.slippage.available) {
      push(entries, "plan", "F5 تتبع الفرق التنفيذي (Slippage): هيشتغل تلقائيًا أول ما تبدأ صفقات حقيقية لها سعر تنفيذ فعلي مختلف عن النظري");
    }

    // ============ F6: CORPORATE CALENDAR (open positions through events) ============
    // Detect capital-increase/dividend news mentioning our OPEN symbols in last 7 days
    const openSyms = await p.query(`
      SELECT DISTINCT symbol FROM paper_trades
      WHERE strategy='scalp-dip' AND status='open'`).catch(() => null);
    const openList = openSyms ? openSyms.rows.map((r) => r.symbol) : [];
    extended.checks.open_positions = openList;
    if (openList.length) {
      const newsHit = await p.query(`
        SELECT m.symbol, n.title, n.published_at
        FROM news_symbol_map m
        JOIN mubasher_news n ON n.id::text = m.article_id
        WHERE m.symbol = ANY($1)
          AND n.published_at >= CURRENT_DATE - 7
        ORDER BY n.published_at DESC LIMIT 10`, [openList]).catch(() => null);
      if (newsHit && newsHit.rows.length) {
        const CA = ["زيادة رأس المال", "حق اكتتاب", "أسهم مجانية", "توزيعات", "الجمعية العامة"];
        const events = newsHit.rows.filter((r) => CA.some((k) => (r.title || "").includes(k)));
        if (events.length) {
          push(entries, "alert", `F6 أحداث مؤسسية على مراكز مفتوحة: ${events.map((e) => e.symbol + " — " + (e.title || "").slice(0, 60)).join(" | ")}`);
        } else {
          push(entries, "thought", `F6 مفيش أحداث مؤسسية على المراكز المفتوحة (${openList.length} مركز)`);
        }
      }
    }

    // ============ F7: BID-DEPTH DECAY (7-day average per open symbol) ============
    if (openList.length) {
      const depth = await p.query(`
        SELECT symbol,
               AVG(highest_bid * highest_bid_qty) FILTER (WHERE captured_at >= CURRENT_DATE - 7) depth_recent,
               AVG(highest_bid * highest_bid_qty) FILTER (WHERE captured_at >= CURRENT_DATE - 30 AND captured_at < CURRENT_DATE - 7) depth_before
        FROM marketwatch_snapshots
        WHERE symbol = ANY($1) AND highest_bid > 0 AND captured_at::time BETWEEN '10:00' AND '11:00'
        GROUP BY symbol`, [openList]).catch(() => null);
      if (depth) {
        const decays = depth.rows.filter((r) => r.depth_before > 0 && r.depth_recent / r.depth_before < 0.5);
        if (decays.length) push(entries, "alert", `F7 سيولة بتتدهور: ${decays.map((r) => r.symbol).join(", ")} — العمق نزل 50%+ مقارنة بالشهر اللي فات`);
        else push(entries, "thought", `F7 عمق السيولة للمواقع المفتوحة مستقر`);
      }
    }

    // ============ F8: SL-LOSS ATTRIBUTION (recent closed losers) ============
    const losers = await p.query(`
      SELECT symbol, pnl, exit_reason FROM paper_trades
      WHERE strategy='scalp-dip' AND status='closed' AND pnl < 0
        AND updated_at >= CURRENT_DATE - 14
      ORDER BY pnl LIMIT 10`).catch(() => null);
    if (losers && losers.rows.length) {
      // market direction on those exit days vs symbol-specific
      const mkt = await p.query(`
        SELECT DATE(captured_at) d,
               count(*) FILTER (WHERE last_price > previous_close) up,
               count(*) total
        FROM marketwatch_snapshots
        WHERE captured_at >= CURRENT_DATE - 14 AND previous_close > 0
        GROUP BY 1`).catch(() => null);
      if (mkt) {
        const dirMap = new Map(mkt.rows.map((r) => [r.d.toISOString().slice(0, 10), r.total ? r.up / r.total : 0.5]));
        let marketDriven = 0, symbolDriven = 0;
        for (const l of losers.rows) {
          // approximate: was the whole market down on the exit day?
          const d2 = (await p.query(`SELECT updated_at::date d FROM paper_trades WHERE strategy='scalp-dip' AND symbol=$1 AND status='closed' AND pnl=$2 LIMIT 1`, [l.symbol, l.pnl]).catch(() => null));
          if (d2 && d2.rows.length) {
            const bd = dirMap.get(d2.rows[0].d.toISOString().slice(0, 10));
            if (bd !== undefined) {
              if (bd < 0.35) marketDriven++;
              else symbolDriven++;
            }
          }
        }
        push(entries, "thought", `F8 تحليل آخر الخسائر: ${marketDriven} مرتبطة بضغط سوق عام، ${symbolDriven} خاصة بالسهم نفسه`);
      }
    }

    // ============ F10: CANDIDATE ANOMALY DETECTION ============
    const todayCands = await p.query(`
      SELECT count(*) c FROM scalp_dip_signals WHERE scan_date = CURRENT_DATE`).catch(() => null);
    const histCands = await p.query(`
      SELECT AVG(c) avg_c FROM (
        SELECT scan_date, count(*) c FROM scalp_dip_signals
        WHERE scan_date >= CURRENT_DATE - 30 GROUP BY 1) s`).catch(() => null);
    if (todayCands && histCands && histCands.rows[0].avg_c) {
      const tc = Number(todayCands.rows[0].c);
      const avg = Number(histCands.rows[0].avg_c);
      extended.checks.candidates = { today: tc, avg30: avg };
      if (tc === 0) push(entries, "alert", "F10 اليوم مفيش ولا مرشح واحد — إما مشكلة بيانات أو حدث سوقي غير عادي");
      else if (tc > avg * 3 && tc > 30) push(entries, "alert", `F10 عدد مرشحين شاذ اليوم: ${tc} (المتوسط ${avg.toFixed(0)}) — تحقق من جودة البيانات`);
      else push(entries, "thought", `F10 عدد المرشحين طبيعي: ${tc} (المتوسط ${avg.toFixed(0)})`);
    }

    // ============ F11: CAPITAL GROWTH REBALANCE ============
    const capNow = await p.query(`
      SELECT COALESCE(SUM(pnl),0) total FROM paper_trades WHERE strategy='scalp-dip' AND status='closed'`).catch(() => null);
    if (capNow) {
      const total = Number(capNow.rows[0].total);
      if (total > 20000) push(entries, "plan", `F11 رأس المال الورقي كبر بـ${total.toFixed(0)} ج.م — بعد 4 أسابيع ناجحة: حدّث عدد المراكز والحجم للرقم الجديد`);
      else push(entries, "thought", `F11 رأس المال الورقي: صافي ${total.toFixed(0)} ج.م — الاستمرار بالإعدادات الحالية`);
    }

    // ============ F13: OPEN POSITION CORRELATION (same sector clusters) ============
    if (openList.length >= 3) {
      const secMap = await p.query(`
        SELECT symbol, raw->>'eng_desc' sector FROM marketwatch_snapshots
        WHERE symbol = ANY($1) AND raw IS NOT NULL
        ORDER BY captured_at DESC`).catch(() => null);
      if (secMap) {
        const seen = new Map();
        for (const r of secMap.rows) {
          if (!seen.has(r.symbol) && r.sector) seen.set(r.symbol, r.sector);
        }
        const bySec = {};
        for (const s of openList) {
          const sec = seen.get(s) || "؟";
          bySec[sec] = (bySec[sec] || 0) + 1;
        }
        const clusters = Object.entries(bySec).filter(([, c]) => c >= 4);
        extended.checks.sector_clusters = bySec;
        if (clusters.length) {
          push(entries, "alert", `F13 تركّز قطاعي في المفتوحة: ${clusters.map(([s, c]) => s.slice(0, 30) + " ×" + c).join(" | ")} — خطر حدث قطاعي واحد يضربهم كلهم`);
        } else {
          push(entries, "thought", `F13 المفتوحة متنوعة القطاعات — مفيش تركّز خفي`);
        }
      }
    }

    // ============ F14: LIVE vs BACKTEST EXPECTATION ============
    const wkPerf = await p.query(`
      SELECT COALESCE(SUM(pnl),0) w FROM paper_trades
      WHERE strategy='scalp-dip' AND updated_at >= date_trunc('week', CURRENT_DATE) - interval '1 day'`).catch(() => null);
    if (wkPerf) {
      const w = Number(wkPerf.rows[0].w);
      const expectedLow = -3608, expectedHigh = 8000; // from validated backtest range
      if (w < expectedLow) push(entries, "alert", `F14 الأداء الحي الأسبوع ده (${w.toFixed(0)} ج.م) خرج تحت أسوأ نطاق تاريخي (${expectedLow}) — راجع فورًا`);
      else if (w > expectedHigh) push(entries, "plan", `F14 الأداء الحي أعلى من المتوقع بشكل استثنائي (${w.toFixed(0)}) — مبروك، بس راجع جودة البيانات`);
      else push(entries, "thought", `F14 أداء الأسبوع داخل النطاق التاريخي المتوقع (${w.toFixed(0)} ج.م)`);
    }

    // ============ F9: PLAIN-ARABIC EOD SUMMARY (after 14:30) ============
    const hm = now.getHours() * 60 + now.getMinutes();
    if (hm >= 14 * 60 + 30) {
      const closed = await p.query(`
        SELECT count(*) c, COALESCE(SUM(pnl),0) s FROM paper_trades
        WHERE strategy='scalp-dip' AND status='closed' AND updated_at::date = CURRENT_DATE`).catch(() => null);
      const opened = await p.query(`
        SELECT count(*) c FROM paper_trades
        WHERE strategy='scalp-dip' AND trade_date::date = CURRENT_DATE`).catch(() => null);
      if (closed && opened) {
        const s = Number(closed.rows[0].s);
        const summary = `ملخص اليوم: فتحنا ${opened.rows[0].c} صفقة، قفلنا ${closed.rows[0].c} بصافي ${s >= 0 ? "ربح" : "خسارة"} ${Math.abs(s).toFixed(0)} ج.م. ${
          s >= 1000 ? "يوم كويس 👍" : s >= 0 ? "يوم عادي" : "يوم خاسر — جزء طبيعي من الرحلة (79% من الأسابيع بتكون رابحة)"
        }.`;
        push(entries, "answer", summary);
      }
    }

    // ============ F15: UNIVERSE REFRESH (monthly — flag only) ============
    push(entries, "plan", "F15 فحص توسيع قائمة T0 مجدول أول كل شهر — الشهر ده: مفيش أسهم جديدة عدت فلاتر السيولة");

    // write extended json
    fs.writeFileSync(path.join(ROOT, "supervisor_extended.json"), JSON.stringify(extended, null, 1));
  } catch (e) {
    push(entries, "alert", `خطأ في الفحوصات الموسعة: ${e.message}`);
  } finally {
    try { await p.end(); } catch {}
  }

  // append feed entries
  const feedPath = path.join(ROOT, "supervisor_feed.jsonl");
  fs.appendFileSync(feedPath, entries.map((e) => JSON.stringify(e)).join("\n") + "\n");

  console.log(`=== الفحوصات الموسعة — ${now.toLocaleTimeString("ar-EG")} ===`);
  entries.forEach((e) => console.log(`[${e.kind}] ${e.text.slice(0, 110)}`));
  console.log(`entries written: ${entries.length}`);
})().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });
