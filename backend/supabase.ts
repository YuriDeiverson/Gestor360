import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please check your .env file.",
  );
}

// Cliente regular (usado para operações normais)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente administrativo - usar anônimo se service key não estiver disponível
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey && supabaseServiceKey.length > 50
    ? supabaseServiceKey
    : supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);
