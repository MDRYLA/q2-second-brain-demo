import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getVariantFromCookies } from "@/lib/variant";

export default async function RootPage() {
  const cookieStore = await cookies();
  const variant = getVariantFromCookies(cookieStore);
  redirect(`/v/${variant}/dashboard`);
}
