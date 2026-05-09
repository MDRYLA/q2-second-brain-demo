"use client";

import Link from "next/link";
import type { Route } from "next";
import { useMemo, useState } from "react";
import { useCryptoKey } from "@/context/CryptoKeyContext";
import { BoldV1PassphraseGate } from "@/components/v/bold-v1/PassphraseGate";
import { encrypt, decrypt } from "@/lib/crypto/aes";
import { savePlan } from "@/lib/supabase/plans";
import type { PlanRow } from "@/lib/supabase/plans";
import type { PlanLevel } from "@/lib/date/period";

// 4 role z Konstytucji: bliska / tworca / sportowiec / przyszlosc.
// Dotyczy poziomu kwartal/rok (NIE miesiąc — miesiąc jest taktyczny).
export interface RoleAllocation {
  bliska: number;
  tworca: number;
  sportowiec: number;
  przyszlosc: number;
}

export interface SimplePlanData {
  headline: string;
  bullets: string[];
  notes: string;
  roleAllocation?: RoleAllocation;
  parentPlanId?: string | null; // Sesja 19 Sprint 1.5 #10 — link do planu wyższego poziomu
}

const DEFAULT_DATA: SimplePlanData = { headline: "", bullets: [""], notes: "" };

const EMPTY_ROLE_ALLOCATION: RoleAllocation = {
  bliska: 0,
  tworca: 0,
  sportowiec: 0,
  przyszlosc: 0,
};

interface Props {
  level: PlanLevel;
  periodStart: string;
  periodEnd: string;
  periodLabel: string;
  initialPlan: PlanRow | null;
  /** Per-level UX copy. */
  copy: {
    title: string;          // "Plan roczny"
    headlinePlaceholder: string;
    bulletsLabel: string;
    bulletsHint: string;
    bulletsPlaceholder: string;
    notesLabel?: string;
  };
  /** Max number of bullets to allow (anti-overload). */
  bulletsMax?: number;
  prevHref?: string;
  nextHref?: string;
  todayHref?: string;          // np. "/plan/miesiac" (link do bieżącego okresu)
  isCurrentPeriod?: boolean;   // gdy false → pokazuje przycisk "Dziś"
  parentPlan?: PlanRow | null;
  parentLabel?: string;        // np. "Plan roczny 2026"
}

function PlanLevelContent({
  level,
  periodStart,
  periodEnd,
  periodLabel,
  initialPlan,
  copy,
  bulletsMax = 5,
  prevHref,
  nextHref,
  todayHref,
  isCurrentPeriod,
  parentPlan,
  parentLabel,
}: Props) {
  const { key } = useCryptoKey();

  const parseInitial = (): SimplePlanData => {
    if (!initialPlan || !key) return DEFAULT_DATA;
    try {
      const plain = JSON.parse(decrypt(initialPlan.ciphertext, key)) as Partial<SimplePlanData>;
      const ra = plain.roleAllocation;
      const clamp = (v: unknown): number => {
        const n = typeof v === "number" ? v : Number(v);
        if (!Number.isFinite(n)) return 0;
        return Math.max(0, Math.min(100, Math.round(n)));
      };
      return {
        ...DEFAULT_DATA,
        ...plain,
        roleAllocation: ra
          ? {
              bliska: clamp(ra.bliska),
              tworca: clamp(ra.tworca),
              sportowiec: clamp(ra.sportowiec),
              przyszlosc: clamp(ra.przyszlosc),
            }
          : undefined,
      } as SimplePlanData;
    } catch {
      return DEFAULT_DATA;
    }
  };

  const [form, setForm] = useState<SimplePlanData>(parseInitial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  if (!key) return null;

  const updateBullet = (idx: number, value: string) => {
    setForm((prev) => ({
      ...prev,
      bullets: prev.bullets.map((b, i) => (i === idx ? value : b)),
    }));
    setSaved(false);
  };

  const addBullet = () => {
    setForm((prev) => ({ ...prev, bullets: [...prev.bullets, ""] }));
  };

  const removeBullet = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      bullets: prev.bullets.filter((_, i) => i !== idx),
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    setError("");
    const ra = form.roleAllocation;
    const raHasContent = ra && (ra.bliska > 0 || ra.tworca > 0 || ra.sportowiec > 0 || ra.przyszlosc > 0);
    const parentPlanId = form.parentPlanId ?? parentPlan?.id ?? null;
    const cleaned: SimplePlanData = {
      headline: form.headline.trim(),
      bullets: form.bullets.map((b) => b.trim()).filter((b) => b.length > 0),
      notes: form.notes.trim(),
      roleAllocation: raHasContent ? ra : undefined,
      parentPlanId,
    };
    if (cleaned.headline.length === 0 && cleaned.bullets.length === 0) {
      setError("Wpisz co najmniej temat lub jeden punkt.");
      return;
    }
    setSaving(true);
    try {
      const ciphertext = encrypt(JSON.stringify(cleaned), key);
      const result = await savePlan(level, periodStart, periodEnd, ciphertext, parentPlanId);
      if (result.error) throw new Error(result.error);
      setSaved(true);
      setForm(cleaned);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Błąd zapisu planu.");
    } finally {
      setSaving(false);
    }
  };

  const parentHeadline = useMemo(() => {
    if (!parentPlan || !key) return null;
    try {
      const plain = JSON.parse(decrypt(parentPlan.ciphertext, key)) as { headline?: string };
      return plain.headline?.trim() ?? "";
    } catch {
      return null;
    }
  }, [parentPlan, key]);

  const canAdd = form.bullets.length < bulletsMax;

  return (
    <div className="bv1-form-screen">
      <div className="page-header">
        <div style={{ flex: 1 }}>
          {(prevHref || nextHref) && (
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
              {prevHref && (
                <Link href={prevHref as Route} className="btn-edit" aria-label="Poprzedni okres">
                  ← Poprzedni
                </Link>
              )}
              {nextHref && (
                <Link href={nextHref as Route} className="btn-edit" aria-label="Następny okres">
                  Następny →
                </Link>
              )}
              {!isCurrentPeriod && todayHref && (
                <Link href={todayHref as Route} className="btn-edit" aria-label="Wróć do bieżącego okresu">
                  Dziś
                </Link>
              )}
            </div>
          )}
          <p className="eyebrow">{periodLabel}</p>
          <h1>{copy.title}</h1>
        </div>
      </div>

      <div className="plan-form">
        {/* Sesja 19 Sprint 1.5 #10 — read-only display rodzica (gdy istnieje) */}
        {parentPlan && parentHeadline !== null && (
          <section className="bv1-form-section">
            <p className="text-muted ci-section-hint" style={{ margin: 0 }}>
              <strong>Powiązany z:</strong> {parentLabel ?? "plan rodzica"}
              {parentHeadline ? ` — „${parentHeadline}”` : " (brak motywu)"}
            </p>
          </section>
        )}

        <section className="bv1-form-section">
          <label className="ci-field-label" htmlFor={`${level}-headline`}>
            Temat / motyw
          </label>
          <input
            id={`${level}-headline`}
            type="text"
            className="ci-input ci-input-wide"
            placeholder={copy.headlinePlaceholder}
            maxLength={140}
            value={form.headline}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, headline: e.target.value }));
              setSaved(false);
            }}
          />
        </section>

        <section className="bv1-form-section">
          <h2 className="bv1-form-section-title">{copy.bulletsLabel}</h2>
          <p className="text-muted ci-section-hint">{copy.bulletsHint}</p>

          <ul className="plan-bullets">
            {form.bullets.map((bullet, idx) => (
              <li key={idx} className="plan-bullet-row">
                <span className="plan-bullet-bullet">·</span>
                <input
                  type="text"
                  className="ci-input ci-input-wide"
                  placeholder={copy.bulletsPlaceholder}
                  value={bullet}
                  onChange={(e) => updateBullet(idx, e.target.value)}
                  maxLength={200}
                />
                {form.bullets.length > 1 && (
                  <button
                    type="button"
                    className="plan-bullet-remove"
                    onClick={() => removeBullet(idx)}
                    aria-label="Usuń punkt"
                  >
                    ×
                  </button>
                )}
              </li>
            ))}
          </ul>

          {canAdd && (
            <button
              type="button"
              className="btn-edit plan-bullet-add"
              onClick={addBullet}
            >
              + Dodaj punkt
            </button>
          )}
        </section>

        {/* Sesja 19 Krok 8 — role allocation, tylko dla kwartał/rok (strategiczne) */}
        {(level === "kwartal" || level === "rok") && (
          <section className="bv1-form-section">
            <h2 className="bv1-form-section-title">Alokacja ról (%)</h2>
            <p className="text-muted ci-section-hint">
              Ile procent czasu/wagi planujesz dla każdej roli. Suma nie musi = 100%
              (część dnia to sen / admin). Weekly review porówna z realizacją.
            </p>
            <div className="role-allocation-grid">
              {(
                [
                  ["bliska", "Bliska Osoba"],
                  ["tworca", "Twórca"],
                  ["sportowiec", "Sportowiec"],
                  ["przyszlosc", "Przyszłość"],
                ] as const
              ).map(([key, label]) => {
                const value = form.roleAllocation?.[key] ?? 0;
                return (
                  <div key={key} className="ci-field role-allocation-field">
                    <label className="ci-field-label" htmlFor={`ra-${key}`}>{label}</label>
                    <div className="role-allocation-input-row">
                      <input
                        id={`ra-${key}`}
                        type="number"
                        className="ci-input ci-input-sm"
                        min={0}
                        max={100}
                        step={5}
                        value={value || ""}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const n = raw === "" ? 0 : Math.max(0, Math.min(100, Number(raw)));
                          setForm((prev) => ({
                            ...prev,
                            roleAllocation: {
                              ...(prev.roleAllocation ?? EMPTY_ROLE_ALLOCATION),
                              [key]: n,
                            },
                          }));
                          setSaved(false);
                        }}
                      />
                      <span className="role-allocation-unit">%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section className="bv1-form-section">
          <label className="ci-field-label" htmlFor={`${level}-notes`}>
            {copy.notesLabel ?? "Notatki (opcjonalne)"}
          </label>
          <textarea
            id={`${level}-notes`}
            className="ci-textarea"
            placeholder="Wolny tekst — kontekst, refleksja, co przyszło do głowy"
            maxLength={2000}
            value={form.notes}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, notes: e.target.value }));
              setSaved(false);
            }}
          />
        </section>

        {error && <p className="login-error">{error}</p>}

        <div className="ci-actions">
          <button
            type="button"
            className="bv1-btn bv1-btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Zapisuję…" : saved ? "Zapisano ✓" : "Zapisz plan"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function BoldV1PlanLevelClient(props: Props) {
  return (
    <BoldV1PassphraseGate>
      <PlanLevelContent {...props} />
    </BoldV1PassphraseGate>
  );
}
