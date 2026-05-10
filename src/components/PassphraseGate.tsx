"use client";

import { useState, useEffect, type ReactNode } from "react";
import { useCryptoKey } from "@/context/CryptoKeyContext";
import { createClient } from "@/lib/supabase/client";
import { Brand } from "@/components/Brand";
import {
  setupPassphrase,
  loginWithPassphrase,
  WrongPassphraseError,
} from "@/lib/auth/passphrase-flow";
import { DEMO_MODE } from "@/lib/env";

type GateMode = "loading" | "db-not-ready" | "setup" | "setup-confirm" | "unlock" | "unlocked";

interface UserCryptoRow {
  salt: string;
  sentinel: string | null;
}

export function PassphraseGate({ children }: { children: ReactNode }) {
  const { key, setKey } = useCryptoKey();
  const [mode, setMode] = useState<GateMode>("loading");
  const [userId, setUserId] = useState<string | null>(null);
  const [supabaseSalt, setSupabaseSalt] = useState<string | null>(null);
  const [supabaseSentinel, setSupabaseSentinel] = useState<string | null>(null);
  const [passphrase, setPassphrase] = useState("");
  const [passphraseConfirm, setPassphraseConfirm] = useState("");
  const [mnemonic, setMnemonic] = useState("");
  const [mnemonicConfirmed, setMnemonicConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // Rate limit: 5 prób → 30s cooldown (chroni przed brute force po skradzeniu salt).
  const [failCount, setFailCount] = useState(0);
  const [cooldownUntil, setCooldownUntil] = useState<number>(0);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  useEffect(() => {
    if (cooldownUntil <= Date.now()) {
      setCooldownRemaining(0);
      return;
    }
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
      setCooldownRemaining(remaining);
      if (remaining === 0) setFailCount(0);
    };
    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [cooldownUntil]);

  useEffect(() => {
    if (key) {
      setMode("unlocked");
      return;
    }
    const init = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return; // middleware handles redirect

        setUserId(user.id);

        const { data, error: dbError } = await supabase
          .from("users")
          .select("salt, sentinel")
          .eq("id", user.id)
          .single<UserCryptoRow>();

        if (dbError) {
          if (
            dbError.code === "PGRST116" ||
            dbError.message?.includes("no rows")
          ) {
            // No user row yet → first-time setup
            setMode("setup");
          } else {
            // Table probably doesn't exist yet (supabase db push pending)
            setMode("db-not-ready");
          }
          return;
        }

        if (data?.salt) {
          setSupabaseSalt(data.salt);
          setSupabaseSentinel(data.sentinel ?? null);
          setMode("unlock");
        } else {
          setMode("setup");
        }
      } catch {
        setMode("db-not-ready");
      }
    };
    init();
  }, [key]);

  // In-memory zamiast sessionStorage — passphrase to klucz szyfrowania, nie wystawiać w devtools Storage.
  useEffect(() => {
    if (mode !== "unlock" || passphrase || !userId || !supabaseSalt) return;
    if (cooldownUntil > Date.now()) return;
    const pending = sessionStorage.getItem('sb-pp-tmp');
    if (!pending) return;
    sessionStorage.removeItem('sb-pp-tmp');
    setLoading(true);
    loginWithPassphrase(pending, userId, supabaseSalt, supabaseSentinel)
      .then(({ key: derivedKey }) => {
        setFailCount(0);
        setKey(derivedKey);
      })
      .catch((err) => {
        if (err instanceof WrongPassphraseError) {
          setFailCount((n) => {
            const next = n + 1;
            if (next >= 5) setCooldownUntil(Date.now() + 30_000);
            return next;
          });
          setError("Nieprawidłowe hasło. Spróbuj ponownie.");
        } else {
          // Inny błąd (salt fetch / IndexedDB / network) — nie liczy do brute force.
          console.error("[PassphraseGate] unexpected error", err);
          setError("Błąd techniczny. Sprawdź połączenie i odśwież stronę.");
        }
      })
      .finally(() => setLoading(false));
  }, [mode, userId, supabaseSalt, supabaseSentinel, passphrase, setKey, cooldownUntil]);

  // Demo mode: bypass auth gate entirely. Reviewers see protected content immediately.
  if (DEMO_MODE || key || mode === "unlocked") return <>{children}</>;

  if (mode === "loading") {
    return (
      <div className="passphrase-gate">
        <p className="text-muted">Ładowanie…</p>
      </div>
    );
  }

  if (mode === "db-not-ready") {
    return (
      <div className="passphrase-gate">
        <div className="passphrase-card">
          <div className="login-brand">
            <Brand size={72} showName={false} />
          </div>
          <h2 className="passphrase-title">Baza danych nie gotowa</h2>
          <p className="text-muted" style={{ marginTop: 12, lineHeight: 1.7 }}>
            Uruchom migracje Supabase, aby korzystać z aplikacji:
          </p>
          <pre className="passphrase-code">supabase db push</pre>
          <p className="text-muted" style={{ marginTop: 12, fontSize: 13 }}>
            Następnie dodaj klucz serwisowy do{" "}
            <code>.env.local</code> i odśwież stronę.
          </p>
        </div>
      </div>
    );
  }

  if (mode === "setup") {
    const handleSetup = async (e: React.FormEvent) => {
      e.preventDefault();
      if (passphrase.length < 12) {
        setError("Hasło musi mieć co najmniej 12 znaków.");
        return;
      }
      if (passphrase !== passphraseConfirm) {
        setError("Hasła nie są identyczne.");
        return;
      }
      if (!userId) return;
      setLoading(true);
      setError("");
      try {
        const result = await setupPassphrase(passphrase, userId);

        // Insert user crypto row via server-side Route Handler (RLS revokes
        // direct INSERT od authenticated — wymaga service_role server-side).
        const response = await fetch("/api/setup-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            salt: result.saltBase64,
            sentinel: result.sentinel,
            pbkdf2_params: { iterations: 600000, hash: "SHA-256", keyLength: 32 },
          }),
        });
        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? `Błąd konfiguracji (${response.status}).`);
        }

        setMnemonic(result.mnemonic);
        setKey(result.key);
        setMode("setup-confirm");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Błąd konfiguracji.");
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="passphrase-gate">
        <div className="passphrase-card">
          <div className="login-brand">
            <Brand size={72} showName={false} />
          </div>
          <h2 className="passphrase-title">Utwórz hasło szyfrowania</h2>
          <p className="text-muted" style={{ marginTop: 8, lineHeight: 1.7 }}>
            To hasło szyfruje Twój dziennik po stronie klienta — serwer nigdy
            go nie zobaczy. <strong>Zapamiętaj je dobrze.</strong>
          </p>
          <form onSubmit={handleSetup} className="passphrase-form">
            <label className="login-label">Hasło (min. 12 znaków)</label>
            <input
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              className="login-input"
              autoFocus
              placeholder="Minimum 12 znaków"
            />
            <label className="login-label" style={{ marginTop: 12 }}>
              Potwierdź hasło
            </label>
            <input
              type="password"
              value={passphraseConfirm}
              onChange={(e) => setPassphraseConfirm(e.target.value)}
              className="login-input"
              placeholder="Powtórz hasło"
            />
            {error && <p className="login-error">{error}</p>}
            <button
              type="submit"
              className="login-btn"
              style={{ marginTop: 16 }}
              disabled={loading}
            >
              {loading ? "Konfigurowanie…" : "Utwórz hasło"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (mode === "setup-confirm") {
    return (
      <div className="passphrase-gate">
        <div className="passphrase-card">
          <div className="login-brand">
            <Brand size={72} showName={false} />
          </div>
          <h2 className="passphrase-title">Zapisz frazę odzyskiwania</h2>
          <p className="text-muted" style={{ marginTop: 8, lineHeight: 1.7 }}>
            To Twoja jedyna kopia zapasowa. Jeśli zapomnisz hasła i nie będziesz
            mieć tej frazy, <strong>nie da się odszyfrować danych</strong>.
          </p>
          <div className="mnemonic-box">{mnemonic}</div>
          <label className="mnemonic-confirm-label">
            <input
              type="checkbox"
              checked={mnemonicConfirmed}
              onChange={(e) => setMnemonicConfirmed(e.target.checked)}
            />
            <span>Zapisałem/am frazę w bezpiecznym miejscu</span>
          </label>
          <button
            className="login-btn"
            disabled={!mnemonicConfirmed}
            onClick={() => setMode("unlocked")}
          >
            Przejdź do aplikacji
          </button>
        </div>
      </div>
    );
  }

  if (mode === "unlock") {
    const handleUnlock = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!userId || !supabaseSalt) return;
      if (cooldownUntil > Date.now()) return;
      setLoading(true);
      setError("");
      try {
        const result = await loginWithPassphrase(
          passphrase,
          userId,
          supabaseSalt,
          supabaseSentinel
        );
        setFailCount(0);
        setKey(result.key);
      } catch (err) {
        if (err instanceof WrongPassphraseError) {
          const next = failCount + 1;
          setFailCount(next);
          if (next >= 5) {
            setCooldownUntil(Date.now() + 30_000);
            setError("Za dużo nieudanych prób. Poczekaj 30 sekund.");
          } else {
            setError(`Nieprawidłowe hasło (${next}/5).`);
          }
        } else {
          console.error("[PassphraseGate] unexpected error", err);
          setError("Błąd techniczny. Sprawdź połączenie i odśwież stronę.");
        }
      } finally {
        setLoading(false);
      }
    };


    return (
      <div className="passphrase-gate">
        <div className="passphrase-card">
          <div className="login-brand">
            <Brand size={72} showName={false} />
          </div>
          <h2 className="passphrase-title">Odblokuj dziennik</h2>
          <p className="text-muted" style={{ marginTop: 8 }}>
            Podaj hasło szyfrowania, aby odszyfrować treści.
          </p>
          <form onSubmit={handleUnlock} className="passphrase-form">
            <label className="login-label" style={{ marginTop: 12 }}>
              Hasło szyfrowania
            </label>
            <input
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              className="login-input"
              autoFocus
              placeholder="Twoje hasło"
              disabled={cooldownRemaining > 0}
            />
            {error && <p className="login-error">{error}</p>}
            {cooldownRemaining > 0 && (
              <p className="login-error">
                Cooldown: spróbuj za {cooldownRemaining}s.
              </p>
            )}
            <button
              type="submit"
              className="login-btn"
              style={{ marginTop: 16 }}
              disabled={loading || !passphrase || cooldownRemaining > 0}
            >
              {loading ? "Odszyfrowywanie…" : "Odblokuj"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return null;
}
