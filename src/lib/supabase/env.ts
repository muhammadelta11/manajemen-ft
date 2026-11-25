function normalizeUrl(raw: string) {
  return raw.trim().replace(/\/rest\/v1\/?$/i, "").replace(/\/+$/, "");
}

export const SUPABASE_URL = normalizeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");

export const SUPABASE_KEY = (
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  ""
).trim();

export const supabaseReady = Boolean(SUPABASE_URL && SUPABASE_KEY);

export function assertSupabaseEnv() {
  if (supabaseReady) return;
  throw new Error(
    "Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (Publishable key) di .env.local, lalu restart npm run dev.",
  );
}
