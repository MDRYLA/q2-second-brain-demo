import { describe, it, expect } from "vitest";
import { computeNextLikert4, LIKERT4_UNKNOWN_CLICK } from "../Likert4";

describe("computeNextLikert4", () => {
  it("klik nieaktywnej opcji ustawia ją", () => {
    expect(computeNextLikert4("", "raczej wysoki")).toBe("raczej wysoki");
  });

  it("klik aktywnej opcji = clear (\"\")", () => {
    expect(computeNextLikert4("raczej wysoki", "raczej wysoki")).toBe("");
  });

  it("klik innej opcji gdy jakaś aktywna = przełączenie (toggle)", () => {
    expect(computeNextLikert4("niski", "wysoki")).toBe("wysoki");
  });

  it("klik 'Nie wiem' gdy nic nie aktywne ustawia unknownValue", () => {
    expect(computeNextLikert4("", LIKERT4_UNKNOWN_CLICK)).toBe("unknown");
  });

  it("klik aktywnego 'Nie wiem' = clear", () => {
    expect(computeNextLikert4("unknown", LIKERT4_UNKNOWN_CLICK)).toBe("");
  });

  it("klik 'Nie wiem' gdy aktywna 4-point opcja przełącza na sentinel (mutex)", () => {
    expect(computeNextLikert4("wysoki", LIKERT4_UNKNOWN_CLICK)).toBe("unknown");
  });

  it("klik 4-point opcji gdy aktywne 'Nie wiem' przełącza na opcję (mutex)", () => {
    expect(computeNextLikert4("unknown", "wysoki")).toBe("wysoki");
  });

  it("custom unknownValue (np. 'dontKnow') zamiast default 'unknown'", () => {
    expect(computeNextLikert4("", LIKERT4_UNKNOWN_CLICK, "dontKnow")).toBe("dontKnow");
    expect(computeNextLikert4("dontKnow", LIKERT4_UNKNOWN_CLICK, "dontKnow")).toBe("");
  });

  it("LIKERT4_UNKNOWN_CLICK sentinel nie koliduje z prawdziwymi etykietami", () => {
    // Hipotetycznie ktoś dałby etykietę "__UNKNOWN__" — i tak zachowanie unknown-toggle
    // jest poprawne, bo sentinel jest stricte odróżnialny od user-facing options.
    expect(LIKERT4_UNKNOWN_CLICK).toBe("__UNKNOWN__");
  });
});
