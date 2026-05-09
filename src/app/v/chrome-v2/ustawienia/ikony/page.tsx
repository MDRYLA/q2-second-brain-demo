"use client";

import { useEffect, useState } from "react";
import { useIconChoices } from "@/context/IconsContext";
import { MODULE_REGISTRY } from "@/lib/icons/registry";
import { RotateCcw, X } from "lucide-react";
import { ChromeV2Hero } from "@/components/v/chrome-v2/Hero";

const BANNER_FLAG = "sb-icons-banner-v1-dismissed";

export default function ChromeV2IkonyPage() {
  const { choices, setChoice, resetAll } = useIconChoices();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(BANNER_FLAG) === "true";
      setShowBanner(!dismissed);
    } catch {
      // ignore
    }
  }, []);

  const dismissBanner = () => {
    try {
      localStorage.setItem(BANNER_FLAG, "true");
    } catch {
      // ignore
    }
    setShowBanner(false);
  };

  const handleResetAll = () => {
    resetAll();
    dismissBanner();
  };

  return (
    <div className="cv2-form-screen">
      <ChromeV2Hero
        eyebrow="Ustawienia"
        title="Ikony nawigacji"
        subtitle="Wybierz po jednej ikonie dla każdego modułu. Zmiana zapisuje się od razu i obowiązuje na desktop oraz mobile bottom bar."
      >
        <div style={{ marginTop: 16 }}>
          <button
            type="button"
            className="btn-edit"
            onClick={() => {
              if (confirm("Przywrócić wszystkie domyślne ikony?")) {
                handleResetAll();
              }
            }}
            aria-label="Przywróć domyślne ikony"
          >
            <RotateCcw size={13} style={{ marginRight: 6, verticalAlign: "-2px" }} />
            Domyślne
          </button>
        </div>
      </ChromeV2Hero>

      {showBanner && (
        <div className="ikony-reset-banner" role="status">
          <div>
            <strong>Nowe domyślne ikony Rzym/Grecja są dostępne.</strong>{" "}
            Kliknij <em>Domyślne</em> żeby zaaktualizować swoje wybory do nowego stylu.
          </div>
          <button
            type="button"
            onClick={dismissBanner}
            aria-label="Zamknij banner"
            className="ikony-reset-banner-close"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="ikony-grid">
        {MODULE_REGISTRY.map((module) => {
          const currentId = choices[module.slug] ?? module.defaultId;
          return (
            <section key={module.slug} className="ikony-row">
              <div className="ikony-row-label">{module.label}</div>
              <div className="ikony-row-options">
                {module.options.map((opt) => {
                  const Icon = opt.Icon;
                  const selected = currentId === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setChoice(module.slug, opt.id)}
                      className={`ikony-option${selected ? " selected" : ""}`}
                      aria-pressed={selected}
                      aria-label={`${module.label}: ${opt.label}`}
                    >
                      <Icon size={22} />
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
