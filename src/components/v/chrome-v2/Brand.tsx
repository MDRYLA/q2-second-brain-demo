import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";

interface Props {
  size?: number;
  showName?: boolean;
  href?: Route;
}

export function ChromeV2Brand({ size = 56, showName = true, href = "/v/chrome-v2/dashboard" as Route }: Props) {
  return (
    <Link href={href} className="cv2-brand cv2-brand-link" aria-label="Q2 — przejdz do Dashboardu">
      <Image
        src="/v/logo-chrome.png"
        alt="Q2"
        width={size}
        height={size}
        priority
        unoptimized
        className="cv2-brand-img"
        style={{ width: size, height: "auto" }}
      />
      {showName && <span className="cv2-brand-name">Q2</span>}
    </Link>
  );
}
