"use client";

interface RatingRowProps {
  value: number;
  onChange: (v: number) => void;
  label: string;
  showOptional?: boolean;
  max?: number; // domyślnie 5; sesja 19 Krok 3 — sleepQuality forced 4-point (eliminacja midpoint).
  testIdPrefix?: string; // sesja 19 Krok 3 — stable E2E selector zamiast nth-child.
}

// Skala 1-N (default 5; PSQI-inspired). Klik na aktywną wartość = clear (0).
// Aria-label na wrapperze, span tylko gdy label niepusty.
export function RatingRow({ value, onChange, label, showOptional, max = 5, testIdPrefix = "rating-btn" }: RatingRowProps) {
  const buttons = Array.from({ length: max }, (_, i) => i + 1);
  return (
    <div className="ci-rating-row" role="group" aria-label={label}>
      {label && (
        <span className="ci-field-label">
          {label}
          {showOptional && <> <span className="opt-tag">opcjonalne</span></>}
        </span>
      )}
      <div className="ci-rating-btns">
        {buttons.map((n) => (
          <button
            key={n}
            type="button"
            className={`ci-rating-btn${value === n ? " active" : ""}`}
            onClick={() => onChange(value === n ? 0 : n)}
            aria-pressed={value === n}
            data-testid={`${testIdPrefix}-${n}`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
