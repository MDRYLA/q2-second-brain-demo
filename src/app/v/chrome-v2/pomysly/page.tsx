import { permanentRedirect } from "next/navigation";
import type { Route } from "next";

export default function ChromeV2PomyslyRedirect() {
  permanentRedirect("/v/chrome-v2/notatki" as Route);
}
