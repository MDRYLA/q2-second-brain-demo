"use client";

interface WordChoiceProps {
  name: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}

// Single-select chip group (radio inputs visually styled jako chipy).
// Klik na aktywną opcję = clear (puste "" w state).
// Używane w check-in/check-out dla wyboru typu emocji, mood word, częściowo etc.
export function WordChoice({ name, options, value, onChange }: WordChoiceProps) {
  return (
    <div className="ci-word-choice">
      {options.map((opt) => (
        <label
          key={opt}
          className={`ci-word-btn${value === opt ? " active" : ""}`}
        >
          <input
            type="radio"
            name={name}
            value={opt}
            checked={value === opt}
            onChange={() => onChange(value === opt ? "" : opt)}
            className="sr-only"
          />
          {opt}
        </label>
      ))}
    </div>
  );
}
