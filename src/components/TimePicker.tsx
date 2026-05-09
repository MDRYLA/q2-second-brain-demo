"use client";

interface TimePickerProps {
  value: string;             // "HH:MM" lub ""
  onChange: (value: string) => void;
  ariaLabel?: string;
  className?: string;
  /** Step in minutes for MM select (default 5). */
  stepMinutes?: 5 | 10 | 15 | 30;
  /** Min godzina (0-23). Default 0. Ogranicza dropdown do realistic range (sesja 14). */
  minHour?: number;
  /** Max godzina (0-23). Default 23. */
  maxHour?: number;
}

/**
 * Custom time picker — 2 select (HH 00-23 + MM step 5/10/15/30).
 * Native <input type="time"> step={300} jest IGNOROWANY przez Safari i wiele przegladarek
 * — wpis dowolnej minuty pozostaje mozliwy. Ten komponent wymusza 5-min granularnosc.
 *
 * Value format: "HH:MM" (zgodny z native time input — backward compat z istniejacym kodem).
 */
export function TimePicker({
  value,
  onChange,
  ariaLabel,
  className,
  stepMinutes = 5,
  minHour = 0,
  maxHour = 23,
}: TimePickerProps) {
  const [hh = "", mm = ""] = value.split(":");

  const updateHH = (newHH: string) => {
    if (!newHH) {
      // Clear both
      onChange("");
      return;
    }
    onChange(`${newHH}:${mm || "00"}`);
  };

  const updateMM = (newMM: string) => {
    if (!hh) {
      // Set hour to 00 if user picked minutes first
      onChange(`00:${newMM}`);
      return;
    }
    onChange(`${hh}:${newMM}`);
  };

  const hourCount = Math.max(0, maxHour - minHour + 1);
  const hours = Array.from({ length: hourCount }, (_, i) =>
    String(minHour + i).padStart(2, "0")
  );
  const minuteCount = 60 / stepMinutes;
  const minutes = Array.from({ length: minuteCount }, (_, i) =>
    String(i * stepMinutes).padStart(2, "0"),
  );

  return (
    <span className={`time-picker${className ? ` ${className}` : ""}`} role="group" aria-label={ariaLabel}>
      <select
        className="time-picker-select"
        value={hh}
        onChange={(e) => updateHH(e.target.value)}
        aria-label={ariaLabel ? `${ariaLabel} — godzina` : "Godzina"}
      >
        <option value="">--</option>
        {hours.map((h) => (
          <option key={h} value={h}>{h}</option>
        ))}
      </select>
      <span className="time-picker-sep">:</span>
      <select
        className="time-picker-select"
        value={mm}
        onChange={(e) => updateMM(e.target.value)}
        aria-label={ariaLabel ? `${ariaLabel} — minuty` : "Minuty"}
      >
        <option value="">--</option>
        {minutes.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
    </span>
  );
}
