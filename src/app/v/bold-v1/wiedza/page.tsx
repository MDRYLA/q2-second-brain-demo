import { permanentRedirect } from "next/navigation";
import type { Route } from "next";

// Stare URL: 308 redirect (zachowuje method i parametry).
export default function BoldV1WiedzaRedirect() {
  permanentRedirect("/v/bold-v1/notatki" as Route);
}
