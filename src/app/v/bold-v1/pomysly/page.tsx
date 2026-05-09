import { permanentRedirect } from "next/navigation";
import type { Route } from "next";

export default function BoldV1PomyslyRedirect() {
  permanentRedirect("/v/bold-v1/notatki" as Route);
}
