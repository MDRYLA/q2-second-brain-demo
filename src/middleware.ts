import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { DEMO_MODE, DEMO_USER } from "@/lib/env";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Demo mode: synthetic user, no Supabase calls. Reviewers reach the dashboard
  // without configuring any backend.
  let user: { id: string; email: string } | null = DEMO_MODE ? DEMO_USER : null;

  if (!DEMO_MODE) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
      // Fail-CLOSED: misconfigured production deploy must not silently downgrade
      // to anonymous mode. Operator must either set NEXT_PUBLIC_DEMO_MODE=true
      // or provide Supabase credentials.
      return new NextResponse(
        "Service Unavailable — Supabase configuration missing. " +
          "Set NEXT_PUBLIC_DEMO_MODE=true to run without backend, or configure " +
          "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
        { status: 503 },
      );
    } else {
      const supabase = createServerClient(url, anonKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      });

      const result = await supabase.auth.getUser();
      user = result.data.user
        ? { id: result.data.user.id, email: result.data.user.email ?? "" }
        : null;
    }
  }

  const pathname = request.nextUrl.pathname;

  // Bookmarki typu /dashboard, /check-in, /plan/tydzien → /v/<cookie>/<rest>
  const LEGACY_EXACT = new Set([
    "/dashboard",
    "/check-in",
    "/check-out",
    "/plan",
    "/plan/dzien",
    "/plan/tydzien",
    "/plan/miesiac",
    "/plan/kwartal",
    "/plan/rok",
    "/journal",
    "/wiedza",
    "/timeline",
    "/cytaty",
    "/konstytucja",
    "/o-mnie-teraz",
    "/jezyki",
    "/pomysly",
    "/silownia",
    "/eksport/tydzien",
    "/audit/w22",
    "/ustawienia/ikony",
  ]);
  const isLegacyPrefix =
    pathname.startsWith("/journal/") ||
    pathname.startsWith("/plan/dzien/") ||
    pathname.startsWith("/plan/tydzien/") ||
    pathname.startsWith("/plan/miesiac/") ||
    pathname.startsWith("/plan/kwartal/") ||
    pathname.startsWith("/plan/rok/");

  if (LEGACY_EXACT.has(pathname) || isLegacyPrefix) {
    const variant = request.cookies.get("sb-variant-v1")?.value === "chrome-v2" ? "chrome-v2" : "bold-v1";
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `/v/${variant}${pathname}`;
    return NextResponse.redirect(redirectUrl);
  }

  // Whitelist explicit public API routes — każdy weryfikuje sesję server-side.
  // NIE używaj prefix `/api/*` — nowe API routes muszą jawnie się dopisać,
  // inaczej dostają default-deny + redirect do /login.
  const isPublicApiRoute = pathname === "/api/setup-user";

  const isPublicPath =
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/_next") ||
    isPublicApiRoute ||
    pathname === "/favicon.ico" ||
    pathname === "/v/bold-v1/login" ||
    pathname === "/v/chrome-v2/login";

  if (!user && !isPublicPath) {
    const loginUrl = request.nextUrl.clone();
    if (pathname.startsWith("/v/bold-v1/")) {
      loginUrl.pathname = "/v/bold-v1/login";
    } else if (pathname.startsWith("/v/chrome-v2/")) {
      loginUrl.pathname = "/v/chrome-v2/login";
    } else {
      const variantCookie = request.cookies.get("sb-variant-v1")?.value;
      const variant = variantCookie === "chrome-v2" ? "chrome-v2" : "bold-v1";
      loginUrl.pathname = `/v/${variant}/login`;
    }
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.+\\.(?:png|jpg|jpeg|gif|svg|webp|avif|ico|json|txt|xml|woff|woff2|ttf|otf)$).*)",
  ],
};
