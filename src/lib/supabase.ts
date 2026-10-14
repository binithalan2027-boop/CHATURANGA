import type { SupabaseClient } from "@supabase/supabase-js";

/** True when this deployment configured Supabase auth; local builds skip it. */
export const authConfigured = !!(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
);

let client: SupabaseClient | null = null;

/**
 * The Supabase JS bundle is heavy, so it loads on first auth use instead of
 * with the landing page. Local-mode builds never call this.
 */
export async function getSupabase(): Promise<SupabaseClient> {
  if (!client) {
    const { createClient } = await import("@supabase/supabase-js");
    client = createClient(
      import.meta.env.VITE_SUPABASE_URL || "http://127.0.0.1:54321",
      import.meta.env.VITE_SUPABASE_ANON_KEY || "local-unconfigured-placeholder",
      {
        auth: {
          persistSession: authConfigured,
          autoRefreshToken: authConfigured,
          detectSessionInUrl: authConfigured,
        },
      },
    );
  }
  return client;
}
