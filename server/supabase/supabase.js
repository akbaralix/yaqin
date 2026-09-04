import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl =
  process.env.SUPABASE_URL || "https://kiwzebpbftpxmjzlrxzo.supabase.co";
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtpd3plYnBiZnRweG1qemxyeHpvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Njk4MzEzMiwiZXhwIjoyMTAyNTU5MTMyfQ.W3yCqroGI0dD3JPJW-B8HfjA9Aqj_jhRXp1b4mfA7gw";

// Resilient custom fetch wrapper with automatic retry on network glitches
const resilientFetch = async (url, options = {}, retries = 2, delayMs = 350) => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        // 10 soniyalik signal
        signal: options.signal || AbortSignal.timeout(10000),
      });
      return response;
    } catch (err) {
      const isLastAttempt = attempt === retries;
      if (isLastAttempt) {
        throw err;
      }
      // Kichik kutish va qayta urinish
      await new Promise((res) => setTimeout(res, delayMs * (attempt + 1)));
    }
  }
};

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  global: {
    fetch: resilientFetch,
  },
});
