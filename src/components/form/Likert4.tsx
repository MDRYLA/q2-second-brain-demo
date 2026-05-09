"use client";

interface Likert4Props {
  label: string;
  name: string;
  options: [string, string, string, string];
  value: string;
  unknownValue?: string;
  onChange: (v: string) => void;
  allowUnknown?: boolean;
  showOptional?: boolean;
}

// Sentinel klik — przekazywany do computeNextLikert4 zamiast którejś z 4 opcji.
export const LIKERT4_UNKNOWN_CLICK = "__UNKNOWN__" as const;

// Pure logika toggle dla 4 opcji + sentinel "Nie wiem". Testowana w __tests__/Likert4.test.ts.
// Klik aktywnej opcji = clear (""). Sentinel mutually exclusive z 4 opcjami.
export function computeNextLikert4(
  current: string,
  clicked: string,
  unknownValue: string = "unknown",
): string {
  if (clicked === LIKERT4_UNKNOWN_CLICK) {
    return current === unknownValue ? "" : unknownValue;
  }
  return current === clicked ? "" : clicked;
}

// Forced 4-point Likert + sentinel "Nie wiem" — anti-acquiescence (Krosnick;
export function Likert4({
  label,
  name,
  options,
  value,
  unknownValue = "unknown",
  onChange,
  allowUnknown = true,
  showOptional,
}: Likert4Props) {
  const isUnknown = value === unknownValue;
  return (
    <div className="ci-field" role="group" aria-label={label}>
      {label && (
        <span className="ci-field-label">
          {label}
          {showOptional && (
            <>
              {" "}
              <span className="opt-tag">opcjonalne</span>
            </>
          )}
        </span>
      )}
      <div className="ci-word-choice">
        {options.map((opt) => {
          const isActive = value === opt;
          return (
            <label key={opt} className={`ci-word-btn${isActive ? " active" : ""}`}>
              <input
                type="radio"
                name={name}
                value={opt}
                checked={isActive}
                onChange={() => onChange(computeNextLikert4(value, opt, unknownValue))}
                className="sr-only"
              />
              {opt}
            </label>
          );
        })}
      </div>
      {allowUnknown && (
        <button
          type="button"
          className={`ci-word-btn${isUnknown ? " active" : ""}`}
          style={{ marginTop: 8 }}
          onClick={() => onChange(computeNextLikert4(value, LIKERT4_UNKNOWN_CLICK, unknownValue))}
          aria-pressed={isUnknown}
        >
          Nie wiem
        </button>
      )}
    </div>
  );
}
