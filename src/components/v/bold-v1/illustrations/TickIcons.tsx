// Hand-drawn SVG ikonki dla Quick tick — kwiatek wykonujący aktywność.
// Kolor: currentColor (czerwony lub cream zależnie od stanu).

interface IconProps {
  size?: number;
  className?: string;
}

const STROKE = 2.2;
const HEAD_FILL = "var(--bv1-accent-yellow)";
const STEM_FILL = "var(--bv1-accent-red)";

// Kwiatek się rozciąga — listki rozłożone na boki, główka ku górze
export function FlowerStretch({ size = 36, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none" className={className} aria-hidden>
      {/* główka kwiatka — uniesiona */}
      <ellipse cx="30" cy="14" rx="8" ry="9" fill={HEAD_FILL} stroke="currentColor" strokeWidth={STROKE} strokeLinejoin="round" />
      {/* uśmiech */}
      <path d="M 26 14 Q 30 17 34 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      <circle cx="27" cy="11.5" r="0.8" fill="currentColor" />
      <circle cx="33" cy="11.5" r="0.8" fill="currentColor" />
      {/* łodyga */}
      <path d="M 30 23 L 30 50" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" />
      {/* dwa rozłożone liście (yoga arms) */}
      <path d="M 30 32 Q 14 30 8 22" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" fill="none" />
      <path d="M 30 32 Q 46 30 52 22" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" fill="none" />
      {/* drobne listki na końcach */}
      <ellipse cx="8" cy="22" rx="3" ry="2" fill="currentColor" transform="rotate(-30 8 22)" />
      <ellipse cx="52" cy="22" rx="3" ry="2" fill="currentColor" transform="rotate(30 52 22)" />
      {/* podstawa (ziemia) */}
      <path d="M 22 50 Q 30 53 38 50" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" fill="none" />
    </svg>
  );
}

// Siłownia — kwiatek z hantlami (kółka po bokach, łodyga uniesiona)
export function FlowerGym({ size = 36, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none" className={className} aria-hidden>
      {/* główka */}
      <ellipse cx="30" cy="20" rx="7" ry="8" fill={HEAD_FILL} stroke="currentColor" strokeWidth={STROKE} strokeLinejoin="round" />
      <circle cx="27" cy="18" r="0.8" fill="currentColor" />
      <circle cx="33" cy="18" r="0.8" fill="currentColor" />
      <path d="M 27 21 Q 30 23 33 21" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      {/* łodyga */}
      <path d="M 30 28 L 30 50" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" />
      {/* dwa ramiona "ręce" w bok */}
      <path d="M 30 33 L 14 33" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" />
      <path d="M 30 33 L 46 33" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" />
      {/* hantle (ciężary kółka) */}
      <circle cx="10" cy="33" r="5" fill={STEM_FILL} stroke="currentColor" strokeWidth={STROKE} />
      <circle cx="50" cy="33" r="5" fill={STEM_FILL} stroke="currentColor" strokeWidth={STROKE} />
      {/* podstawa */}
      <path d="M 22 50 Q 30 53 38 50" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" fill="none" />
    </svg>
  );
}

// Rower — kwiatek na rowerze (2 kółka pod łodygą)
export function FlowerCycle({ size = 36, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none" className={className} aria-hidden>
      {/* główka */}
      <ellipse cx="30" cy="14" rx="6" ry="7" fill={HEAD_FILL} stroke="currentColor" strokeWidth={STROKE} strokeLinejoin="round" />
      <circle cx="27.5" cy="13" r="0.7" fill="currentColor" />
      <circle cx="32.5" cy="13" r="0.7" fill="currentColor" />
      <path d="M 27 15.5 Q 30 17 33 15.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      {/* łodyga */}
      <path d="M 30 21 L 30 35" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" />
      {/* listki */}
      <path d="M 30 27 Q 22 26 18 22" stroke="currentColor" strokeWidth={STROKE - 0.4} strokeLinecap="round" fill="none" />
      <path d="M 30 27 Q 38 26 42 22" stroke="currentColor" strokeWidth={STROKE - 0.4} strokeLinecap="round" fill="none" />
      {/* rower — rama (trójkąt) */}
      <path d="M 16 48 L 30 35 L 44 48" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M 30 35 L 30 48" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" />
      {/* koła */}
      <circle cx="16" cy="49" r="6" fill="none" stroke="currentColor" strokeWidth={STROKE} />
      <circle cx="44" cy="49" r="6" fill="none" stroke="currentColor" strokeWidth={STROKE} />
      <circle cx="16" cy="49" r="1" fill="currentColor" />
      <circle cx="44" cy="49" r="1" fill="currentColor" />
    </svg>
  );
}

// Czytanie — kwiatek z otwartą książką
export function FlowerBook({ size = 36, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none" className={className} aria-hidden>
      {/* główka */}
      <ellipse cx="30" cy="16" rx="7" ry="8" fill={HEAD_FILL} stroke="currentColor" strokeWidth={STROKE} strokeLinejoin="round" />
      {/* oczy zamknięte (skupione na książce) */}
      <path d="M 26 16 Q 28 17.5 30 16" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <path d="M 30 16 Q 32 17.5 34 16" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <path d="M 27 19 Q 30 20.5 33 19" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      {/* łodyga */}
      <path d="M 30 24 L 30 36" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" />
      {/* otwarta książka pod kwiatkiem */}
      <path d="M 12 36 L 30 38 L 30 52 L 12 50 Z" fill="white" stroke="currentColor" strokeWidth={STROKE} strokeLinejoin="round" />
      <path d="M 48 36 L 30 38 L 30 52 L 48 50 Z" fill="white" stroke="currentColor" strokeWidth={STROKE} strokeLinejoin="round" />
      {/* linijki tekstu */}
      <path d="M 16 42 L 27 43" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M 16 46 L 27 47" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M 33 43 L 44 42" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M 33 47 L 44 46" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

// Mata akupresury — kwiatek leży na macie z kropkami
export function FlowerMat({ size = 36, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none" className={className} aria-hidden>
      {/* mata — prostokąt z zaokrąglonymi rogami z punkcikami */}
      <rect x="6" y="32" width="48" height="20" rx="3" fill={STEM_FILL} stroke="currentColor" strokeWidth={STROKE} />
      {/* kropki akupresury (3x6 grid) */}
      {[12, 20, 28, 36, 44, 52].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="38" r="0.9" fill="currentColor" />
          <circle cx={cx} cy="44" r="0.9" fill="currentColor" />
          <circle cx={cx} cy="50" r="0.9" fill="currentColor" />
        </g>
      ))}
      {/* kwiatek leżący — główka po lewej */}
      <ellipse cx="14" cy="20" rx="7" ry="8" fill={HEAD_FILL} stroke="currentColor" strokeWidth={STROKE} strokeLinejoin="round" transform="rotate(-90 14 20)" />
      <circle cx="14" cy="18" r="0.8" fill="currentColor" />
      <circle cx="14" cy="22" r="0.8" fill="currentColor" />
      <path d="M 11 20 Q 12.5 22 14 22.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      {/* łodyga pozioma */}
      <path d="M 22 20 L 50 20" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" />
      {/* listki */}
      <ellipse cx="32" cy="14" rx="4" ry="2.5" fill="currentColor" transform="rotate(15 32 14)" />
      <ellipse cx="42" cy="26" rx="4" ry="2.5" fill="currentColor" transform="rotate(-15 42 26)" />
    </svg>
  );
}

// Inne (spacer/bieg) — kwiatek z gwiazdkami (ruch, energia)
export function FlowerOther({ size = 36, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none" className={className} aria-hidden>
      {/* główka */}
      <ellipse cx="30" cy="22" rx="7" ry="8" fill={HEAD_FILL} stroke="currentColor" strokeWidth={STROKE} strokeLinejoin="round" />
      <circle cx="27" cy="20" r="0.8" fill="currentColor" />
      <circle cx="33" cy="20" r="0.8" fill="currentColor" />
      <path d="M 26 23 Q 30 25 34 23" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      {/* łodyga */}
      <path d="M 30 30 L 30 50" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" />
      {/* listki */}
      <path d="M 30 38 Q 22 36 18 32" stroke="currentColor" strokeWidth={STROKE - 0.4} strokeLinecap="round" fill="none" />
      <path d="M 30 38 Q 38 36 42 32" stroke="currentColor" strokeWidth={STROKE - 0.4} strokeLinecap="round" fill="none" />
      {/* podstawa */}
      <path d="M 22 50 Q 30 53 38 50" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" fill="none" />
      {/* gwiazdki dookoła (ruch, energia) */}
      <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none">
        <path d="M 6 12 L 6 18 M 3 15 L 9 15" />
        <path d="M 50 6 L 50 12 M 47 9 L 53 9" />
        <path d="M 8 38 L 8 44 M 5 41 L 11 41" />
        <path d="M 52 40 L 52 46 M 49 43 L 55 43" />
      </g>
    </svg>
  );
}
