import { CryptoKeyProvider } from "@/context/CryptoKeyContext";
import { IconsProvider } from "@/context/IconsContext";
import { SkinProvider } from "@/context/SkinContext";

export default function VariantsLayout({ children }: { children: React.ReactNode }) {
  return (
    <CryptoKeyProvider>
      <IconsProvider>
        <SkinProvider>{children}</SkinProvider>
      </IconsProvider>
    </CryptoKeyProvider>
  );
}
