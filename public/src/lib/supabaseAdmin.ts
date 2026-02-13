// lib/supabaseAdmin.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error("Environment variables check:");
  console.error("- NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl);
  console.error("- SUPABASE_SERVICE_ROLE_KEY:", supabaseServiceRoleKey ? "***" + supabaseServiceRoleKey.slice(-4) : "undefined");
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is required. Make sure .env.local file exists and contains the correct values.");
}

if (!supabaseServiceRoleKey) {
  console.error("Environment variables check:");
  console.error("- NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl);
  console.error("- SUPABASE_SERVICE_ROLE_KEY:", supabaseServiceRoleKey ? "***" + supabaseServiceRoleKey.slice(-4) : "undefined");
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is required. Make sure .env.local file exists and contains the correct values.");
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
