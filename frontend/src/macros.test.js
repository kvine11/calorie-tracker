import { describe, expect, it } from "vitest";
import { energySplit, formatGrams, hasMacros, macroTotals, scaleMacro } from "./macros.js";

// The distinction the whole macro feature rests on: null is "nobody knows"
// (a meal typed by hand), 0 is "the food database says zero" (chicken has no
// carbs). Collapsing the two would quietly turn unknowns into claims.
describe("hasMacros", () => {
  it("is false when every macro is unknown", () => {
    expect(hasMacros({ protein: null, carbs: null, fats: null })).toBe(false);
  });

  it("is true when a macro is a real zero", () => {
    expect(hasMacros({ protein: null, carbs: 0, fats: null })).toBe(true);
  });

  it("is true when only one macro is known", () => {
    expect(hasMacros({ protein: 31.02, carbs: null, fats: null })).toBe(true);
  });
});

describe("scaleMacro", () => {
  // Mirrors MealEntryService.scale on the backend, rounding included. If these
  // drift, the same meal shows different grams depending on whether the form
  // scaled it or the server did.
  it("rounds to two decimals, the same as the backend", () => {
    expect(scaleMacro(31.02, 2)).toBe(62.04);
    expect(scaleMacro(3.57, 1 / 3)).toBe(1.19);
    expect(scaleMacro(10, 0.333)).toBe(3.33);
  });

  it("leaves an unknown macro unknown at any ratio", () => {
    expect(scaleMacro(null, 2)).toBeNull();
    expect(scaleMacro(undefined, 2)).toBeNull();
  });

  it("keeps a real zero at zero rather than making it unknown", () => {
    expect(scaleMacro(0, 5)).toBe(0);
  });
});

describe("macroTotals", () => {
  it("sums each macro independently, skipping only that macro's nulls", () => {
    const totals = macroTotals([
      { protein: 10, carbs: 20, fats: 5 },
      { protein: 5, carbs: null, fats: 2 },
    ]);

    // The second meal's missing carbs must not discard its protein and fat.
    expect(totals).toMatchObject({ protein: 15, carbs: 20, fats: 7 });
  });

  it("counts only the meals that contributed something", () => {
    const totals = macroTotals([
      { protein: 10, carbs: 20, fats: 5 },
      { protein: null, carbs: null, fats: null },
      { protein: null, carbs: 0, fats: null },
    ]);

    expect(totals.withData).toBe(2);
  });

  it("is all zeros for an empty day", () => {
    expect(macroTotals([])).toEqual({ protein: 0, carbs: 0, fats: 0, withData: 0 });
  });
});

describe("energySplit", () => {
  it("converts grams to calories at 4/4/9", () => {
    const { energy, sum } = energySplit({ protein: 10, carbs: 10, fats: 10 });

    expect(energy).toEqual({ protein: 40, carbs: 40, fats: 90 });
    expect(sum).toBe(170);
  });

  it("reports each macro's share of the energy, not of the grams", () => {
    const { share } = energySplit({ protein: 10, carbs: 10, fats: 10 });

    // Equal grams, unequal energy — fat is more than half despite being a third
    // of the mass. That gap is the reason the bar is drawn by energy.
    expect(share("fats")).toBeCloseTo(90 / 170);
    expect(share("protein")).toBeCloseTo(40 / 170);
  });

  it("returns a zero share instead of dividing by zero", () => {
    const { share } = energySplit({ protein: 0, carbs: 0, fats: 0 });

    expect(share("protein")).toBe(0);
  });
});

describe("formatGrams", () => {
  it("writes grams the way a nutrition label does", () => {
    expect(formatGrams(31.024)).toBe("31");
    expect(formatGrams(3.57)).toBe("3.6");
    expect(formatGrams(28)).toBe("28");
    expect(formatGrams(0)).toBe("0");
  });

  it("shows a dash for an unknown macro", () => {
    expect(formatGrams(null)).toBe("—");
    expect(formatGrams(undefined)).toBe("—");
  });
});
