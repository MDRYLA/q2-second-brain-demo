import { fetchSnapshotCiphertext } from "@/lib/supabase/snapshots";
import { getSeedContent } from "@/lib/seed/initial-content";
import { BoldV1CytatyClient } from "./CytatyClient";

export default async function BoldV1CytatyPage() {
  const ciphertext = await fetchSnapshotCiphertext("cytaty");
  const seedContent = await getSeedContent("cytaty");
  return (
    <BoldV1CytatyClient
      initialCiphertext={ciphertext}
      seedContent={seedContent ?? ""}
    />
  );
}
