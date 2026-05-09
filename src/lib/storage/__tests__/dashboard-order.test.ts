// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import {
  DEFAULT_ORDER,
  getDashboardOrder,
  setDashboardOrder,
  resetDashboardOrder,
} from "../dashboard-order";

afterEach(() => {
  resetDashboardOrder();
});

describe("dashboard-order", () => {
  it("returns DEFAULT_ORDER when storage empty", () => {
    expect(getDashboardOrder()).toEqual(DEFAULT_ORDER);
  });

  it("persists and rehydrates a custom order", () => {
    const custom = [
      "quick-tick",
      "checkin-card",
      "checkout-card",
      "next-tasks",
      "weekly-progress",
      "quick-links",
    ] as const;
    setDashboardOrder([...custom]);
    expect(getDashboardOrder()).toEqual([...custom]);
  });

  it("filters out invalid ids and appends missing defaults", () => {
    // Simulate user with old persisted state missing a section + a typo.
    localStorage.setItem(
      "sb-dashboard-order",
      JSON.stringify(["checkin-card", "plan-today", "OLD_BOGUS_KEY", "quick-tick"]),
    );
    const result = getDashboardOrder();
    expect(result).toContain("checkin-card");
    expect(result).toContain("quick-tick");
    // Missing defaults appended.
    expect(result).toContain("checkout-card");
    expect(result).toContain("next-tasks");
    expect(result).toContain("quick-links");
    // Bogus + legacy removed.
    expect(result).not.toContain("OLD_BOGUS_KEY");
    expect(result).not.toContain("plan-today");
  });

  it("returns DEFAULT_ORDER on corrupted JSON", () => {
    localStorage.setItem("sb-dashboard-order", "{not-json");
    expect(getDashboardOrder()).toEqual(DEFAULT_ORDER);
  });

  it("returns DEFAULT_ORDER if stored value is not an array", () => {
    localStorage.setItem("sb-dashboard-order", JSON.stringify({ foo: 1 }));
    expect(getDashboardOrder()).toEqual(DEFAULT_ORDER);
  });
});
