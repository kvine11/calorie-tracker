import { useEffect, useRef, useState } from "react";
import { useCountUp } from "../hooks.js";
import { MACROS, energySplit, macroTotals } from "../macros.js";

// One arc per meal, so the ring reads as the day's composition rather than a
// single progress bar. One hue in six luminance steps, brightest first — six
// categorical colours would turn a segmented ring into a clown pie and cost it
// its single colour memory. Meal identity is carried by the legend and by hover,
// not by arc colour alone. See DESIGN.md.
export const SEG_COLORS = [
  "var(--color-accent-800)",
  "var(--color-accent-600)",
  "var(--color-accent-500)",
  "var(--color-accent-400)",
  "var(--color-accent-300)",
  "var(--color-accent-200)",
];

const RADIUS = 88;
const CIRC = 2 * Math.PI * RADIUS;

const MUTED = "color-mix(in srgb, var(--color-text) 55%, transparent)";
const ROW_HOVER = "color-mix(in srgb, var(--color-text) 6%, transparent)";

export default function CalorieRing({ meals, total, hoverId, onHover }) {
  // Sweeps 0 → 1 once per mount; the parent remounts this on a date change so
  // each day's ring draws itself in.
  const [progress, setProgress] = useState(0);
  // Which macro the pointer is on — the bar and its legend row drive the same
  // state, so hovering either lights up both.
  const [macroHover, setMacroHover] = useState(null);
  // Remounting the number on a total change restarts its keyframe. One pulse,
  // and nothing else on the page is ever allowed to scale.
  const [pulseKey, setPulseKey] = useState(0);
  const prevTotal = useRef(total);
  const displayTotal = Math.round(useCountUp(total));

  useEffect(() => {
    if (total !== prevTotal.current) {
      prevTotal.current = total;
      setPulseKey((k) => k + 1);
    }
  }, [total]);

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

  let consumed = 0;
  const arcs = meals.map((meal, index) => {
    const share = total ? meal.calories / total : 0;
    const length = share * CIRC * progress;
    const gap = meals.length > 1 ? 6 : 0;
    const offset = -consumed * CIRC * progress;
    consumed += share;
    const isActive = hoverId === meal.id;
    return {
      id: meal.id,
      color: SEG_COLORS[index % SEG_COLORS.length],
      width: isActive ? 17 : 13,
      opacity: hoverId && !isActive ? 0.45 : 1,
      dash: `${Math.max(0, length - gap)} ${CIRC}`,
      offset,
    };
  });

  // Totals are computed here rather than passed in: this card is the only thing
  // that needs them, so TodayView stays untouched.
  const totals = macroTotals(meals);
  const { energy, sum: energyTotal, share } = energySplit(totals);

  // The gram readouts roll the same way the calorie total does. Hooks can't be
  // called in a loop, so the three are spelled out.
  const gramsShown = {
    protein: Math.round(useCountUp(totals.protein)),
    carbs: Math.round(useCountUp(totals.carbs)),
    fats: Math.round(useCountUp(totals.fats)),
  };

  const hovered = MACROS.find(({ key }) => key === macroHover);
  const coverage =
    totals.withData < meals.length
      ? `${totals.withData} of ${meals.length} ${meals.length === 1 ? "meal has" : "meals have"} macro data`
      : "Share of the day's calories from each macro";

  return (
    <div
      className="card elev-sm"
      style={{ alignItems: "center", padding: "var(--space-6) var(--space-4)", gap: "var(--space-3)" }}
    >
      <div style={{ position: "relative", width: 216, height: 216 }}>
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: -20,
            borderRadius: 999,
            background: "radial-gradient(circle at 50% 46%, var(--ring-wash), transparent 62%)",
            pointerEvents: "none",
          }}
        />
        <svg width="216" height="216" viewBox="0 0 216 216" style={{ transform: "rotate(-90deg)" }}>
          <circle
            cx="108"
            cy="108"
            r={RADIUS}
            fill="none"
            stroke="var(--ring-track)"
            strokeWidth="13"
          />
          <circle cx="108" cy="108" r="74" fill="none" stroke="var(--color-divider)" strokeWidth="1" />
          {arcs.map((arc, index) => (
            <circle
              key={arc.id}
              cx="108"
              cy="108"
              r={RADIUS}
              fill="none"
              stroke={arc.color}
              strokeWidth={arc.width}
              strokeLinecap="butt"
              strokeDasharray={arc.dash}
              strokeDashoffset={arc.offset}
              opacity={arc.opacity}
              style={{
                // Arcs re-sweep rather than snapping when a meal is added or
                // removed. This is what makes the ring feel like it reacted.
                transition:
                  "stroke-dasharray 340ms cubic-bezier(.16,1,.3,1), stroke-dashoffset 340ms cubic-bezier(.16,1,.3,1), stroke-width 180ms ease, opacity 180ms ease",
                filter:
                  index === 0
                    ? "drop-shadow(0 0 7px color-mix(in srgb, var(--color-accent) 32%, transparent))"
                    : undefined,
              }}
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
            key={pulseKey}
            style={{
              fontFamily: "var(--font-heading)",
              animation: "numPulse 500ms cubic-bezier(.34,1.56,.64,1)",
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
              color: MUTED,
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
              background: hoverId === meal.id ? ROW_HOVER : "transparent",
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

      {meals.length > 0 && (
        <div
          style={{
            width: "100%",
            marginTop: "var(--space-1)",
            paddingTop: "var(--space-3)",
            borderTop: "1px solid var(--color-divider)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-2)",
          }}
        >
          <div
            style={{
              fontSize: 11,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--color-accent)",
            }}
          >
            Macros
          </div>

          {energyTotal === 0 ? (
            <div style={{ fontSize: 12, color: MUTED, padding: "2px 6px" }}>
              {totals.withData === 0
                ? "No macro data yet — log a food from search to see the split."
                : "Everything logged today is zero-macro."}
            </div>
          ) : (
            <>
              {/* Energy split: with no target to measure grams against, what each
                  macro contributes to the day's calories is the meaningful status. */}
              <div
                style={{
                  display: "flex",
                  gap: 2,
                  height: 10,
                  width: "100%",
                  borderRadius: 999,
                  overflow: "hidden",
                  background: "var(--color-neutral-300)",
                }}
              >
                {MACROS.filter(({ key }) => share(key) > 0).map(({ key, color }) => (
                  <div
                    key={key}
                    onMouseEnter={() => setMacroHover(key)}
                    onMouseLeave={() => setMacroHover(null)}
                    style={{
                      width: `${share(key) * progress * 100}%`,
                      background: color,
                      transition: "width 280ms cubic-bezier(.4,0,.2,1)",
                      cursor: "default",
                      opacity: macroHover && macroHover !== key ? 0.4 : 1,
                      transition: "opacity 180ms ease",
                    }}
                  />
                ))}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {MACROS.map(({ key, label, color }) => {
                  const isActive = macroHover === key;
                  return (
                    <div
                      key={key}
                      onMouseEnter={() => setMacroHover(key)}
                      onMouseLeave={() => setMacroHover(null)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 13,
                        padding: "3px 6px",
                        borderRadius: 999,
                        cursor: "default",
                        background: isActive ? ROW_HOVER : "transparent",
                        opacity: macroHover && !isActive ? 0.5 : 1,
                        transition: "background 160ms ease, opacity 160ms ease",
                      }}
                    >
                      <span
                        style={{
                          width: 9,
                          height: 9,
                          borderRadius: 999,
                          flex: "none",
                          background: color,
                        }}
                      />
                      <span style={{ flex: 1, minWidth: 0 }}>{label}</span>
                      <span style={{ fontVariantNumeric: "tabular-nums" }}>{gramsShown[key]} g</span>
                      <span
                        style={{
                          width: 38,
                          textAlign: "right",
                          fontVariantNumeric: "tabular-nums",
                          color: MUTED,
                        }}
                      >
                        {Math.round(share(key) * 100)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Reserved height, so the line swapping on hover never shifts the card. */}
          <div style={{ minHeight: 17, fontSize: 12, color: MUTED, padding: "0 6px" }}>
            {hovered
              ? `${hovered.label} · ${gramsShown[hovered.key]} g · ≈ ${Math.round(energy[hovered.key])} kcal`
              : coverage}
          </div>
        </div>
      )}
    </div>
  );
}
