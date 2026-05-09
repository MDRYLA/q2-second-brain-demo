import { fetchSnapshotCiphertext } from "@/lib/supabase/snapshots";
import { getSeedContent } from "@/lib/seed/initial-content";
import { ChromeV2OMnieTerazClient } from "./OMnieTerazClient";

export default async function ChromeV2OMnieTerazPage() {
  const ciphertext = await fetchSnapshotCiphertext("o_mnie_teraz");
  const seedContent = await getSeedContent("o_mnie_teraz");
  return (
    <ChromeV2OMnieTerazClient
      initialCiphertext={ciphertext}
      seedContent={seedContent ?? ""}
    />
  );
}
