import { Cormorant_Garamond, JetBrains_Mono, Inter } from "next/font/google";
import "@/styles/v/chrome-v2/tokens.css";
import "@/styles/v/chrome-v2/skin-baby-blue.css";
import { ChromeV2Shell } from "@/components/v/chrome-v2/Shell";
import { ChromeV2Wrapper } from "@/components/v/chrome-v2/Wrapper";

// Chrome v2 — Apple Vision DNA:
// - Inter 400/600/800 dla display + body
// - Cormorant Garamond serif dla hero + section titles
// - JetBrains Mono dla numbered prefixes (001-006) + timestamps

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

export default function ChromeV2Layout({ children }: { children: React.ReactNode }) {
  return (
    <ChromeV2Wrapper fontVariables={`${cormorant.variable} ${jetbrainsMono.variable} ${inter.variable}`}>
      <ChromeV2Shell>{children}</ChromeV2Shell>
    </ChromeV2Wrapper>
  );
}
