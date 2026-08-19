import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = "https://kiwzebpbftpxmjzlrxzo.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtpd3plYnBiZnRweG1qemxyeHpvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Njk4MzEzMiwiZXhwIjoyMTAyNTU5MTMyfQ.W3yCqroGI0dD3JPJW-B8HfjA9Aqj_jhRXp1b4mfA7gw";

export const supabase = createClient(supabaseUrl, supabaseKey);
