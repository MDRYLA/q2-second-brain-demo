import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";

interface Props {
  size?: number;
  showName?: boolean;
  href?: Route;
}

export function BoldV1Brand({ size = 56, showName = true, href = "/v/bold-v1/dashboard" as Route }: Props) {
  return (
    <Link href={href} className="bv1-brand bv1-brand-link" aria-label="Q2 — przejdz do Dashboardu">
      <Image
        src="/v/logo-bold.png"
        alt="Q2"
        width={size}
        height={size}
        priority
        unoptimized
        className="bv1-brand-img"
        style={{ width: size, height: "auto" }}
      />
      {showName && <span className="bv1-brand-name">Q2</span>}
    </Link>
  );
}
