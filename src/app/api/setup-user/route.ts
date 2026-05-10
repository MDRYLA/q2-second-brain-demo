import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { DEMO_MODE } from "@/lib/env";

// First-time crypto setup: insert user row with salt.
// RLS revokes INSERT on `users` for authenticated (002_rls.sql) — requires service_role.
// Endpoint verifies session via auth cookie, then performs insert as admin
// for user.id from that session (prevents impersonation).

interface SetupPayload {
  salt: string;
  sentinel?: string;
  pbkdf2_params?: { iterations: number; hash: string; keylen?: number; keyLength?: number };
  bip39_hash?: string | null;
}

export async function POST(request: Request) {
  // Demo mode: no-op success — passphrase setup state lives in client memory only.
  if (DEMO_MODE) {
    return NextResponse.json({ ok: true, demo: true });
  }

  let payload: SetupPayload;
  try {
    payload = (await request.json()) as SetupPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!payload?.salt || typeof payload.salt !== "string") {
    return NextResponse.json({ error: "Missing salt." }, { status: 400 });
  }
  // Salt must be base64 of exactly 32 bytes (44 chars: 32/3*4 rounded + padding).
  if (!/^[A-Za-z0-9+/]{43}=$/.test(payload.salt)) {
    return NextResponse.json({ error: "Invalid salt format." }, { status: 400 });
  }
  // PBKDF2 params: full shape validation. Reject anything that doesn't match the
  // exact production parameters used by lib/crypto/kdf.ts.
  if (payload.pbkdf2_params) {
    const p = payload.pbkdf2_params;
    const keyLen = p.keyLength ?? p.keylen;
    if (
      typeof p.iterations !== "number" ||
      p.iterations < 600000 ||
      p.hash !== "SHA-256" ||
      keyLen !== 32
    ) {
      return NextResponse.json(
        { error: "Invalid PBKDF2 params (require: iterations>=600000, hash=SHA-256, keyLength=32)." },
        { status: 400 },
      );
    }
  }

  // Verify caller's session via auth cookie.
  const supabase = await createServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "No user session." }, { status: 401 });
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

export function OPTIONS(request: Request) {
  // Allowlist: configured app URL only. Origin must match exactly — no wildcards,
  // no empty fallback. Unknown origins get a no-CORS response (header omitted).
  const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL;
  const requestOrigin = request.headers.get("origin");
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
    "Cache-Control": "no-store",
  };
  if (allowedOrigin && requestOrigin === allowedOrigin) {
    headers["Access-Control-Allow-Origin"] = allowedOrigin;
  }
  return new NextResponse(null, { status: 204, headers });
}
