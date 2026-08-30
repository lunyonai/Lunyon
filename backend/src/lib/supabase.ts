import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";

/** Client with anon key — respects RLS */
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

/** Admin client — bypasses RLS (server only) */
export const supabaseAdmin = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);
