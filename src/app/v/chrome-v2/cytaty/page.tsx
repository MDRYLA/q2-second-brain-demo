import { fetchSnapshotCiphertext } from "@/lib/supabase/snapshots";
import { getSeedContent } from "@/lib/seed/initial-content";
import { ChromeV2CytatyClient } from "./CytatyClient";

export default async function ChromeV2CytatyPage() {
  const ciphertext = await fetchSnapshotCiphertext("cytaty");
  const seedContent = await getSeedContent("cytaty");
  return (
    <ChromeV2CytatyClient
      initialCiphertext={ciphertext}
      seedContent={seedContent ?? ""}
    />
  );
}
