import { supabaseAdmin } from "./client.server-D5ro3rAQ.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
async function cleanupMarketwatchSnapshots() {
  console.log("Starting marketwatch_snapshots compression cleanup...");
  try {
    const { error } = await supabaseAdmin.rpc("compress_marketwatch_snapshots", {
      retention_days: 1
    });
    if (error) throw error;
    console.log("Cleanup completed successfully.");
  } catch (e) {
    console.error("Cleanup failed:", e);
  }
}
export {
  cleanupMarketwatchSnapshots
};
