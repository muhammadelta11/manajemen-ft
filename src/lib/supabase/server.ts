import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { assertSupabaseEnv, SUPABASE_KEY, SUPABASE_URL } from "./env";

/** Client per-request dengan sesi login (Server Components & Server Actions). */
export async function createClient() {
  assertSupabaseEnv();
  const store = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll(list) {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Server Component tidak bisa menulis cookie; proxy yang memperbarui sesi.
        }
      },
    },
  });
}
