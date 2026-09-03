import { useEffect, useState } from "react";
import { useCountUp } from "../hooks.js";

/**
 * The arc colors, cycled through by position.
 *
 * This is exported because MealList reads the same array to color each row's
 * dot. That shared position is the only thing connecting a meal row to its arc
 * in the ring, so both components have to walk the meals array in the same
 * order. Change the ordering in one and the colors silently stop matching.
 *
 * @type {string[]}
 */
export const SEG_COLORS = [
  "var(--color-accent-500)",
  "var(--color-accent-2-500)",
  "var(--color-accent-400)",
  "var(--color-accent-2-600)",
  "var(--color-accent-700)",
  "var(--color-accent-2-400)",
];

const RADIUS = 88;
const CIRC = 2 * Math.PI * RADIUS;

/**
 * The day's calories drawn as a segmented donut chart: one arc per meal, sized
 * by that meal's share of the day, with the running total in the middle and a
 * legend underneath listing each meal and its percentage.
 *
 * This replaced the earlier CalorieSummary component, which was just a number
 * and a label.
 *
 * One thing to be clear about: this shows composition, not progress. There is no
 * goal line to fill up, because the app has no concept of a daily calorie target
 * yet. A complete ring means "here are the day's meals in proportion", not "you
 * are done for the day".
 *
 *
 * HOW THE ARCS ARE DRAWN
 *
 * Each arc is a single SVG circle using strokeDasharray, which takes a pattern
 * of dash length and gap length. Setting the dash to exactly the length this
 * meal should occupy, and the gap to the full circumference, leaves just one
 * visible segment. strokeDashoffset then rotates that segment to start where the
 * previous one ended, and the `consumed` variable accumulates that running
 * position as the arcs are built.
 *
 *
 * TWO SEPARATE ANIMATIONS
 *
 * 1. `progress` sweeps from 0 to 1 once when the component mounts, drawing the
 *    arcs on. TodayView passes entryDate as a React `key`, which forces a
 *    remount whenever the day changes, so each new day draws itself in rather
 *    than morphing out of the previous day's shape.
 *
 * 2. The number in the center animates through useCountUp on every change,
 *    without remounting. So adding a meal counts the number up, while switching
 *    days redraws the whole ring.
 *
 * @param {object} props
 * @param {Array<{id: number, name: string, calories: number}>} props.meals Arc order matches list order.
 * @param {number} props.total Calculated by TodayView; each arc is a share of it.
 * @param {number|null} props.hoverId The hovered meal — thickens its arc and dims the others.
 * @param {(id: number|null) => void} props.onHover Reported by the legend rows.
 */
export default function CalorieRing({ meals, total, hoverId, onHover }) {
  // Sweeps 0 → 1 once per mount; the parent remounts this on a date change so
  // each day's ring draws itself in.
  const [progress, setProgress] = useState(0);
  const displayTotal = Math.round(useCountUp(total));

  useEffect(() => {
    const start = performance.now();
    let frame = 0;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / 700);
      setProgress(1 - Math.pow(1 - t, 3));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  // Build one arc per meal. `consumed` tracks how much of the circle has been
  // used so far, which becomes the next arc's starting offset. A few pixels are
  // trimmed off every arc so neighbouring segments read as separate rather than
  // one continuous band, and that trim is skipped when there is only one meal,
  // since there is nothing to separate it from.
  let consumed = 0;
  const arcs = meals.map((meal, index) => {
    const share = total ? meal.calories / total : 0;
    const length = share * CIRC * progress;
    const gap = meals.length > 1 ? 4 : 0;
    const offset = -consumed * CIRC * progress;
    consumed += share;
    const isActive = hoverId === meal.id;
    return {
      id: meal.id,
      color: SEG_COLORS[index % SEG_COLORS.length],
      width: isActive ? 26 : 20,
      opacity: hoverId && !isActive ? 0.45 : 1,
      dash: `${Math.max(0, length - gap)} ${CIRC}`,
      offset,
    };
  });

  return (
    <div
      className="card elev-sm"
      style={{ alignItems: "center", padding: "var(--space-6) var(--space-4)", gap: "var(--space-3)" }}
    >
      <div style={{ position: "relative", width: 216, height: 216 }}>
        <svg width="216" height="216" viewBox="0 0 216 216" style={{ transform: "rotate(-90deg)" }}>
          <circle
            cx="108"
            cy="108"
            r={RADIUS}
            fill="none"
            stroke="var(--color-neutral-300)"
            strokeWidth="20"
          />
          {arcs.map((arc) => (
            <circle
              key={arc.id}
              cx="108"
              cy="108"
              r={RADIUS}
              fill="none"
              stroke={arc.color}
              strokeWidth={arc.width}
              strokeLinecap="round"
              strokeDasharray={arc.dash}
              strokeDashoffset={arc.offset}
              opacity={arc.opacity}
              style={{ transition: "stroke-width 180ms ease, opacity 180ms ease" }}
            />
          ))}
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: 46,
              lineHeight: 1,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {displayTotal}
          </div>
          <div
            style={{
              fontSize: 12,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "color-mix(in srgb, var(--color-text) 55%, transparent)",
            }}
          >
            calories
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          width: "100%",
          marginTop: "var(--space-2)",
        }}
      >
        {meals.map((meal, index) => (
          <div
            key={meal.id}
            onMouseEnter={() => onHover(meal.id)}
            onMouseLeave={() => onHover(null)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
              padding: "3px 6px",
              borderRadius: 999,
              cursor: "default",
              background:
                hoverId === meal.id
                  ? "color-mix(in srgb, var(--color-text) 6%, transparent)"
                  : "transparent",
            }}
          >
            <span
              style={{
                width: 9,
                height: 9,
                borderRadius: 999,
                flex: "none",
                background: SEG_COLORS[index % SEG_COLORS.length],
              }}
            />
            <span
              style={{
                flex: 1,
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {meal.name}
            </span>
            <span
              style={{
                fontVariantNumeric: "tabular-nums",
                color: "color-mix(in srgb, var(--color-text) 60%, transparent)",
              }}
            >
              {total ? Math.round((meal.calories / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
