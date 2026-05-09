// Hand-drawn SVG ilustracje dla Bold v1 (Magazine cover).
// Style: organic crayon-feel, stroke 2-2.5px, line-cap round, kolory z palety wariantu.

interface IllProps {
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function TulipBouquet({ size = 120, color = "currentColor", className, style }: IllProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden
    >
      {/* lewa łodyga */}
      <path d="M 35 105 Q 33 80 38 60" />
      {/* środkowa łodyga */}
      <path d="M 60 110 Q 60 80 60 50" />
      {/* prawa łodyga */}
      <path d="M 85 105 Q 87 80 82 60" />
      {/* lewy tulipan */}
      <path d="M 38 60 Q 30 52 32 45 Q 38 48 40 50 Q 42 48 48 45 Q 50 52 42 60 Z" fill="var(--bv1-accent-yellow)" />
      {/* środkowy tulipan (wyższy) — czerwony */}
      <path d="M 60 50 Q 50 40 52 32 Q 58 36 60 38 Q 62 36 68 32 Q 70 40 62 50 Z" fill="var(--bv1-accent-red)" />
      {/* prawy tulipan */}
      <path d="M 82 60 Q 74 52 76 45 Q 82 48 84 50 Q 86 48 92 45 Q 94 52 86 60 Z" fill="var(--bv1-accent-yellow)" />
      {/* listki */}
      <path d="M 35 90 Q 25 85 22 78" />
      <path d="M 60 85 Q 70 80 73 73" />
      <path d="M 85 90 Q 95 85 98 78" />
    </svg>
  );
}

export function SunRays({ size = 80, color = "currentColor", className, style }: IllProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      className={className}
      style={style}
      aria-hidden
    >
      <circle cx="40" cy="40" r="14" fill="var(--bv1-accent-yellow)" />
      {/* uśmiech */}
      <path d="M 34 41 Q 40 47 46 41" stroke="var(--bv1-text-on-card)" strokeWidth="1.8" />
      {/* oczy */}
      <circle cx="35" cy="37" r="1.5" fill="var(--bv1-text-on-card)" stroke="none" />
      <circle cx="45" cy="37" r="1.5" fill="var(--bv1-text-on-card)" stroke="none" />
      {/* promienie */}
      <path d="M 40 12 L 40 22" />
      <path d="M 40 58 L 40 68" />
      <path d="M 12 40 L 22 40" />
      <path d="M 58 40 L 68 40" />
      <path d="M 22 22 L 28 28" />
      <path d="M 52 52 L 58 58" />
      <path d="M 22 58 L 28 52" />
      <path d="M 52 28 L 58 22" />
    </svg>
  );
}

export function MoonStars({ size = 80, color = "currentColor", className, style }: IllProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden
    >
      <path
        d="M 50 18 Q 30 22 28 42 Q 30 60 50 64 Q 38 56 36 42 Q 38 28 50 18 Z"
        fill="var(--bv1-accent-yellow)"
      />
      {/* gwiazdki */}
      <path d="M 18 24 L 18 30 M 15 27 L 21 27" stroke="var(--bv1-accent-red)" strokeWidth="2" />
      <path d="M 65 35 L 65 41 M 62 38 L 68 38" stroke="var(--bv1-accent-red)" strokeWidth="2" />
      <path d="M 22 60 L 22 66 M 19 63 L 25 63" stroke="var(--bv1-accent-red)" strokeWidth="2" />
    </svg>
  );
}

export function FlowerBloom({ size = 60, color = "currentColor", className, style }: IllProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 60 60"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      className={className}
      style={style}
      aria-hidden
    >
      {/* płatki */}
      <ellipse cx="30" cy="18" rx="6" ry="9" fill="var(--bv1-accent-red)" stroke="none" />
      <ellipse cx="30" cy="18" rx="6" ry="9" />
      <ellipse cx="30" cy="42" rx="6" ry="9" fill="var(--bv1-accent-red)" stroke="none" />
      <ellipse cx="30" cy="42" rx="6" ry="9" />
      <ellipse cx="18" cy="30" rx="9" ry="6" fill="var(--bv1-accent-red)" stroke="none" />
      <ellipse cx="18" cy="30" rx="9" ry="6" />
      <ellipse cx="42" cy="30" rx="9" ry="6" fill="var(--bv1-accent-red)" stroke="none" />
      <ellipse cx="42" cy="30" rx="9" ry="6" />
      {/* środek */}
      <circle cx="30" cy="30" r="5" fill="var(--bv1-accent-yellow)" stroke="var(--bv1-text-on-card)" strokeWidth="1.5" />
    </svg>
  );
}

export function ArchDecor({
  size = 200,
  color = "currentColor",
  className,
  style,
}: IllProps) {
  return (
    <svg
      width={size}
      height={size / 4}
      viewBox="0 0 200 50"
      fill="none"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden
    >
      {/* 4 arkady jak w logu */}
      <path d="M 10 50 L 10 28 Q 10 18 25 18 Q 40 18 40 28 L 40 50" />
      <path d="M 50 50 L 50 25 Q 50 14 65 14 Q 80 14 80 25 L 80 50" />
      <path d="M 90 50 L 90 25 Q 90 14 105 14 Q 120 14 120 25 L 120 50" />
      <path d="M 130 50 L 130 28 Q 130 18 145 18 Q 160 18 160 28 L 160 50" />
      {/* baseline */}
      <line x1="0" y1="50" x2="200" y2="50" />
      {/* kropki w arkadach */}
      <circle cx="25" cy="35" r="1.5" fill={color} />
      <circle cx="65" cy="32" r="1.5" fill={color} />
      <circle cx="105" cy="32" r="1.5" fill={color} />
      <circle cx="145" cy="35" r="1.5" fill={color} />
    </svg>
  );
}
