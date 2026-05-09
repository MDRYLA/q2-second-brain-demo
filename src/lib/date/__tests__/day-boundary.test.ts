import { describe, it, expect } from "vitest";
import { getLogicalDate, getLogicalDateString, DAY_BOUNDARY_HOUR } from "../day-boundary";

// Helpers — local-date assertions (avoid toISOString TZ pitfalls).
function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

describe("getLogicalDate — 3AM boundary", () => {
  it("02:30 returns previous calendar day", () => {
    const ts = new Date("2026-04-24T02:30:00");
    const result = getLogicalDate(ts);
    expect(toLocalDateString(result)).toBe("2026-04-23");
  });

  it("03:01 returns the same calendar day", () => {
    const ts = new Date("2026-04-24T03:01:00");
    const result = getLogicalDate(ts);
    expect(toLocalDateString(result)).toBe("2026-04-24");
  });

  it("00:00 returns previous calendar day", () => {
    const ts = new Date("2026-04-24T00:00:00");
    const result = getLogicalDate(ts);
    expect(toLocalDateString(result)).toBe("2026-04-23");
  });

  it("03:00 exactly is still treated as same day (boundary = strict <)", () => {
    const ts = new Date("2026-04-24T03:00:00");
    const result = getLogicalDate(ts);
    expect(toLocalDateString(result)).toBe("2026-04-24");
  });

  it("23:59 returns same day", () => {
    const ts = new Date("2026-04-24T23:59:59");
    const result = getLogicalDate(ts);
    expect(toLocalDateString(result)).toBe("2026-04-24");
  });

  it("returns midnight (00:00:00.000) of the logical day", () => {
    const ts = new Date("2026-04-24T01:45:00");
    const result = getLogicalDate(ts);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
    expect(result.getMilliseconds()).toBe(0);
  });

  it("DAY_BOUNDARY_HOUR is 3", () => {
    expect(DAY_BOUNDARY_HOUR).toBe(3);
  });
});

describe("getLogicalDateString", () => {
  it("returns YYYY-MM-DD string", () => {
    const ts = new Date("2026-04-24T14:00:00");
    expect(getLogicalDateString(ts)).toBe("2026-04-24");
  });

  it("02:30 → previous day as string", () => {
    const ts = new Date("2026-04-24T02:30:00");
    expect(getLogicalDateString(ts)).toBe("2026-04-23");
  });

  it("zero-pads month and day", () => {
    const ts = new Date("2026-01-09T10:00:00");
    expect(getLogicalDateString(ts)).toBe("2026-01-09");
  });
});
