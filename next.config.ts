import type { NextConfig } from "next";

// Security headers. CSP intentionally allows 'unsafe-inline' for Next.js App Router
// hydration chunks; full nonce migration is acknowledged technical debt
// (see ARCHITECTURE.md → "Open architectural debt").
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
  poweredByHeader: false,
  // Ensure .seed-input markdown files are bundled for server runtime on Vercel.
  // Without this, fs.readFileSync ENOENT → seed content silently null on first render.
  outputFileTracingIncludes: {
    "/konstytucja": [".seed-input/konstytucja.md"],
    "/o-mnie-teraz": [".seed-input/o-mnie-teraz.md"],
    "/cytaty": [".seed-input/cytaty.md"],
    "/v/bold-v1/dashboard": [".seed-input/cytaty.md"],
    "/v/chrome-v2/dashboard": [".seed-input/cytaty.md"],
    "/v/bold-v1/cytaty": [".seed-input/cytaty.md"],
    "/v/chrome-v2/cytaty": [".seed-input/cytaty.md"],
    "/v/bold-v1/konstytucja": [".seed-input/konstytucja.md"],
    "/v/chrome-v2/konstytucja": [".seed-input/konstytucja.md"],
    "/v/bold-v1/o-mnie-teraz": [".seed-input/o-mnie-teraz.md"],
    "/v/chrome-v2/o-mnie-teraz": [".seed-input/o-mnie-teraz.md"],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
