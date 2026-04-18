import { createClient } from "@supabase/supabase-js";

// Finding #08 — read from env vars; fall back to current values for local dev convenience.
// In production these MUST be set via .env.local (already gitignored).
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://jijcogmlrmiznurassuc.supabase.co";

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppamNvZ21scm1pem51cmFzc3VjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NzQ0MjAsImV4cCI6MjA5MjA1MDQyMH0.te0EdjcZomWd5z-IlzAsO1VYr2TvYlZmQY-jrHvroiY";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);