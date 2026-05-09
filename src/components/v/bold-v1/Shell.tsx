"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import type { Route } from "next";
import { BoldV1Brand } from "./Brand";
import { VariantToggle } from "../_shared/VariantToggle";
import { SkinToggle } from "../_shared/SkinToggle";

interface NavItem {
  href: Route;
  label: string;
}

// USUNIĘTE z nav (route zostają, dostępne URL): journal, wiedza (-> /notatki), pomysly (-> /notatki),
// timeline, "Wróć do głównej", o-mnie-teraz, audit/w22, jezyki, silownia, ustawienia/ikony.
const NAV_PRIMARY: NavItem[] = [
  { href: "/v/bold-v1/dashboard" as Route, label: "Dziś" },
  { href: "/v/bold-v1/check-in" as Route, label: "Check-in" },
  { href: "/v/bold-v1/check-out" as Route, label: "Check-out" },
];

const NAV_PLANOWANIE: NavItem[] = [
  { href: "/v/bold-v1/plan/dzien" as Route, label: "Plan dnia" },
  { href: "/v/bold-v1/plan/tydzien" as Route, label: "Plan tygodnia" },
];

const NAV_CODZIENNE: NavItem[] = [
  { href: "/v/bold-v1/notatki" as Route, label: "Notatki" },
];

const NAV_USTAWIENIA: NavItem[] = [
  { href: "/v/bold-v1/cytaty" as Route, label: "Cytaty" },
  { href: "/v/bold-v1/konstytucja" as Route, label: "Konstytucja" },
  { href: "/v/bold-v1/eksport/tydzien" as Route, label: "Eksport tygodnia" },
];

const SETTINGS_OPEN_KEY = "sb-nav-settings-open-bv1";

export function BoldV1Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Persist dropdown state across navigation.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_OPEN_KEY);
      if (saved === "true") setSettingsOpen(true);
      // Auto-open if currently in a settings route
      if (NAV_USTAWIENIA.some((i) => pathname.startsWith(i.href))) {
        setSettingsOpen(true);
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleSettings = () => {
    setSettingsOpen((v) => {
      const next = !v;
      try {
        localStorage.setItem(SETTINGS_OPEN_KEY, String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const isActive = (href: string) =>
    pathname === href || (href !== "/v/bold-v1/dashboard" && pathname.startsWith(href));

  const renderSection = (label: string, items: NavItem[], onLinkClick?: () => void) => (
    <>
      <div className="bv1-nav-section-label">{label}</div>
      {items.map(({ href, label: itemLabel }) => (
        <Link
          key={href}
          href={href}
          onClick={onLinkClick}
          className={isActive(href) ? "bv1-nav-item is-active" : "bv1-nav-item"}
        >
          {itemLabel}
        </Link>
      ))}
    </>
  );

  const renderSettingsDropdown = (onLinkClick?: () => void) => (
    <>
      <button
        type="button"
        className="bv1-nav-section-toggle"
        data-open={settingsOpen}
        onClick={toggleSettings}
        aria-expanded={settingsOpen}
      >
        <span>Ustawienia</span>
        <ChevronDown size={14} className="bv1-nav-chevron" />
      </button>
      {settingsOpen && (
        <div className="bv1-nav-dropdown">
          {NAV_USTAWIENIA.map(({ href, label: itemLabel }) => (
            <Link
              key={href}
              href={href}
              onClick={onLinkClick}
              className={isActive(href) ? "bv1-nav-item is-active" : "bv1-nav-item"}
            >
              {itemLabel}
            </Link>
          ))}
        </div>
      )}
    </>
  );

  return (
    <div className="bv1-shell">
      {/* Desktop sidebar */}
      <aside className="bv1-sidebar" aria-label="Główna nawigacja">
        <BoldV1Brand size={56} showName />
        <nav className="bv1-nav">
          {renderSection("Dzisiaj", NAV_PRIMARY)}
          {renderSection("Planowanie", NAV_PLANOWANIE)}
          {renderSection("Inne", NAV_CODZIENNE)}
          {renderSettingsDropdown()}
        </nav>
        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="bv1-sidebar-toggle">
            <VariantToggle current="bold-v1" />
          </div>
          <div className="bv1-sidebar-toggle">
            <SkinToggle />
          </div>
        </div>
      </aside>

      {/* Mobile topbar — Faza 7 Krok D: brand z tekstem, toggles przeniesione do drawer */}
      <header className="bv1-mobile-topbar">
        <BoldV1Brand size={36} showName />
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Menu"
          style={{
            background: "transparent",
            border: "none",
            color: "var(--bv1-text-on-deep)",
            cursor: "pointer",
            padding: 8,
          }}
        >
          <Menu size={22} />
        </button>
      </header>

      <main className="bv1-main">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="bv1-mobile-bottom-nav" aria-label="Główna nawigacja (mobile)">
        {NAV_PRIMARY.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={isActive(href) ? "bv1-mobile-nav-item is-active" : "bv1-mobile-nav-item"}
          >
            {label}
          </Link>
        ))}
      </nav>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div
          role="presentation"
          onClick={() => setDrawerOpen(false)}
          className="bv1-drawer-overlay"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            className="bv1-drawer-panel"
            style={{
              width: "min(86vw, 320px)",
              padding: 24,
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <BoldV1Brand size={48} showName />
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Zamknij"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--bv1-text-on-deep)",
                  cursor: "pointer",
                  padding: 8,
                }}
              >
                <X size={20} />
              </button>
            </div>
            <nav className="bv1-nav">
              {renderSection("Dzisiaj", NAV_PRIMARY, () => setDrawerOpen(false))}
              {renderSection("Planowanie", NAV_PLANOWANIE, () => setDrawerOpen(false))}
              {renderSection("Codzienne", NAV_CODZIENNE, () => setDrawerOpen(false))}
              {renderSettingsDropdown(() => setDrawerOpen(false))}
            </nav>
            {/* Faza 7 Krok D — toggles przeniesione z mobile topbar do drawer */}
            <div className="bv1-drawer-style-section">
              <p className="bv1-drawer-section-label">Styl</p>
              <VariantToggle current="bold-v1" />
              <SkinToggle />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
