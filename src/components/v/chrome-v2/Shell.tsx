"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import type { Route } from "next";
import { ChromeV2Brand } from "./Brand";
import { VariantToggle } from "../_shared/VariantToggle";
import { SkinToggle } from "../_shared/SkinToggle";

interface NavItem {
  href: Route;
  label: string;
}

const NAV_PRIMARY: NavItem[] = [
  { href: "/v/chrome-v2/dashboard" as Route, label: "Dziś" },
  { href: "/v/chrome-v2/check-in" as Route, label: "Check-in" },
  { href: "/v/chrome-v2/check-out" as Route, label: "Check-out" },
];

const NAV_PLANOWANIE: NavItem[] = [
  { href: "/v/chrome-v2/plan/dzien" as Route, label: "Plan dnia" },
  { href: "/v/chrome-v2/plan/tydzien" as Route, label: "Plan tygodnia" },
];

const NAV_CODZIENNE: NavItem[] = [
  { href: "/v/chrome-v2/notatki" as Route, label: "Notatki" },
];

const NAV_USTAWIENIA: NavItem[] = [
  { href: "/v/chrome-v2/cytaty" as Route, label: "Cytaty" },
  { href: "/v/chrome-v2/konstytucja" as Route, label: "Konstytucja" },
  { href: "/v/chrome-v2/eksport/tydzien" as Route, label: "Eksport tygodnia" },
];

const SETTINGS_OPEN_KEY = "sb-nav-settings-open-cv2";

export function ChromeV2Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_OPEN_KEY);
      if (saved === "true") setSettingsOpen(true);
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
    pathname === href || (href !== "/v/chrome-v2/dashboard" && pathname.startsWith(href));

  const renderSection = (label: string, items: NavItem[], onLinkClick?: () => void) => (
    <>
      <div className="cv2-nav-section-label">{label}</div>
      {items.map(({ href, label: itemLabel }) => (
        <Link
          key={href}
          href={href}
          onClick={onLinkClick}
          className={isActive(href) ? "cv2-nav-item is-active" : "cv2-nav-item"}
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
        className="cv2-nav-section-toggle"
        data-open={settingsOpen}
        onClick={toggleSettings}
        aria-expanded={settingsOpen}
      >
        <span>Ustawienia</span>
        <ChevronDown size={14} className="cv2-nav-chevron" />
      </button>
      {settingsOpen && (
        <div className="cv2-nav-dropdown">
          {NAV_USTAWIENIA.map(({ href, label: itemLabel }) => (
            <Link
              key={href}
              href={href}
              onClick={onLinkClick}
              className={isActive(href) ? "cv2-nav-item is-active" : "cv2-nav-item"}
            >
              {itemLabel}
            </Link>
          ))}
        </div>
      )}
    </>
  );

  return (
    <div className="cv2-shell">
      {/* Desktop sidebar */}
      <aside className="cv2-sidebar" aria-label="Główna nawigacja">
        <ChromeV2Brand size={56} showName />
        <nav className="cv2-nav">
          {renderSection("Dzisiaj", NAV_PRIMARY)}
          {renderSection("Planowanie", NAV_PLANOWANIE)}
          {renderSection("Inne", NAV_CODZIENNE)}
          {renderSettingsDropdown()}
        </nav>
        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="cv2-sidebar-toggle">
            <VariantToggle current="chrome-v2" />
          </div>
          <div className="cv2-sidebar-toggle">
            <SkinToggle />
          </div>
        </div>
      </aside>

      {/* Mobile topbar — Faza 7 Krok D: brand z tekstem, toggles przeniesione do drawer */}
      <header className="cv2-mobile-topbar">
        <ChromeV2Brand size={36} showName />
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Menu"
          style={{
            background: "transparent",
            border: "none",
            color: "var(--cv2-text-primary)",
            cursor: "pointer",
            padding: 8,
          }}
        >
          <Menu size={22} />
        </button>
      </header>

      <main className="cv2-main">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="cv2-mobile-bottom-nav" aria-label="Główna nawigacja (mobile)">
        {NAV_PRIMARY.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={isActive(href) ? "cv2-mobile-nav-item is-active" : "cv2-mobile-nav-item"}
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
          className="cv2-drawer-overlay"
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
            className="cv2-drawer-panel"
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
              <ChromeV2Brand size={48} showName />
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Zamknij"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--cv2-text-primary)",
                  cursor: "pointer",
                  padding: 8,
                }}
              >
                <X size={20} />
              </button>
            </div>
            <nav className="cv2-nav">
              {renderSection("Dzisiaj", NAV_PRIMARY, () => setDrawerOpen(false))}
              {renderSection("Planowanie", NAV_PLANOWANIE, () => setDrawerOpen(false))}
              {renderSection("Codzienne", NAV_CODZIENNE, () => setDrawerOpen(false))}
              {renderSettingsDropdown(() => setDrawerOpen(false))}
            </nav>
            {/* Faza 7 Krok D — toggles przeniesione z mobile topbar do drawer */}
            <div className="cv2-drawer-style-section">
              <p className="cv2-drawer-section-label">Styl</p>
              <VariantToggle current="chrome-v2" />
              <SkinToggle />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
