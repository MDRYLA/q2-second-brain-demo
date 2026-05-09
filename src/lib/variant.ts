export type VariantSlug = "bold-v1" | "chrome-v2";

export const VARIANT_COOKIE_NAME = "sb-variant-v1";
export const VARIANT_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 rok
export const DEFAULT_VARIANT: VariantSlug = "bold-v1";

export function isValidVariant(value: unknown): value is VariantSlug {
  return value === "bold-v1" || value === "chrome-v2";
}

/**
 * Server-side: read variant z cookies (next/headers).
 * Use w server components / route handlers.
 *
 * @example
 * import { cookies } from "next/headers";
 * import { getVariantFromCookies } from "@/lib/variant";
 *
 * const variant = await getVariantFromCookies(await cookies());
 */
export function getVariantFromCookies(cookieStore: {
  get: (name: string) => { value: string } | undefined;
}): VariantSlug {
  const raw = cookieStore.get(VARIANT_COOKIE_NAME)?.value;
  return isValidVariant(raw) ? raw : DEFAULT_VARIANT;
}
