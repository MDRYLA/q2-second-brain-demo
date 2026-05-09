"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Brand } from "@/components/Brand";

/**
 * Login flow:
 *  - Na mount: getUser() → user ? "passphrase" : "email"
 *  - "passphrase" → klik "Inne urządzenie?" → "email"
 *  - "email" → klik "Mam już aktywną sesję" → "passphrase"
 *  - "email" → submit OTP → "sent"
 *  - "sent" → klik "Wróć" → "email"
 *  - Klik magic linka → /auth/callback → / → PassphraseGate (nie wraca tu).
 *  - Passphrase trzymane w sessionStorage "sb-pp-tmp" (Faza 7 hardening IMP-5).
 *    Per-tab isolation, czyszczone od razu po unlock w PassphraseGate.
 *    Wczesniej window.__sbPendingPassphrase — zmienione bo XSS via CSP unsafe-inline mial
 *    rownie szeroki dostep do window.* jak do sessionStorage; sessionStorage da sie czyscic
 *    explicite (removeItem) i jest izolowany per-tab.
 */
type LoginView = "checking" | "passphrase" | "email" | "sent";

export default function LoginPage() {
  const router = useRouter();
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
    // Sesję weryfikuje middleware na "/" — gdy wygasła, przekieruje z powrotem do /login.
    sessionStorage.setItem('sb-pp-tmp', passphrase);
    setPassphrase("");
    router.replace("/");
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    setInfo("");

    try {
      const supabase = createClient();
      // emailRedirectTo MUSI być stable URL — Vercel preview deploy ma random hash
      // (second-brain-c7f0h23jd-...vercel.app), magic link wysłany z URL A nie działa
      // gdy user klika z mobile po deploy URL B. NEXT_PUBLIC_APP_URL = canonical
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${baseUrl}/auth/callback`,
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
    <main className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <Brand size={72} showName={false} />
        </div>
        <h1 className="login-title">Q2</h1>
        <p className="login-subtitle">Twój prywatny dziennik i coach.</p>

        {view === "checking" && (
          <p className="text-muted" style={{ marginTop: 16 }}>Sprawdzam sesję…</p>
        )}

        {view === "passphrase" && (
          <>
            <form onSubmit={handlePassphraseSubmit} className="login-form">
              <label htmlFor="passphrase" className="login-label">
                Hasło szyfrowania
              </label>
              <input
                id="passphrase"
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Twoje hasło"
                className="login-input"
                autoFocus
                autoComplete="current-password"
              />
              {error && <p className="login-error">{error}</p>}
              {info && !error && <p className="login-info">{info}</p>}
              <button
                type="submit"
                className="login-btn"
                disabled={!passphrase.trim()}
              >
                Zaloguj
              </button>
            </form>
            <div className="login-secondary">
              <button
                type="button"
                className="login-link-btn"
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
            <form onSubmit={handleEmailSubmit} className="login-form">
              <p className="text-muted login-secondary-hint">
                Wyślemy link logowania na maila. Po kliknięciu wracasz tu i wpisujesz hasło szyfrowania.
              </p>
              <label htmlFor="email" className="login-label">
                Adres email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="login-input"
                autoFocus
                required
              />
              {error && <p className="login-error">{error}</p>}
              <button
                type="submit"
                className="login-btn"
                disabled={loading || !email.trim()}
              >
                {loading ? "Wysyłanie…" : "Wyślij link logowania"}
              </button>
            </form>
            <div className="login-secondary">
              <button
                type="button"
                className="login-link-btn"
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
          <div className="login-sent">
            <p className="login-sent-text">
              Sprawdź skrzynkę <strong>{email}</strong> — link logowania jest tam.
            </p>
            <p className="text-muted" style={{ marginTop: 8 }}>
              Po kliknięciu linku wracasz tutaj i wpisujesz hasło.
            </p>
            <p className="login-tip">
              <strong>Mobile (iOS):</strong> jeśli klikasz link w aplikacji Gmail/Mail
              i nie loguje się — przytrzymaj link → <em>„Open in Safari”</em>.
              Wewnętrzna przeglądarka aplikacji email ma osobne cookies i sesja
              się nie zachowuje.
            </p>
            <button
              type="button"
              className="login-link-btn"
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
      </div>
    </main>
  );
}
