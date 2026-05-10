import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";
import { DEMO_MODE } from "@/lib/env";
import { createMockClient } from "./mock-client";

export function createClient() {
  if (DEMO_MODE) {
    return createMockClient() as unknown as ReturnType<typeof createBrowserClient<Database>>;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Supabase env vars missing (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY). " +
      "Either set NEXT_PUBLIC_DEMO_MODE=true to run without backend, or configure Supabase per CUSTOMIZATION.md."
    );
  }

  return createBrowserClient<Database>(url, anonKey);
}
