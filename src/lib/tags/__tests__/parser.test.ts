import { describe, it, expect } from "vitest";
import { extractTags, extractTagsMulti } from "../parser";

describe("extractTags", () => {
  it("zwraca pustą tablicę dla null/undefined/empty", () => {
    expect(extractTags(null)).toEqual([]);
    expect(extractTags(undefined)).toEqual([]);
    expect(extractTags("")).toEqual([]);
  });

  it("wyciąga proste tagi #xxx", () => {
    expect(extractTags("test #flow rzeczywiście")).toEqual(["flow"]);
    expect(extractTags("#praca-apka i #flow")).toEqual(["praca-apka", "flow"]);
  });

  it("akceptuje polskie znaki", () => {
    expect(extractTags("dziś #siłownia i #środa")).toEqual(["siłownia", "środa"]);
  });

  it("filtruje czysto numeryczne (np. #123 ID)", () => {
    expect(extractTags("Issue #123 done")).toEqual([]);
    expect(extractTags("#2026-04-29")).toEqual(["2026-04-29"]); // alphanumeric mix OK
  });

  it("deduplikuje powtórzenia", () => {
    expect(extractTags("#flow i #flow #FLOW")).toEqual(["flow"]);
  });

  it("lowercase output", () => {
    expect(extractTags("#FLOW #Praca")).toEqual(["flow", "praca"]);
  });

  it("ignoruje single-char tagi (#a) — wymagamy min 2 znaki", () => {
    expect(extractTags("#a #ab")).toEqual(["ab"]);
  });

  it("max length tagu ograniczona przez regex (nie nieskończona)", () => {
    const long = "#" + "a".repeat(60);
    const tags = extractTags(long);
    expect(tags.length).toBe(1);
    expect(tags[0].length).toBeLessThanOrEqual(31); // regex {1,30} po pierwszym znaku = max 31 chars
  });
});

describe("extractTagsMulti", () => {
  it("łączy tagi z wielu pól, deduplikuje", () => {
    expect(extractTagsMulti("#flow", "#praca", "#flow")).toEqual(["flow", "praca"]);
  });
  it("ignoruje pola undefined/null", () => {
    expect(extractTagsMulti("#flow", undefined, "#praca", null)).toEqual(["flow", "praca"]);
  });
});
