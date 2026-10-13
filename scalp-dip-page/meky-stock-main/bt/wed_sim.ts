import * as fs from "node:fs";
for (const l of fs.readFileSync("D:/meky-stock-main/meky-stock-main/.env", "utf8").split("\n")) {
  const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/"/g, "");
}
import {
  scanWeeklyCandidates,
  formatTelegramPreviewLine,
} from "@/lib/scalp-dip/momentum-weekly.server";

async function main() {
  // READ-ONLY: scanWeeklyCandidates only SELECTs (no persist/fill/exit here).
  const st = await scanWeeklyCandidates({ dryRun: true });
  console.log("STATUS=" + st.status + " signal=" + st.signalDate + " entry=" + st.entryDate + " exit=" + st.exitDate);
  console.log("REGIME on=" + st.regimeOn + " cum10=" + st.regimeCum10 + " def=" + st.regimeDef);
  console.log("SELECTED=" + JSON.stringify(st.selected.map((c: any) => c.symbol)));
  for (const c of st.selected as any[]) {
    console.log(formatTelegramPreviewLine({
      symbol: c.symbol, mom5: c.mom5, momSessions: c.mom_sessions ?? "?/6",
      liqSessions: c.liq_sessions ?? "?/20", v20: c.v20_money,
      signalClose: c.last_close, verdict: "مقبول",
    }));
  }
  console.log("REJECTS=" + (st.rejectReasons ?? []).length);
  process.exit(0);
}
main().catch((e) => { console.error("SIM_FAIL " + e.message); process.exit(1); });
