import { permanentRedirect } from "next/navigation";
import type { Route } from "next";

export default function ChromeV2WiedzaRedirect() {
  permanentRedirect("/v/chrome-v2/notatki" as Route);
}
