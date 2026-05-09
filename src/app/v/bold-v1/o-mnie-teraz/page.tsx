import { fetchSnapshotCiphertext } from "@/lib/supabase/snapshots";
import { getSeedContent } from "@/lib/seed/initial-content";
import { BoldV1OMnieTerazClient } from "./OMnieTerazClient";

export default async function BoldV1OMnieTerazPage() {
  const ciphertext = await fetchSnapshotCiphertext("o_mnie_teraz");
  const seedContent = await getSeedContent("o_mnie_teraz");
  return (
    <BoldV1OMnieTerazClient
      initialCiphertext={ciphertext}
      seedContent={seedContent ?? ""}
    />
  );
}
