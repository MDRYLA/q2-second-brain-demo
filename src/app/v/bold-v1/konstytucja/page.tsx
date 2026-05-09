import { fetchSnapshotCiphertext } from "@/lib/supabase/snapshots";
import { getSeedContent } from "@/lib/seed/initial-content";
import { BoldV1KonstytucjaClient } from "./KonstytucjaClient";

export default async function BoldV1KonstytucjaPage() {
  const ciphertext = await fetchSnapshotCiphertext("konstytucja");
  const seedContent = await getSeedContent("konstytucja");
  return (
    <BoldV1KonstytucjaClient
      initialCiphertext={ciphertext}
      seedContent={seedContent ?? ""}
    />
  );
}
