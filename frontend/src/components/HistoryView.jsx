import { useEffect, useState } from "react";
import { getMealsByDate } from "../api.js";
import { parseISO, shiftISO, todayISO } from "../dates.js";

const DAYS_SHOWN = 7;

/**
 * The last seven days shown as one bar per day, most recent first. This is the
 * first screen in the app that shows more than a single day at a time.
 *
 * THE IMPLEMENTATION TRADEOFF, which is the interesting part of this component:
 * the backend only knows how to return one day at a time
 * (GET /api/meals/date/{date}). So this fires seven of those requests in
 * parallel with Promise.all and assembles the week on the frontend.
 *
 * That was a deliberate choice to build this screen without touching the
 * backend. The cost is seven round trips where one would do. The proper fix is a
 * date-range query on the repository (findByDateBetween), plus a GROUP BY / SUM
 * aggregation so the database totals each day instead of sending every row. That
 * work belongs to the charts version, and this component collapses to a single
 * request once it exists.
 *
 * Each request has its own .catch that returns an empty array, so one failed day
 * shows up as an empty day rather than breaking the entire week.
 *
 * The bars are scaled against the highest day in the visible week, not against a
 * goal, so the tallest bar is always full. It shows days relative to each other,
 * not achievement.
 *
 * Clicking a day selects it and jumps to the Today screen. This is the only
 * place in the app where one screen navigates to another on the user's behalf.
 *
 * Because App unmounts this screen when you navigate away, the data effect runs
 * again on every visit, so these totals are never stale.
 *
 * @param {object} props
 * @param {string} props.entryDate Drawn in the accent color if it falls inside the visible week.
 * @param {(date: string) => void} props.onOpenDay Selects that day and switches to Today.
 */
export default function HistoryView({ entryDate, onOpenDay }) {
  const [days, setDays] = useState([]);
  const today = todayISO();

  useEffect(() => {
    const dates = Array.from({ length: DAYS_SHOWN }, (_, i) => shiftISO(today, -i));
    let cancelled = false;

    Promise.all(dates.map((date) => getMealsByDate(date).catch(() => [])))
      .then((results) => {
        if (cancelled) return;
        setDays(
          dates.map((date, index) => ({
            date,
            meals: results[index],
            total: results[index].reduce((sum, meal) => sum + meal.calories, 0),
          })),
        );
      })
      .catch(console.error);

    return () => {
      cancelled = true;
    };
  }, [today]);

  const maxTotal = Math.max(1, ...days.map((day) => day.total));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <header>
        <div
          style={{
            fontSize: 11,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--color-accent)",
          }}
        >
          History
        </div>
        <h1 style={{ margin: "6px 0 0", fontSize: 38 }}>Past days</h1>
      </header>

      <div className="card elev-sm" style={{ padding: "var(--space-4) var(--space-6)", gap: "var(--space-3)" }}>
        {days.map((day) => (
          <button
            key={day.date}
            type="button"
            className="row-hover"
            onClick={() => onOpenDay(day.date)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-4)",
              width: "100%",
              border: 0,
              background: "transparent",
              cursor: "pointer",
              padding: "10px 8px",
              borderRadius: "var(--radius-md)",
              textAlign: "left",
              fontFamily: "var(--font-body)",
            }}
          >
            <span style={{ width: 132, flex: "none", fontSize: 14, fontWeight: 600 }}>
              {day.date === today
                ? "Today"
                : parseISO(day.date).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
            </span>
            <span
              style={{
                flex: 1,
                height: 12,
                borderRadius: 999,
                background: "var(--color-neutral-300)",
                overflow: "hidden",
                position: "relative",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${Math.round((day.total / maxTotal) * 100)}%`,
                  borderRadius: 999,
                  background:
                    day.date === entryDate ? "var(--color-accent)" : "var(--color-accent-2-500)",
                  transition: "width 500ms cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              />
            </span>
            <span
              style={{
                width: 96,
                flex: "none",
                textAlign: "right",
                fontVariantNumeric: "tabular-nums",
                fontSize: 14,
              }}
            >
              {day.total} cal
            </span>
            <span
              style={{
                width: 72,
                flex: "none",
                textAlign: "right",
                fontSize: 13,
                color: "color-mix(in srgb, var(--color-text) 50%, transparent)",
              }}
            >
              {day.meals.length === 1 ? "1 meal" : `${day.meals.length} meals`}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
