import { DEMO_MODE } from "@/lib/env";

/**
 * Sticky top banner shown only in demo mode. Lets reviewers know that
 * data is mocked and persistence requires a real Supabase setup.
 */
export function DemoBanner() {
  if (!DEMO_MODE) return null;

  return (
    <div
      role="status"
      aria-label="Demo mode notice"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 9999,
        width: "100%",
        background: "linear-gradient(90deg, #c8392f 0%, #e85a3f 100%)",
        color: "#fff",
        textAlign: "center",
        padding: "8px 16px",
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: "0.02em",
        boxShadow: "0 1px 0 rgba(0,0,0,0.15)",
      }}
    >
      <span style={{ marginRight: 8 }} aria-hidden="true">●</span>
      DEMO MODE — data is mocked and not persisted across reloads.
      <a
        href="https://github.com/MDRYLA/q2-second-brain-demo#run-locally-zero-config"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: "#fff",
          marginLeft: 12,
          textDecoration: "underline",
          fontWeight: 700,
        }}
      >
        Source &amp; setup →
      </a>
    </div>
  );
}
