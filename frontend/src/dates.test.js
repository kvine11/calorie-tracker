import { describe, expect, it } from "vitest";
import { iso, longDate, parseISO, shiftISO, todayISO, weekOf } from "./dates.js";

// Two real bugs live here, both documented in CLAUDE.md:
//   1. `new Date("2026-08-07")` parses as UTC midnight, which reads back as the
//      previous day west of Greenwich.
//   2. Looping setDate() on one mutating Date breaks across a month boundary.
// These tests exist so neither can come back unnoticed.

describe("parseISO", () => {
  it("parses to local midnight, not UTC midnight", () => {
    const date = parseISO("2026-08-07");

    // Read back with local getters: the day must survive the round trip in any
    // timezone. `new Date("2026-08-07")` fails this west of UTC.
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(7);
    expect(date.getDate()).toBe(7);
    expect(date.getHours()).toBe(0);
  });

  it("round-trips through iso() unchanged", () => {
    for (const day of ["2026-01-01", "2026-02-28", "2026-08-07", "2026-12-31"]) {
      expect(iso(parseISO(day))).toBe(day);
    }
  });
});

describe("shiftISO", () => {
  it("moves within a month", () => {
    expect(shiftISO("2026-08-07", 1)).toBe("2026-08-08");
    expect(shiftISO("2026-08-07", -1)).toBe("2026-08-06");
  });

  it("crosses a month boundary in both directions", () => {
    expect(shiftISO("2026-08-31", 1)).toBe("2026-09-01");
    expect(shiftISO("2026-09-01", -1)).toBe("2026-08-31");
  });

  it("crosses a year boundary", () => {
    expect(shiftISO("2026-12-31", 1)).toBe("2027-01-01");
    expect(shiftISO("2027-01-01", -1)).toBe("2026-12-31");
  });

  it("handles a leap day", () => {
    expect(shiftISO("2028-02-28", 1)).toBe("2028-02-29");
    expect(shiftISO("2028-02-29", 1)).toBe("2028-03-01");
  });

  it("moves a whole week, which is what History asks for", () => {
    expect(shiftISO("2026-09-13", -6)).toBe("2026-09-07");
  });
});

describe("weekOf", () => {
  it("returns seven consecutive days starting on Sunday", () => {
    const days = weekOf("2026-09-09").map(iso);

    expect(days).toEqual([
      "2026-09-06",
      "2026-09-07",
      "2026-09-08",
      "2026-09-09",
      "2026-09-10",
      "2026-09-11",
      "2026-09-12",
    ]);
  });

  it("stays consecutive across a month boundary", () => {
    // The mutating-Date bug only ever showed up on a week like this one: once
    // an iteration rolled into October, every later one computed off the wrong
    // month. Any week entirely inside one month passes even when it's broken.
    const days = weekOf("2026-10-01").map(iso);

    expect(days).toEqual([
      "2026-09-27",
      "2026-09-28",
      "2026-09-29",
      "2026-09-30",
      "2026-10-01",
      "2026-10-02",
      "2026-10-03",
    ]);
  });

  it("stays consecutive across a year boundary", () => {
    const days = weekOf("2027-01-01").map(iso);

    expect(days[0]).toBe("2026-12-27");
    expect(days[6]).toBe("2027-01-02");
  });

  it("honours a Monday week start", () => {
    const days = weekOf("2026-09-09", 1).map(iso);

    expect(days[0]).toBe("2026-09-07");
    expect(days[6]).toBe("2026-09-13");
  });

  it("does not mutate its way to a wrong answer when called twice", () => {
    expect(weekOf("2026-10-01").map(iso)).toEqual(weekOf("2026-10-01").map(iso));
  });
});

describe("todayISO", () => {
  it("is a yyyy-MM-dd string matching the local date", () => {
    const today = todayISO();

    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(today).toBe(iso(new Date()));
  });
});

describe("longDate", () => {
  it("names the day the string actually refers to", () => {
    // 2026-08-07 is a Friday. If the UTC-parsing bug returned, this would read
    // Thursday in any negative-offset timezone.
    expect(longDate("2026-08-07")).toContain("Friday");
  });
});
