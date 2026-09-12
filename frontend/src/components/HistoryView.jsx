import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getMealsInRange } from "../api.js";
import { parseISO, shiftISO, todayISO } from "../dates.js";
import { EASE_EXPO } from "../motion.js";

const DAYS_SHOWN = 7;

function dayLabel(date, today) {
  if (date === today) return "Today";
  if (date === shiftISO(today, -1)) return "Yesterday";
  return parseISO(date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function emptyWeek(today) {
  return Array.from({ length: DAYS_SHOWN }, (_, i) => ({ date: shiftISO(today, -i), total: 0, count: 0 }));
}

// One range request (GET /api/meals?from=&to=) grouped by day on the client.
export default function HistoryView({ entryDate, revision, onOpenDay }) {
  const today = todayISO();
  const from = shiftISO(today, -(DAYS_SHOWN - 1));
  const [days, setDays] = useState(null);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    getMealsInRange(from, today)
      .then((meals) => {
        if (cancelled) return;
        const byDate = new Map();
        for (const meal of meals) {
          const day = byDate.get(meal.date) ?? { total: 0, count: 0 };
          day.total += meal.calories;
          day.count += 1;
          byDate.set(meal.date, day);
        }
        setDays(emptyWeek(today).map((day) => ({ ...day, ...byDate.get(day.date) })));
        setError(null);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [from, today, revision, attempt]);

  // Until the data lands, the rows render as empty tracks in their final places,
  // so the bars grow in where they'll stay rather than the list popping in.
  const rows = days ?? emptyWeek(today);
  const logged = rows.filter((day) => day.count > 0);
  const average = logged.length ? Math.round(logged.reduce((sum, day) => sum + day.total, 0) / logged.length) : null;
  const maxTotal = Math.max(1, ...rows.map((day) => day.total));

  return (
    <div className="history">
      <header className="history-header">
        <h1 className="history-title">Last 7 days</h1>
        {average != null && (
          <p className="history-stat">
            <strong>{average.toLocaleString("en-US")}</strong> cal average across {logged.length} logged{" "}
            {logged.length === 1 ? "day" : "days"}
          </p>
        )}
      </header>

      {error && (
        <div className="banner" role="alert">
          <span>{error}</span>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setAttempt((n) => n + 1)}>
            Retry
          </button>
        </div>
      )}

      <div className="card history-list">
        {rows.map((day, index) => (
          <button
            key={day.date}
            type="button"
            className="history-row"
            data-selected={day.date === entryDate}
            onClick={() => onOpenDay(day.date)}
          >
            <span className="history-day">{dayLabel(day.date, today)}</span>
            <span className="history-track">
              <motion.span
                className="history-fill"
                initial={{ width: 0 }}
                animate={{ width: `${(day.total / maxTotal) * 100}%` }}
                transition={{ duration: 0.5, ease: EASE_EXPO, delay: days ? index * 0.03 : 0 }}
              />
            </span>
            <span className="history-total">
              {day.count ? (
                <>
                  {day.total.toLocaleString("en-US")}
                  <small>cal</small>
                </>
              ) : (
                "—"
              )}
            </span>
            <span className="history-count">{day.count === 1 ? "1 meal" : day.count > 1 ? `${day.count} meals` : ""}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
