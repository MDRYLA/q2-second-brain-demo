"use client";

import { useState, useEffect, type ReactNode } from "react";
import { ShieldCheck } from "lucide-react";
import { useCryptoKey } from "@/context/CryptoKeyContext";
import { createClient } from "@/lib/supabase/client";
import {
  setupPassphrase,
  loginWithPassphrase,
  WrongPassphraseError,
} from "@/lib/auth/passphrase-flow";
import { DEMO_MODE } from "@/lib/env";
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

const pad3 = (n: number): string => String(n).padStart(3, "0");

function NumberedHeader({ number, label }: { number: number; label: string }) {
  return (
    <div className="cv2-gate-numbered-header">
      <span className="cv2-gate-num">{pad3(number)}</span>
      <h2 className="cv2-gate-title">{label}</h2>
    </div>
  );
}

/**
 * chrome-v2 PassphraseGate — Apple Vision styling.
 * Logika 1:1 z @/components/PassphraseGate (kopia, NIE wrapper).
 */
export function ChromeV2PassphraseGate({ children }: { children: ReactNode }) {
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
          console.error("[ChromeV2PassphraseGate] unexpected error", err);
          setError("Błąd techniczny. Sprawdź połączenie i odśwież stronę.");
        }
      })
      .finally(() => setLoading(false));
  }, [mode, userId, supabaseSalt, supabaseSentinel, passphrase, setKey, cooldownUntil]);

  // Demo mode: bypass auth gate entirely. Reviewers see protected content immediately.
  if (DEMO_MODE || key || mode === "unlocked") return <>{children}</>;

  const Wrapper = ({ number, label, children: inner }: { number: number; label: string; children: ReactNode }) => (
    <div className="cv2-gate">
      <Card variant="glass-hero" className="cv2-gate-card">
        <div className="cv2-gate-brand">
          <ShieldCheck size={48} strokeWidth={1.5} className="cv2-gate-brand-icon" />
        </div>
        <NumberedHeader number={number} label={label} />
        {inner}
      </Card>
    </div>
  );

  if (mode === "loading") {
    return (
      <Wrapper number={1} label="Ładowanie">
        <p className="cv2-gate-text-muted">Sprawdzam sesję…</p>
      </Wrapper>
    );
  }

  if (mode === "db-not-ready") {
    return (
      <Wrapper number={1} label="Baza danych nie gotowa">
        <p className="cv2-gate-text">Uruchom migracje Supabase, aby korzystać z aplikacji:</p>
        <pre className="cv2-gate-code">supabase db push</pre>
        <p className="cv2-gate-text-muted" style={{ fontSize: 13 }}>
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
      <Wrapper number={1} label="Utwórz hasło">
        <p className="cv2-gate-text">
          Hasło szyfruje Twój dziennik po stronie klienta — serwer nigdy go nie zobaczy.{" "}
          <strong>Zapamiętaj je dobrze.</strong>
        </p>
        <form onSubmit={handleSetup} className="cv2-gate-form">
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
          {error && <p className="cv2-gate-error">{error}</p>}
          <Button type="submit" variant="primary" fullWidth disabled={loading}>
            {loading ? "Konfigurowanie…" : "Utwórz hasło"}
          </Button>
        </form>
      </Wrapper>
    );
  }

  if (mode === "setup-confirm") {
    return (
      <Wrapper number={2} label="Zapisz frazę odzyskiwania">
        <p className="cv2-gate-text">
          To Twoja jedyna kopia zapasowa. Jeśli zapomnisz hasła i nie masz frazy,{" "}
          <strong>nie da się odszyfrować danych</strong>.
        </p>
        <div className="cv2-gate-mnemonic">{mnemonic}</div>
        <label className="cv2-gate-checkbox-label">
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
        const result = await loginWithPassphrase(passphrase, userId, supabaseSalt, supabaseSentinel);
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
          console.error("[ChromeV2PassphraseGate] unexpected error", err);
          setError("Błąd techniczny. Sprawdź połączenie i odśwież stronę.");
        }
      } finally {
        setLoading(false);
      }
    };

    return (
      <Wrapper number={1} label="Odblokuj dziennik">
        <p className="cv2-gate-text">Podaj hasło szyfrowania, aby odszyfrować treści.</p>
        <form onSubmit={handleUnlock} className="cv2-gate-form">
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
          {error && <p className="cv2-gate-error">{error}</p>}
          {cooldownRemaining > 0 && (
            <p className="cv2-gate-error">Cooldown: spróbuj za {cooldownRemaining}s.</p>
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
