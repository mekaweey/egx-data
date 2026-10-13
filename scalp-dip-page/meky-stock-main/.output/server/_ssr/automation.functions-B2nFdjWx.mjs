import { c as createServerRpc } from "./createServerRpc-BEwYw6bn.mjs";
import { c as createServerFn } from "./server-BpMZvK1r.mjs";
import { supabaseAdmin } from "./client.server-D5ro3rAQ.mjs";
import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
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
const getAutomationSnapshot_createServerFn_handler = createServerRpc({
  id: "fc773513f959457af6a16f8f3f89985321c7d549186fb933e6350ee9313a6740",
  name: "getAutomationSnapshot",
  filename: "src/lib/automation/automation.functions.ts"
}, (opts) => getAutomationSnapshot.__executeServer(opts));
const getAutomationSnapshot = createServerFn({
  method: "GET"
}).handler(getAutomationSnapshot_createServerFn_handler, async () => {
  const [jobsRes, runsRes] = await Promise.all([supabaseAdmin.rpc("get_cron_jobs"), supabaseAdmin.rpc("get_cron_runs", {
    p_limit: 100
  })]);
  if (jobsRes.error) throw new Error(jobsRes.error.message);
  if (runsRes.error) throw new Error(runsRes.error.message);
  const jobs = jobsRes.data ?? [];
  const runs = runsRes.data ?? [];
  const dayAgo = Date.now() - 24 * 3600 * 1e3;
  const runs24 = runs.filter((r) => new Date(r.start_time).getTime() >= dayAgo);
  const failed24 = runs24.filter((r) => r.status !== "succeeded");
  return {
    jobs,
    runs,
    stats: {
      total_jobs: jobs.length,
      active_jobs: jobs.filter((j) => j.active).length,
      runs_24h: runs24.length,
      failed_24h: failed24.length,
      last_run_at: runs[0]?.start_time ?? null
    }
  };
});
export {
  getAutomationSnapshot_createServerFn_handler
};
