import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";
import { DEMO_MODE } from "@/lib/env";
import { createMockClient } from "./mock-client";

export async function createClient() {
  if (DEMO_MODE) {
    // Return mock client typed as the real Supabase client. Cast is safe because
    // the mock implements the subset of the API actually used by this app.
    return createMockClient() as unknown as ReturnType<typeof createServerClient<Database>>;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Supabase env vars missing (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY). " +
      "Either set NEXT_PUBLIC_DEMO_MODE=true to run without backend, or configure Supabase per CUSTOMIZATION.md."
    );
  }

  const cookieStore = await cookies();
  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Component: cookies can't be set (read-only context)
        }
      },
    },
  });
}
