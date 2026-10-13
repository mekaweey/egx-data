import { c as createClient } from "../_libs/supabase__supabase-js.mjs";
function createSupabaseClient() {
  const SUPABASE_URL = "https://zeranlkxpioondyluzgl.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_exOZrSk6DDYyGzwKQ0J5eg_eyTpAT83";
  return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: typeof window !== "undefined" ? localStorage : void 0,
      persistSession: true,
      autoRefreshToken: true
    },
    // Connection pooling & realtime config to prevent pending WebSocket issues
    db: {
      schema: "public"
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    },
    global: {
      fetch: (url, options = {}) => {
        return fetch(url, {
          ...options,
          // Add timeout to prevent hanging connections
          signal: AbortSignal.timeout(15e3)
        });
      }
    }
  });
}
let _supabase;
const supabase = new Proxy({}, {
  get(_, prop, receiver) {
    if (!_supabase) _supabase = createSupabaseClient();
    return Reflect.get(_supabase, prop, receiver);
  }
});
export {
  supabase as s
};
