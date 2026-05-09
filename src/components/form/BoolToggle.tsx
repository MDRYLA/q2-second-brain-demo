"use client";

interface BoolToggleProps {
  label: string;
  value: boolean | undefined;
  onChange: (v: boolean | undefined) => void;
  name: string;
  showOptional?: boolean;
}

// Trzy stany: undefined (nieustawione) / true / false.
// Klik na aktywne = clear (powrót do undefined).
export function BoolToggle({ label, value, onChange, name, showOptional }: BoolToggleProps) {
  return (
    <div className="ci-field" role="group" aria-label={label}>
      {label && (
        <span className="ci-field-label">
          {label}
          {showOptional && <> <span className="opt-tag">opcjonalne</span></>}
        </span>
      )}
      <div className="ci-word-choice">
        {(["tak", "nie"] as const).map((opt) => {
          const isActive = value === (opt === "tak");
          return (
            <label key={opt} className={`ci-word-btn${isActive ? " active" : ""}`}>
              <input
                type="radio"
                name={name}
                checked={isActive}
                onChange={() => onChange(isActive ? undefined : opt === "tak")}
                className="sr-only"
              />
              {opt}
            </label>
          );
        })}
      </div>
    </div>
  );
}
