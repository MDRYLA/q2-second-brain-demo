import { Boldonse, Caveat } from "next/font/google";
import "@/styles/v/bold-v1/tokens.css";
import "@/styles/v/bold-v1/skin-baby-blue.css";
import { BoldV1Wrapper } from "@/components/v/bold-v1/Wrapper";

const boldonse = Boldonse({
  subsets: ["latin", "latin-ext"],
  weight: ["400"],
  variable: "--font-display-bold",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-handwritten",
  display: "swap",
});

/**
 * Login layout — bez Shell (sidebar/topbar). Tylko wrapper z fontami i skin.
 * Children renderują własne login UI (cream paper card centered).
 */
export default function BoldV1LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <BoldV1Wrapper fontVariables={`${boldonse.variable} ${caveat.variable}`}>
      {children}
    </BoldV1Wrapper>
  );
}
