// The three macros, always in this order, with the colours the whole app uses
// for them. Deliberately chosen away from CalorieRing's SEG_COLORS: the energy
// bar sits inches from the meal arcs and must not read as three more meals.
export const MACROS = [
  {
    key: "protein",
    label: "Protein",
    short: "P",
    kcalPerGram: 4,
    color: "#7bdca8",
  },
  {
    key: "carbs",
    label: "Carbs",
    short: "C",
    kcalPerGram: 4,
    color: "#ffc24b",
  },
  {
    key: "fats",
    label: "Fats",
    short: "F",
    kcalPerGram: 9,
    color: "#8fa0ac",
  },
];

// True when a food or meal carries any macro data at all. `null` means nobody
// ever knew (a meal typed by hand); `0` means the food database said zero, which
// is a fact worth showing — chicken really has no carbs.
export function hasMacros(item) {
  return MACROS.some(({ key }) => item[key] != null);
}

// Day totals. Each field sums independently and skips its own nulls, so one
// meal missing a single macro doesn't discard the other two. `withData` counts
// meals that contributed anything, which is what the coverage note reports.
export function macroTotals(meals) {
  const totals = { protein: 0, carbs: 0, fats: 0, withData: 0 };

  for (const meal of meals) {
    if (hasMacros(meal)) totals.withData += 1;
    for (const { key } of MACROS) totals[key] += meal[key] ?? 0;
  }

  return totals;
}

// With no calorie goal to measure against, grams alone have nothing to be a
// status against. What each macro contributes to the day's energy does —
// protein and carbs at 4 kcal/g, fat at 9.
export function energySplit(totals) {
  const energy = {};
  let sum = 0;

  for (const { key, kcalPerGram } of MACROS) {
    energy[key] = totals[key] * kcalPerGram;
    sum += energy[key];
  }

  return { energy, sum, share: (key) => (sum ? energy[key] / sum : 0) };
}

// Grams the way a nutrition label writes them: one decimal, and no trailing
// ".0" on a whole number.
export function formatGrams(value) {
  if (value == null) return "—";
  return String(Number(value.toFixed(1)));
}

// Scaling a macro to a new portion. Mirrors MealEntryService.scale on the
// backend — same rounding, so a value scaled here and one scaled there by the
// same ratio land on the same number. `null` in, `null` out: an unknown macro
// stays unknown no matter how the calories move.
export function scaleMacro(macro, ratio) {
  if (macro == null) return null;
  return Math.round(macro * ratio * 100) / 100;
}
