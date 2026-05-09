"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/v/bold-v1/Button";
import { Card } from "@/components/v/bold-v1/Card";
import { Input } from "@/components/v/bold-v1/Input";
import { FormGroup } from "@/components/v/bold-v1/FormGroup";

type LoginView = "checking" | "passphrase" | "email" | "sent";

export function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams?.get("next") ?? "/v/bold-v1/dashboard";

  const [view, setView] = useState<LoginView>("checking");
  const [passphrase, setPassphrase] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setView(user ? "passphrase" : "email");
      } catch {
        setView("email");
      }
    };
    check();
  }, []);

  const handlePassphraseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passphrase.trim()) return;
    sessionStorage.setItem('sb-pp-tmp', passphrase);
    setPassphrase("");
    router.replace(next as Route);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    setInfo("");

    try {
      const supabase = createClient();
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${baseUrl}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (authError) {
        setError(authError.message);
      } else {
        setView("sent");
        setInfo(`Link logowania wysłany na ${email.trim()}. Sprawdź skrzynkę.`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="bv1-login-page">
      <Card variant="paper-hero" className="bv1-login-card">
        <div className="bv1-login-brand">
          <Image
            src="/v/bold-v1/icons/tulip-glass.png"
            alt=""
            width={88}
            height={144}
            unoptimized
            priority
            style={{ width: 88, height: "auto" }}
          />
        </div>
        <div className="bv1-eyebrow" style={{ textAlign: "center", marginBottom: 8 }}>
          Magazine
        </div>
        <h1 className="bv1-login-title">Q2</h1>
        <p className="bv1-login-subtitle">Twój prywatny dziennik i coach.</p>

        {view === "checking" && (
          <p className="bv1-gate-text-muted" style={{ marginTop: 16, textAlign: "center" }}>
            Sprawdzam sesję…
          </p>
        )}

        {view === "passphrase" && (
          <>
            <form onSubmit={handlePassphraseSubmit} className="bv1-gate-form">
              <FormGroup label="Hasło szyfrowania">
                <Input
                  id="passphrase"
                  type="password"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="Twoje hasło"
                  autoFocus
                  autoComplete="current-password"
                />
              </FormGroup>
              {error && <p className="bv1-gate-error">{error}</p>}
              {info && !error && <p className="bv1-gate-info">{info}</p>}
              <Button type="submit" variant="primary" fullWidth disabled={!passphrase.trim()}>
                Zaloguj
              </Button>
            </form>
            <div className="bv1-login-secondary">
              <button
                type="button"
                className="bv1-login-link-btn"
                onClick={() => {
                  setView("email");
                  setError("");
                }}
              >
                Inne urządzenie? Wyślij link logowania
              </button>
            </div>
          </>
        )}

        {view === "email" && (
          <>
            <form onSubmit={handleEmailSubmit} className="bv1-gate-form">
              <p className="bv1-gate-text" style={{ marginBottom: 16 }}>
                Wyślemy link logowania na maila. Po kliknięciu wracasz tu i wpisujesz hasło szyfrowania.
              </p>
              <FormGroup label="Adres email">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoFocus
                  required
                />
              </FormGroup>
              {error && <p className="bv1-gate-error">{error}</p>}
              <Button type="submit" variant="primary" fullWidth disabled={loading || !email.trim()}>
                {loading ? "Wysyłanie…" : "Wyślij link logowania"}
              </Button>
            </form>
            <div className="bv1-login-secondary">
              <button
                type="button"
                className="bv1-login-link-btn"
                onClick={() => {
                  setView("passphrase");
                  setError("");
                }}
              >
                Mam już aktywną sesję — wpisz hasło
              </button>
            </div>
          </>
        )}

        {view === "sent" && (
          <div className="bv1-login-sent">
            <p className="bv1-gate-text">
              Sprawdź skrzynkę <strong>{email}</strong> — link logowania jest tam.
            </p>
            <p className="bv1-gate-text-muted" style={{ marginTop: 8 }}>
              Po kliknięciu linku wracasz tutaj i wpisujesz hasło.
            </p>
            <p className="bv1-gate-tip">
              <strong>Mobile (iOS):</strong> jeśli klikasz link w aplikacji Gmail/Mail i nie loguje się — przytrzymaj link →{" "}
              <em>„Open in Safari”</em>. Wewnętrzna przeglądarka ma osobne cookies i sesja się nie zachowuje.
            </p>
            <button
              type="button"
              className="bv1-login-link-btn"
              onClick={() => {
                setView("email");
                setEmail("");
                setInfo("");
              }}
              style={{ marginTop: 16 }}
            >
              Wróć
            </button>
          </div>
        )}
      </Card>
    </main>
  );
}
