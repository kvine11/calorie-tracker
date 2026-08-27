// Date helpers shared by the day strip, history and the meal views.
//
// Everything in the app passes dates around as plain "yyyy-MM-dd" strings.
// A date-only string handed to `new Date(...)` parses as UTC midnight, which
// reads back as the *previous* day in any negative-UTC-offset timezone — so
// parsing always goes through the multi-argument (always-local) constructor.

export function iso(date) {
  return (
    date.getFullYear() +
    "-" +
    String(date.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(date.getDate()).padStart(2, "0")
  );
}

export function parseISO(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function todayISO() {
  return iso(new Date());
}

// Move a "yyyy-MM-dd" string by n days and return a new string.
function shift(dateString, days) {
  const date = parseISO(dateString);
  date.setDate(date.getDate() + days);
  return date;
}

export function shiftISO(dateString, days) {
  return iso(shift(dateString, days));
}

// The 7 dates of the week containing `dateString`. Each iteration clones from
// the untouched anchor — reusing one mutating Date breaks across month bounds.
export function weekOf(dateString, weekStartsOn = 0) {
  const anchor = parseISO(dateString);
  const offset = (anchor.getDay() - weekStartsOn + 7) % 7;
  const first = anchor.getDate() - offset;
  return Array.from({ length: 7 }, (_, i) => {
    const date = parseISO(dateString);
    date.setDate(first + i);
    return date;
  });
}

export function longDate(dateString) {
  return parseISO(dateString).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function shortDate(dateString) {
  return parseISO(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
