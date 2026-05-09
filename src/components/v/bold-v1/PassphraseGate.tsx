"use client";

import { useState, useEffect, type ReactNode } from "react";
import Image from "next/image";
import { useCryptoKey } from "@/context/CryptoKeyContext";
import { createClient } from "@/lib/supabase/client";
import {
  setupPassphrase,
  loginWithPassphrase,
  WrongPassphraseError,
} from "@/lib/auth/passphrase-flow";
import { Button } from "./Button";
import { Card } from "./Card";
import { Input } from "./Input";
import { FormGroup } from "./FormGroup";
import { ActionRow } from "./ActionRow";

type GateMode = "loading" | "db-not-ready" | "setup" | "setup-confirm" | "unlock" | "unlocked";

interface UserCryptoRow {
  salt: string;
  sentinel: string | null;
}

/**
 * bold-v1 PassphraseGate — Magazine cover styling.
 * Logika 1:1 z @/components/PassphraseGate (kopia, NIE wrapper) — żeby base
 * pozostal nietkniety jako inwariant.
 */
export function BoldV1PassphraseGate({ children }: { children: ReactNode }) {
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
        if (!user) return;

        setUserId(user.id);

        const { data, error: dbError } = await supabase
          .from("users")
          .select("salt, sentinel")
          .eq("id", user.id)
          .single<UserCryptoRow>();

        if (dbError) {
          if (dbError.code === "PGRST116" || dbError.message?.includes("no rows")) {
            setMode("setup");
          } else {
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

  // Auto-pickup hasla z window in-memory (po /v/bold-v1/login redirect).
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
          console.error("[BoldV1PassphraseGate] unexpected error", err);
          setError("Błąd techniczny. Sprawdź połączenie i odśwież stronę.");
        }
      })
      .finally(() => setLoading(false));
  }, [mode, userId, supabaseSalt, supabaseSentinel, passphrase, setKey, cooldownUntil]);

  if (key || mode === "unlocked") return <>{children}</>;

  // Wrapper — magazine cover layout (deep green bg, cream paper card centered, tulip hero)
  const Wrapper = ({ children: inner }: { children: ReactNode }) => (
    <div className="bv1-gate">
      <Card variant="paper-hero" className="bv1-gate-card">
        <div className="bv1-gate-brand">
          <Image
            src="/v/bold-v1/icons/tulip-glass.png"
            alt=""
            width={80}
            height={130}
            unoptimized
            priority
            style={{ width: 80, height: "auto" }}
          />
        </div>
        {inner}
      </Card>
    </div>
  );

  if (mode === "loading") {
    return (
      <Wrapper>
        <p className="bv1-gate-text-muted">Ładowanie…</p>
      </Wrapper>
    );
  }

  if (mode === "db-not-ready") {
    return (
      <Wrapper>
        <h2 className="bv1-gate-title">Baza danych nie gotowa</h2>
        <p className="bv1-gate-text">Uruchom migracje Supabase, aby korzystać z aplikacji:</p>
        <pre className="bv1-gate-code">supabase db push</pre>
        <p className="bv1-gate-text-muted" style={{ fontSize: 13 }}>
          Następnie dodaj klucz serwisowy do <code>.env.local</code> i odśwież stronę.
        </p>
      </Wrapper>
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
      <Wrapper>
        <h2 className="bv1-gate-title">Utwórz hasło szyfrowania</h2>
        <p className="bv1-gate-text">
          To hasło szyfruje Twój dziennik po stronie klienta — serwer nigdy go nie zobaczy.{" "}
          <strong>Zapamiętaj je dobrze.</strong>
        </p>
        <form onSubmit={handleSetup} className="bv1-gate-form">
          <FormGroup label="Hasło (min. 12 znaków)">
            <Input
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              autoFocus
              placeholder="Minimum 12 znaków"
            />
          </FormGroup>
          <FormGroup label="Potwierdź hasło">
            <Input
              type="password"
              value={passphraseConfirm}
              onChange={(e) => setPassphraseConfirm(e.target.value)}
              placeholder="Powtórz hasło"
            />
          </FormGroup>
          {error && <p className="bv1-gate-error">{error}</p>}
          <Button type="submit" variant="primary" fullWidth disabled={loading}>
            {loading ? "Konfigurowanie…" : "Utwórz hasło"}
          </Button>
        </form>
      </Wrapper>
    );
  }

  if (mode === "setup-confirm") {
    return (
      <Wrapper>
        <h2 className="bv1-gate-title">Zapisz frazę odzyskiwania</h2>
        <p className="bv1-gate-text">
          To Twoja jedyna kopia zapasowa. Jeśli zapomnisz hasła i nie będziesz mieć tej frazy,{" "}
          <strong>nie da się odszyfrować danych</strong>.
        </p>
        <div className="bv1-gate-mnemonic">{mnemonic}</div>
        <label className="bv1-gate-checkbox-label">
          <input
            type="checkbox"
            checked={mnemonicConfirmed}
            onChange={(e) => setMnemonicConfirmed(e.target.checked)}
          />
          <span>Zapisałem/am frazę w bezpiecznym miejscu</span>
        </label>
        <Button
          variant="primary"
          fullWidth
          disabled={!mnemonicConfirmed}
          onClick={() => setMode("unlocked")}
        >
          Przejdź do aplikacji
        </Button>
      </Wrapper>
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
          supabaseSentinel,
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
          console.error("[BoldV1PassphraseGate] unexpected error", err);
          setError("Błąd techniczny. Sprawdź połączenie i odśwież stronę.");
        }
      } finally {
        setLoading(false);
      }
    };

    return (
      <Wrapper>
        <h2 className="bv1-gate-title">Odblokuj dziennik</h2>
        <p className="bv1-gate-text">Podaj hasło szyfrowania, aby odszyfrować treści.</p>
        <form onSubmit={handleUnlock} className="bv1-gate-form">
          <FormGroup label="Hasło szyfrowania">
            <Input
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              autoFocus
              placeholder="Twoje hasło"
              disabled={cooldownRemaining > 0}
            />
          </FormGroup>
          {error && <p className="bv1-gate-error">{error}</p>}
          {cooldownRemaining > 0 && (
            <p className="bv1-gate-error">Cooldown: spróbuj za {cooldownRemaining}s.</p>
          )}
          <ActionRow>
            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={loading || !passphrase || cooldownRemaining > 0}
            >
              {loading ? "Odszyfrowywanie…" : "Odblokuj"}
            </Button>
          </ActionRow>
        </form>
      </Wrapper>
    );
  }

  return null;
}
