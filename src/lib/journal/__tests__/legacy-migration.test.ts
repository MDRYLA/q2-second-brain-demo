import { describe, it, expect } from "vitest";
import {
  applyLegacyMood,
  LEGACY_MOOD_MAP_IN,
  LEGACY_MOOD_MAP_OUT,
  LEGACY_ADHERENCE_MAP,
  LEGACY_KNOWLEDGE_MAP,
  mapLegacyProactivity,
  mergeLegacyEvening,
} from "../legacy-migration";

describe("applyLegacyMood + LEGACY_MOOD_MAP_IN (mood/energy check-in)", () => {
  it("środkowe wartości 5-point → 'unknown'", () => {
    expect(applyLegacyMood("średni", LEGACY_MOOD_MAP_IN)).toBe("unknown");
    expect(applyLegacyMood("średnia", LEGACY_MOOD_MAP_IN)).toBe("unknown");
  });

  it("krańcowe wartości 5-point passthrough", () => {
    expect(applyLegacyMood("niski", LEGACY_MOOD_MAP_IN)).toBe("niski");
    expect(applyLegacyMood("wysoki", LEGACY_MOOD_MAP_IN)).toBe("wysoki");
    expect(applyLegacyMood("niska", LEGACY_MOOD_MAP_IN)).toBe("niska");
    expect(applyLegacyMood("wysoka", LEGACY_MOOD_MAP_IN)).toBe("wysoka");
  });

  it("średnio-niski/wysoki → raczej niski/wysoki", () => {
    expect(applyLegacyMood("średnio-niski", LEGACY_MOOD_MAP_IN)).toBe("raczej niski");
    expect(applyLegacyMood("średnio-wysoki", LEGACY_MOOD_MAP_IN)).toBe("raczej wysoki");
  });

  it("pusty value → pusty (clear)", () => {
    expect(applyLegacyMood("", LEGACY_MOOD_MAP_IN)).toBe("");
  });

  it("nieznana wartość passthrough (np. już zmigrowane)", () => {
    expect(applyLegacyMood("unknown", LEGACY_MOOD_MAP_IN)).toBe("unknown");
    expect(applyLegacyMood("raczej niski", LEGACY_MOOD_MAP_IN)).toBe("raczej niski");
  });
});

describe("LEGACY_MOOD_MAP_OUT (mood/energy check-out)", () => {
  it("'neutralny' (środek) → 'unknown'", () => {
    expect(applyLegacyMood("neutralny", LEGACY_MOOD_MAP_OUT)).toBe("unknown");
  });

  it("zły/dobry passthrough; średnio zły/dobry → raczej", () => {
    expect(applyLegacyMood("zły", LEGACY_MOOD_MAP_OUT)).toBe("zły");
    expect(applyLegacyMood("dobry", LEGACY_MOOD_MAP_OUT)).toBe("dobry");
    expect(applyLegacyMood("średnio zły", LEGACY_MOOD_MAP_OUT)).toBe("raczej zły");
    expect(applyLegacyMood("średnio dobry", LEGACY_MOOD_MAP_OUT)).toBe("raczej dobry");
  });

  it("energyEndWord 4 wartości passthrough", () => {
    expect(applyLegacyMood("wyczerpany", LEGACY_MOOD_MAP_OUT)).toBe("wyczerpany");
    expect(applyLegacyMood("zmęczony", LEGACY_MOOD_MAP_OUT)).toBe("zmęczony");
    expect(applyLegacyMood("naładowany", LEGACY_MOOD_MAP_OUT)).toBe("naładowany");
    expect(applyLegacyMood("pełen energii", LEGACY_MOOD_MAP_OUT)).toBe("pełen energii");
  });
});

describe("LEGACY_ADHERENCE_MAP (constitutionAdherence)", () => {
  it("'częściowo' (klasyczny midpoint W18) → 'unknown'", () => {
    expect(applyLegacyMood("częściowo", LEGACY_ADHERENCE_MAP)).toBe("unknown");
  });

  it("'głównie brak'/'głównie zgodnie' → 'raczej brak'/'raczej zgodnie'", () => {
    expect(applyLegacyMood("głównie brak", LEGACY_ADHERENCE_MAP)).toBe("raczej brak");
    expect(applyLegacyMood("głównie zgodnie", LEGACY_ADHERENCE_MAP)).toBe("raczej zgodnie");
  });

  it("'unknown' (sesja 18 sentinel) passthrough", () => {
    expect(applyLegacyMood("unknown", LEGACY_ADHERENCE_MAP)).toBe("unknown");
  });
});

describe("LEGACY_KNOWLEDGE_MAP (knowledgeApplied)", () => {
  it("'częściowo' (3-stop legacy lub 5-stop midpoint) → 'unknown'", () => {
    expect(applyLegacyMood("częściowo", LEGACY_KNOWLEDGE_MAP)).toBe("unknown");
  });

  it("nie/raczej nie/raczej tak/tak passthrough", () => {
    expect(applyLegacyMood("nie", LEGACY_KNOWLEDGE_MAP)).toBe("nie");
    expect(applyLegacyMood("raczej nie", LEGACY_KNOWLEDGE_MAP)).toBe("raczej nie");
    expect(applyLegacyMood("raczej tak", LEGACY_KNOWLEDGE_MAP)).toBe("raczej tak");
    expect(applyLegacyMood("tak", LEGACY_KNOWLEDGE_MAP)).toBe("tak");
  });
});

describe("mapLegacyProactivity (1-5 → 4 booleany + unknown)", () => {
  it("undefined / 0 → wszystko false (pusty stan)", () => {
    expect(mapLegacyProactivity(undefined)).toEqual({
      startedFirst: false, saidNo: false, changedPlan: false, ownedMistake: false, unknown: false,
    });
    expect(mapLegacyProactivity(0)).toEqual({
      startedFirst: false, saidNo: false, changedPlan: false, ownedMistake: false, unknown: false,
    });
  });

  it("-1 (sesja 18 sentinel 'Nie wiem') → unknown:true", () => {
    expect(mapLegacyProactivity(-1)).toEqual({
      startedFirst: false, saidNo: false, changedPlan: false, ownedMistake: false, unknown: true,
    });
  });

  it(">=4 → wszystkie 4 zachowania ✓", () => {
    expect(mapLegacyProactivity(4)).toEqual({
      startedFirst: true, saidNo: true, changedPlan: true, ownedMistake: true, unknown: false,
    });
    expect(mapLegacyProactivity(5)).toEqual({
      startedFirst: true, saidNo: true, changedPlan: true, ownedMistake: true, unknown: false,
    });
  });

  it("=3 (klasyczny midpoint W18) → 2 ✓ (startedFirst + ownedMistake)", () => {
    expect(mapLegacyProactivity(3)).toEqual({
      startedFirst: true, saidNo: false, changedPlan: false, ownedMistake: true, unknown: false,
    });
  });

  it("≤2 → 0 ✓ (low-proactivity dzień)", () => {
    expect(mapLegacyProactivity(1)).toEqual({
      startedFirst: false, saidNo: false, changedPlan: false, ownedMistake: false, unknown: false,
    });
    expect(mapLegacyProactivity(2)).toEqual({
      startedFirst: false, saidNo: false, changedPlan: false, ownedMistake: false, unknown: false,
    });
  });
});

describe("mergeLegacyEvening (whatWorked+Failed+Discovered → eveningReview)", () => {
  it("brak danych → pusty review, wszystkie tagi false", () => {
    expect(mergeLegacyEvening()).toEqual({
      review: "", worked: false, failed: false, discovered: false,
    });
    expect(mergeLegacyEvening("", "", "")).toEqual({
      review: "", worked: false, failed: false, discovered: false,
    });
  });

  it("tylko whatWorked → review z labelem + tag worked:true", () => {
    expect(mergeLegacyEvening("zrobiłem deploy", "", "")).toEqual({
      review: "Co zadziałało: zrobiłem deploy",
      worked: true, failed: false, discovered: false,
    });
  });

  it("wszystkie 3 → join z \\n\\n między sekcjami + 3 tagi true", () => {
    const out = mergeLegacyEvening("deploy", "kolokwium", "lubię flow");
    expect(out.worked).toBe(true);
    expect(out.failed).toBe(true);
    expect(out.discovered).toBe(true);
    expect(out.review).toBe(
      "Co zadziałało: deploy\n\nCo nie wyszło: kolokwium\n\nOdkryłem: lubię flow",
    );
  });

  it("whitespace-only treated as empty", () => {
    expect(mergeLegacyEvening("   ", "\n\t  ", "real text")).toEqual({
      review: "Odkryłem: real text",
      worked: false, failed: false, discovered: true,
    });
  });
});
