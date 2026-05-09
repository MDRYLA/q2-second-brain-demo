import type { NextConfig } from "next";

// Security headers (audit Fala 3 / 2026-04-27, hardening Faza 7 / 2026-05-08).
// Faza 7: HSTS dodane explicit (wczesniej Vercel auto na .vercel.app), removed unsafe-eval
// (NIE potrzebne w prod Next.js 15+). unsafe-inline pozostaje (App Router hydration chunks
// — full nonce migration wymaga middleware refactor, odroczone).
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "off" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  // Ensure .seed-input markdown files are bundled for server runtime on Vercel.
  // Faza 7 fresh-review fix: cytaty.md MISSING — getSeedContent("cytaty") wywoływane przez
  // /v/bold-v1/dashboard, /v/chrome-v2/dashboard, /cytaty (oba warianty) przez page.tsx server.
  // Bez tego: Vercel Serverless funkcji nie ma cytaty.md w bundlu → fs.readFileSync ENOENT →
  // catch returns null → cytaty NIE seedują przy pierwszym snapshot fetch (silent failure).
  outputFileTracingIncludes: {
    "/konstytucja": [".seed-input/konstytucja.md"],
    "/o-mnie-teraz": [".seed-input/o-mnie-teraz.md"],
    "/cytaty": [".seed-input/cytaty.md"],
    "/v/bold-v1/dashboard": [".seed-input/cytaty.md"],
    "/v/chrome-v2/dashboard": [".seed-input/cytaty.md"],
    "/v/bold-v1/cytaty": [".seed-input/cytaty.md"],
    "/v/chrome-v2/cytaty": [".seed-input/cytaty.md"],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
