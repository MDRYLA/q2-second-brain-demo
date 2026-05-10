"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";
import { ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/v/chrome-v2/Button";
import { Card } from "@/components/v/chrome-v2/Card";
import { Input } from "@/components/v/chrome-v2/Input";
import { FormGroup } from "@/components/v/chrome-v2/FormGroup";

type LoginView = "checking" | "passphrase" | "email" | "sent";

const pad3 = (n: number): string => String(n).padStart(3, "0");

export function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Allow only same-origin internal paths — block //evil.com, https://evil.com, /\evil.com
  const rawNext = searchParams?.get("next") ?? "/v/chrome-v2/dashboard";
  const next =
    rawNext.startsWith("/") && !rawNext.startsWith("//") && !rawNext.startsWith("/\\")
      ? rawNext
      : "/v/chrome-v2/dashboard";

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
        setInfo(`Link logowania wysłany na ${email.trim()}.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const viewNumber = view === "passphrase" ? 1 : view === "email" ? 1 : view === "sent" ? 2 : 0;
  const viewLabel =
    view === "passphrase"
      ? "Hasło"
      : view === "email"
      ? "Email"
      : view === "sent"
      ? "Wysłano link"
      : "Sprawdzam";

  return (
    <main className="cv2-login-page">
      <Card variant="glass-hero" className="cv2-login-card">
        <div className="cv2-login-brand">
          <ShieldCheck size={56} strokeWidth={1.5} className="cv2-login-brand-icon" />
        </div>
        <div className="cv2-login-numbered-header">
          <span className="cv2-login-num">{pad3(viewNumber)}</span>
          <span className="cv2-login-meta">Q2 — {viewLabel}</span>
        </div>
        <h1 className="cv2-login-title">Welcome back.</h1>
        <p className="cv2-login-subtitle">Twój prywatny dziennik i coach.</p>

        {view === "checking" && (
          <p className="cv2-gate-text-muted" style={{ marginTop: 16, textAlign: "center" }}>
            Sprawdzam sesję…
          </p>
        )}

        {view === "passphrase" && (
          <>
            <form onSubmit={handlePassphraseSubmit} className="cv2-gate-form">
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
              {error && <p className="cv2-gate-error">{error}</p>}
              {info && !error && <p className="cv2-gate-info">{info}</p>}
              <Button type="submit" variant="primary" fullWidth disabled={!passphrase.trim()}>
                Zaloguj
              </Button>
            </form>
            <div className="cv2-login-secondary">
              <button
                type="button"
                className="cv2-login-link-btn"
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
            <form onSubmit={handleEmailSubmit} className="cv2-gate-form">
              <p className="cv2-gate-text" style={{ marginBottom: 16 }}>
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
              {error && <p className="cv2-gate-error">{error}</p>}
              <Button type="submit" variant="primary" fullWidth disabled={loading || !email.trim()}>
                {loading ? "Wysyłanie…" : "Wyślij link logowania"}
              </Button>
            </form>
            <div className="cv2-login-secondary">
              <button
                type="button"
                className="cv2-login-link-btn"
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
          <div className="cv2-login-sent">
            <p className="cv2-gate-text">
              Sprawdź skrzynkę <strong>{email}</strong> — link logowania jest tam.
            </p>
            <p className="cv2-gate-text-muted" style={{ marginTop: 8 }}>
              Po kliknięciu linku wracasz tutaj i wpisujesz hasło.
            </p>
            <p className="cv2-gate-tip">
              <strong>Mobile (iOS):</strong> jeśli klikasz link w aplikacji Gmail/Mail i nie loguje się — przytrzymaj link →{" "}
              <em>„Open in Safari”</em>.
            </p>
            <button
              type="button"
              className="cv2-login-link-btn"
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
