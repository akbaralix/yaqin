import { createClient } from "@supabase/supabase-js";
 
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://kiwzebpbftpxmjzlrxzo.supabase.co";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "sb_publishable_SUguTwt-uxKFy-IAW9ORtg_mTPkrXw-";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
