import Link from "next/link";
import type { Route } from "next";

const variants = [
  {
    slug: "bold-v1",
    style: "Bold + Drawing",
    name: "Magazine cover",
    desc: "Hero z dużym tulipanem-rysunkiem + duża czerwona display typografia + cards cream-paper na ciemnozielonym tle. Vibe magazynu — każdy dzień jako okładka.",
    accent: "#D63B2A",
    bg: "#1F2918",
    fg: "#FBF8EE",
  },
  {
    slug: "chrome-v2",
    style: "Chrome / Editorial",
    name: "Apple Vision dashboard",
    desc: "Glass-morphic cards z backdrop-filter blur + animowany chrome gradient mesh tła + dark navy + niebieski glow. Vibe premium tech: clean, futuristic.",
    accent: "#7CA3D9",
    bg: "#0E1420",
    fg: "#E8EEF8",
  },
];

export default function VariantsLanding() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        padding: "clamp(24px, 6vw, 64px)",
        background: "#0E1420",
        color: "#F4F1E8",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <header style={{ maxWidth: 960, margin: "0 auto 48px" }}>
        <h1
          style={{
            fontSize: "clamp(28px, 5vw, 44px)",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            margin: "0 0 12px",
          }}
        >
          Q2 — 2 warianty designu
        </h1>
        <p style={{ fontSize: 16, lineHeight: 1.5, opacity: 0.8, maxWidth: 640 }}>
          After testing 6 variants, two finalists remain: <strong>bold-v1 (Magazine)</strong> and{" "}
          <strong>chrome-v2 (Vision)</strong>. Both fully functional with shared data layer; the toggle in the
          sidebar lets you jump between designs without changing route.
        </p>
        <p style={{ fontSize: 14, opacity: 0.6, marginTop: 16 }}>
          Główna apka (obecna wersja, klasyczna):{" "}
          <Link href={"/" as Route} style={{ color: "#7CA3D9", textDecoration: "underline" }}>
            /
          </Link>
        </p>
      </header>

      <section
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: 24,
        }}
      >
        {variants.map((v) => (
          <Link
            key={v.slug}
            href={`/v/${v.slug}/dashboard` as Route}
            style={{
              display: "block",
              padding: 32,
              background: v.bg,
              color: v.fg,
              borderRadius: 16,
              textDecoration: "none",
              border: `1px solid ${v.accent}55`,
              transition: "transform 200ms ease, border-color 200ms ease",
            }}
            className="variant-card"
          >
            <div
              style={{
                fontSize: 11,
                opacity: 0.7,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              {v.style}
            </div>
            <div
              style={{
                fontSize: 32,
                fontWeight: 700,
                margin: "10px 0 16px",
                color: v.accent,
                letterSpacing: "-0.01em",
                lineHeight: 1.1,
              }}
            >
              {v.name}
            </div>
            <div style={{ fontSize: 15, lineHeight: 1.55, opacity: 0.85 }}>{v.desc}</div>
            <div
              style={{
                marginTop: 24,
                fontSize: 12,
                opacity: 0.6,
                fontFamily: "ui-monospace, monospace",
                letterSpacing: "0.04em",
              }}
            >
              /v/{v.slug}/dashboard →
            </div>
          </Link>
        ))}
      </section>

      <footer
        style={{
          maxWidth: 960,
          margin: "64px auto 0",
          paddingTop: 24,
          borderTop: "1px solid #2A3A50",
          fontSize: 13,
          opacity: 0.6,
          lineHeight: 1.6,
        }}
      >
        <p style={{ margin: 0 }}>
          Po finalnym wyborze 1 z 2 wariantów — rip-replace zawartości głównej apki + cleanup drugiego wariantu.
          Obecna klasyczna wersja w <code>/</code> zostaje nietknięta do tego czasu jako fallback.
        </p>
      </footer>
    </main>
  );
}
