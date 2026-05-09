"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import type { Route } from "next";
import { usePathname, useSearchParams } from "next/navigation";
import { VARIANT_COOKIE_NAME, VARIANT_COOKIE_MAX_AGE, type VariantSlug } from "@/lib/variant";

interface Props {
  current: VariantSlug;
  className?: string;
}

const LABEL: Record<VariantSlug, string> = {
  "bold-v1": "Magazine",
  "chrome-v2": "Vision",
};

function setVariantCookie(variant: VariantSlug) {
  if (typeof document === "undefined") return;
  // injection over HTTP (CSRF redirect target manipulation).
  const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
  const secureFlag = isSecure ? "; secure" : "";
  document.cookie = `${VARIANT_COOKIE_NAME}=${variant}; path=/; max-age=${VARIANT_COOKIE_MAX_AGE}; samesite=lax${secureFlag}`;
}

function VariantToggleInner({ current, className }: Props) {
  const pathname = usePathname() ?? `/v/${current}/dashboard`;
  const searchParams = useSearchParams();
  const otherVariant: VariantSlug = current === "bold-v1" ? "chrome-v2" : "bold-v1";

  // Sync cookie z aktualnym wariantem (jeśli user wszedł direct URL — pamiętaj wybór)
  useEffect(() => {
    setVariantCookie(current);
  }, [current]);

  // Wyciągnij subroute po /v/<wariant>: np. /v/bold-v1/check-in -> /check-in
  const subroute = pathname.replace(/^\/v\/(bold-v1|chrome-v2)/, "") || "/dashboard";
  const qs = searchParams?.toString() ?? "";
  const otherHref = (qs
    ? `/v/${otherVariant}${subroute}?${qs}`
    : `/v/${otherVariant}${subroute}`) as Route;

  const handleSwitch = () => {
    setVariantCookie(otherVariant);
  };

  return (
    <div className={`v-toggle ${className ?? ""}`} role="group" aria-label="Wariant designu">
      <span className="v-toggle-pill v-toggle-active" aria-current="page">
        {LABEL[current]}
      </span>
      <Link
        href={otherHref}
        className="v-toggle-pill v-toggle-inactive"
        aria-label={`Przełącz na ${LABEL[otherVariant]}`}
        onClick={handleSwitch}
      >
        {LABEL[otherVariant]}
      </Link>
    </div>
  );
}

export function VariantToggle(props: Props) {
  return (
    <Suspense fallback={<div className={`v-toggle ${props.className ?? ""}`} aria-hidden />}>
      <VariantToggleInner {...props} />
    </Suspense>
  );
}
