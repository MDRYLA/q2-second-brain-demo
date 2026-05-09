import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// First-time crypto setup: insert user row z saltem.
// RLS revokes INSERT on `users` od authenticated (002_rls.sql) — wymaga service_role.
// Endpoint weryfikuje sesję przez auth cookie, potem wykonuje insert jako admin
// dla user.id z tej sesji (zapobiega impersonation).

interface SetupPayload {
  salt: string;
  sentinel?: string;
  pbkdf2_params?: { iterations: number; hash: string; keylen?: number; keyLength?: number };
  bip39_hash?: string | null;
}

export async function POST(request: Request) {
  let payload: SetupPayload;
  try {
    payload = (await request.json()) as SetupPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!payload?.salt || typeof payload.salt !== "string") {
    return NextResponse.json({ error: "Missing salt." }, { status: 400 });
  }
  // Defensive: NIE pozwol na dowolnie dlugiego stringa w DB.
  if (payload.salt.length < 32 || payload.salt.length > 512) {
    return NextResponse.json({ error: "Invalid salt length." }, { status: 400 });
  }
  // Walidacja PBKDF2 iteracji — minimum 600k (OWASP 2026, hardcoded w kdf.ts).
  if (payload.pbkdf2_params && typeof payload.pbkdf2_params.iterations === "number" && payload.pbkdf2_params.iterations < 600000) {
    return NextResponse.json({ error: "Insufficient PBKDF2 iterations (min 600000)." }, { status: 400 });
  }

  // Verify caller's session via auth cookie.
  const supabase = await createServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Brak sesji użytkownika." }, { status: 401 });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceRoleKey || !supabaseUrl) {
    return NextResponse.json(
      { error: "Konfiguracja serwera niekompletna." },
      { status: 500 }
    );
  }

  const admin = createAdminClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const pbkdf2 = payload.pbkdf2_params ?? {
    iterations: 600000,
    hash: "SHA-256",
    keyLength: 32,
  };

  // PRIMARY KEY na users.id obsłuży idempotencję atomowo —
  // duplikat = 23505, mapujemy na 409 (klient powinien iść w tryb 'unlock').
  const { error: insertError } = await admin.from("users").insert({
    id: user.id,
    salt: payload.salt,
    sentinel: payload.sentinel ?? null,
    pbkdf2_params: pbkdf2,
    bip39_hash: payload.bip39_hash ?? null,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json(
        { error: "Konfiguracja już istnieje." },
        { status: 409 }
      );
    }
    console.error("[setup-user] insert error", insertError);
    return NextResponse.json({ error: "Błąd serwera. Spróbuj ponownie." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export function OPTIONS() {
  const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL ?? "";
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": allowedOrigin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}
