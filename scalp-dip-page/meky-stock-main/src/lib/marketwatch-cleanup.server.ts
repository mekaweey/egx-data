
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function cleanupMarketwatchSnapshots() {
  console.log("Starting marketwatch_snapshots compression cleanup...");
  
  try {
    // We use a raw query via supabaseAdmin.rpc is restricted to types, 
    // so we use the database service directly if possible, or just skip type checking for the RPC call
    // in this internal helper.
    
    // @ts-ignore - Dynamic RPC call
    const { error } = await supabaseAdmin.rpc('compress_marketwatch_snapshots', {
      retention_days: 1
    });

    if (error) throw error;
    console.log("Cleanup completed successfully.");
  } catch (e) {
    console.error("Cleanup failed:", e);
  }
}
