// Date helpers shared by the day strip, history and the meal views.
//
// Everything in the app passes dates around as plain "yyyy-MM-dd" strings.
// A date-only string handed to `new Date(...)` parses as UTC midnight, which
// reads back as the *previous* day in any negative-UTC-offset timezone — so
// parsing always goes through the multi-argument (always-local) constructor.

/**
 * Turns a Date object into the "yyyy-MM-dd" string format used everywhere else
 * in the app.
 *
 * This reads the date's local calendar fields (year, month, day) rather than
 * calling toISOString(). toISOString() converts to UTC first, which can shift
 * the date by a day depending on the user's timezone.
 *
 * @param {Date} date
 * @returns {string} For example "2026-09-03".
 */
export function iso(date) {
  return (
    date.getFullYear() +
    "-" +
    String(date.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(date.getDate()).padStart(2, "0")
  );
}

/**
 * Turns a "yyyy-MM-dd" string back into a Date object set to midnight local
 * time.
 *
 * It splits the string apart and uses the multi-argument Date constructor
 * (year, month, day) instead of the shorter new Date("2026-09-03"). That
 * shortcut looks fine but causes a real bug: JavaScript parses a date-only
 * string as midnight UTC, so in a US timezone (which is behind UTC) reading the
 * day back out gives you the previous day.
 *
 * Every date parse in the app goes through this one function, so that mistake
 * can only ever exist in a single place.
 *
 * @param {string} dateString A date in "yyyy-MM-dd" form.
 * @returns {Date} Midnight local time on that day.
 */
export function parseISO(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Today's date as a "yyyy-MM-dd" string.
 *
 * Used as the app's starting date when it first loads, and as the target for
 * the "Duplicate to today" button.
 *
 * @returns {string}
 */
export function todayISO() {
  return iso(new Date());
}

/**
 * Moves a date string forward or backward by a number of days and returns a
 * Date object.
 *
 * Private to this file. shiftISO() below is the version other files call, which
 * converts the result back into a string.
 *
 * @param {string} dateString
 * @param {number} days Positive moves forward, negative moves backward.
 * @returns {Date}
 */
function shift(dateString, days) {
  const date = parseISO(dateString);
  date.setDate(date.getDate() + days);
  return date;
}

/**
 * Moves a "yyyy-MM-dd" string forward or backward by a number of days and
 * returns a new string.
 *
 * Two features use this. The arrows on the day picker page a whole week at a
 * time (+7 or -7), and the History screen counts backward from today to build
 * its list of the last seven days.
 *
 * @param {string} dateString
 * @param {number} days Positive moves forward, negative moves backward.
 * @returns {string} A date in "yyyy-MM-dd" form.
 */
export function shiftISO(dateString, days) {
  return iso(shift(dateString, days));
}

/**
 * Returns the seven dates of the week containing the given date. This is what
 * fills in the row of day buttons in the date picker.
 *
 * How it works: it works out how far the given day sits from the start of the
 * week, steps back to that first day, then walks forward seven times.
 *
 * The detail worth knowing is that each step re-parses the original string to
 * get a fresh Date, rather than calling setDate() repeatedly on one shared
 * object. setDate() is interpreted relative to whatever month the object is
 * currently in, so reusing a single object silently produces wrong dates as soon
 * as a week crosses a month boundary. That was a real bug here, and it only
 * showed up at the end of a month.
 *
 * @param {string} dateString Any day inside the week you want.
 * @param {number} [weekStartsOn=0] 0 for Sunday, 1 for Monday. Comes from the
 *   user's Settings preference.
 * @returns {Date[]} Seven Date objects, starting with the first day of the week.
 */
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

/**
 * Formats a date as "Thursday, September 3", for the large heading on the Today
 * screen.
 *
 * @param {string} dateString A date in "yyyy-MM-dd" form.
 * @returns {string}
 */
export function longDate(dateString) {
  return parseISO(dateString).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

/**
 * Formats a date as "Sep 3", for tight spaces where the long form will not fit.
 *
 * Used by the quick-add footer and the search screen subheading, both of which
 * tell the user which day their meal is about to be added to.
 *
 * @param {string} dateString A date in "yyyy-MM-dd" form.
 * @returns {string}
 */
export function shortDate(dateString) {
  return parseISO(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
