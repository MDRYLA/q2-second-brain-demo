import { fetchSnapshotCiphertext } from "@/lib/supabase/snapshots";
import { getSeedContent } from "@/lib/seed/initial-content";
import { ChromeV2KonstytucjaClient } from "./KonstytucjaClient";

export default async function ChromeV2KonstytucjaPage() {
  const ciphertext = await fetchSnapshotCiphertext("konstytucja");
  const seedContent = await getSeedContent("konstytucja");
  return (
    <ChromeV2KonstytucjaClient
      initialCiphertext={ciphertext}
      seedContent={seedContent ?? ""}
    />
  );
}
