import { Boldonse, Caveat } from "next/font/google";
import "@/styles/v/bold-v1/tokens.css";
import "@/styles/v/bold-v1/skin-baby-blue.css";
import { BoldV1Shell } from "@/components/v/bold-v1/Shell";
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

export default function BoldV1Layout({ children }: { children: React.ReactNode }) {
  return (
    <BoldV1Wrapper fontVariables={`${boldonse.variable} ${caveat.variable}`}>
      <BoldV1Shell>{children}</BoldV1Shell>
    </BoldV1Wrapper>
  );
}
