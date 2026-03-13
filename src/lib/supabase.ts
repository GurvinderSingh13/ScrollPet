import { createClient } from "@supabase/supabase-js";

// We use "as string" and a fallback to stop the white screen crash
const supabaseUrl =
  (import.meta.env.VITE_SUPABASE_URL as string) ||
  "https://placeholder.supabase.co";
const supabaseAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || "placeholder";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
