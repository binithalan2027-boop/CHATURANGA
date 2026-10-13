import { createClient } from "@supabase/supabase-js";
export const authConfigured = !!(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
);
export const supabase = createClient(
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
