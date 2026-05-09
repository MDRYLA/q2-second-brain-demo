import { Cormorant_Garamond, JetBrains_Mono, Inter } from "next/font/google";
import "@/styles/v/chrome-v2/tokens.css";
import "@/styles/v/chrome-v2/skin-baby-blue.css";
import { ChromeV2Wrapper } from "@/components/v/chrome-v2/Wrapper";

const cormorant = Cormorant_Garamond({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif-cormorant",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono-jetbrains",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-display-inter",
  display: "swap",
});

/**
 * Login layout — bez Shell (sidebar/topbar). Wrapper z fontami + skin support.
 */
export default function ChromeV2LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <ChromeV2Wrapper fontVariables={`${cormorant.variable} ${jetbrainsMono.variable} ${inter.variable}`}>
      {children}
    </ChromeV2Wrapper>
  );
}
