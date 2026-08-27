import { useEffect, useState } from "react";
import { getMealsByDate } from "../api.js";
import { parseISO, shiftISO, todayISO } from "../dates.js";

const DAYS_SHOWN = 7;

// The backend only answers one day at a time (GET /api/meals/date/{date}), so a
// week is seven of those in parallel. A real range query lands with the charts
// version — this view is deliberately built on what already exists.
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
