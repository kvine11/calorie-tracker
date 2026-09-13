import { useEffect, useRef, useState } from "react";
import { useAfterFirstPaint, useCountUp } from "../hooks.js";
import { MACROS, energySplit, macroTotals } from "../macros.js";
import { EASE_EXPO, cssBezier } from "../motion.js";

// One arc per meal, so the ring reads as the day's composition rather than a
// single progress bar. One hue in six luminance steps, brightest first — six
// categorical colours would turn a segmented ring into a clown pie and cost it
// its single colour memory. Meal identity is carried by the list's dots and by
// hover, not by arc colour alone. See DESIGN.md.
export const SEG_COLORS = [
  "var(--color-accent-800)",
  "var(--color-accent-600)",
  "var(--color-accent-500)",
  "var(--color-accent-400)",
  "var(--color-accent-300)",
  "var(--color-accent-200)",
];

const SIZE = 184;
const CENTER = SIZE / 2;
const RADIUS = 74;
const STROKE = 12;
const CIRC = 2 * Math.PI * RADIUS;
// Track left showing between neighbouring arcs.
const GAP = 4;

// DESIGN.md → Motion.
const DRAW_MS = 620; // first draw, on mount and on each new day
const STAGGER_MS = 45; // between arcs on that first draw, in logging order
const RESWEEP_MS = 340; // arcs adjusting after an add, edit or delete
const NEW_ARC_DELAY_MS = 80; // a new meal's arc waits for its row to land first
const EXPO = cssBezier(EASE_EXPO);

function Arc({ color, length, offset, isActive, isDimmed, introDelay, introMs }) {
  const painted = useAfterFirstPaint();
  // The arc's first transition uses the timing it mounted with; every later
  // change (another meal added or removed) is a quick re-sweep.
  const [intro] = useState({ delay: introDelay, ms: introMs });
  const [introDone, setIntroDone] = useState(false);

  useEffect(() => {
    if (!painted) return undefined;
    const timer = setTimeout(() => setIntroDone(true), intro.delay + intro.ms);
    return () => clearTimeout(timer);
  }, [painted, intro]);

  const dashTransition = introDone
    ? `stroke-dasharray ${RESWEEP_MS}ms ${EXPO}`
    : `stroke-dasharray ${intro.ms}ms ${EXPO} ${intro.delay}ms`;

  return (
    <circle
      cx={CENTER}
      cy={CENTER}
      r={RADIUS}
      fill="none"
      stroke={color}
      strokeLinecap="butt"
      style={{
        strokeWidth: isActive ? STROKE + 4 : STROKE,
        // Starts at length 0 and grows in place from where the arc begins.
        strokeDasharray: `${painted ? Math.max(0, length) : 0} ${CIRC}`,
        strokeDashoffset: offset,
        opacity: isDimmed ? 0.4 : 1,
        transition: painted
          ? `${dashTransition}, stroke-dashoffset ${RESWEEP_MS}ms ${EXPO}, stroke-width 180ms ease, opacity 180ms ease`
          : "none",
      }}
    />
  );
}

// Its own component so the bar grows in from zero whenever it first appears —
// including when the first meal with macros is logged, long after the ring mounted.
function MacroBar({ share, hovered, onHover }) {
  const painted = useAfterFirstPaint();

  return (
    <div className="macro-bar">
      {MACROS.filter(({ key }) => share(key) > 0).map(({ key, color }) => (
        <span
          key={key}
          className="macro-seg"
          onMouseEnter={() => onHover(key)}
          onMouseLeave={() => onHover(null)}
          style={{
            width: `${painted ? share(key) * 100 : 0}%`,
            background: color,
            opacity: hovered && hovered !== key ? 0.4 : 1,
          }}
        />
      ))}
    </div>
  );
}

export default function CalorieRing({ meals, total, hoverId }) {
  // Arcs present at mount draw in one after another; an arc that appears later
  // (a meal just logged) gets the short delayed draw instead.
  const [settled, setSettled] = useState(false);
  const initialCount = useRef(meals.length);

  useEffect(() => {
    const timer = setTimeout(() => setSettled(true), DRAW_MS + STAGGER_MS * initialCount.current);
    return () => clearTimeout(timer);
  }, []);

  // Remounting the number restarts its pulse keyframe. One pulse per change,
  // and nothing else on the page is ever allowed to scale.
  const [pulseKey, setPulseKey] = useState(0);
  const prevTotal = useRef(total);

  useEffect(() => {
    if (total !== prevTotal.current) {
      prevTotal.current = total;
      setPulseKey((k) => k + 1);
    }
  }, [total]);

  const displayTotal = Math.round(useCountUp(total, { from: 0 }));

  let consumed = 0;
  const arcs = meals.map((meal, index) => {
    const share = total ? meal.calories / total : 0;
    const arc = {
      id: meal.id,
      index,
      color: SEG_COLORS[index % SEG_COLORS.length],
      offset: -consumed * CIRC,
      length: share * CIRC - (meals.length > 1 ? GAP : 0),
    };
    consumed += share;
    return arc;
  });
  const hoverIsOnRing = hoverId != null && meals.some((meal) => meal.id === hoverId);

  const totals = macroTotals(meals);
  const { sum: energyTotal, share } = energySplit(totals);
  const [macroHover, setMacroHover] = useState(null);
  // Hooks can't be called in a loop, so the three are spelled out.
  const grams = {
    protein: Math.round(useCountUp(totals.protein, { from: 0, duration: 320 })),
    carbs: Math.round(useCountUp(totals.carbs, { from: 0, duration: 320 })),
    fats: Math.round(useCountUp(totals.fats, { from: 0, duration: 320 })),
  };
  const hasPartialData = totals.withData > 0 && totals.withData < meals.length;

  return (
    <div className="card ring-card">
      {/* "dial", not "ring": Tailwind generates a `.ring` utility (a 1px
          box-shadow outline), and a class of that name picks it up. */}
      <div className="dial">
        <div className="ring-wash" aria-hidden="true" />
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          role="img"
          aria-label={`${total} calories from ${meals.length} ${meals.length === 1 ? "meal" : "meals"}`}
        >
          <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" stroke="var(--ring-track)" strokeWidth={STROKE} />
          <circle cx={CENTER} cy={CENTER} r={RADIUS - STROKE / 2 - 7} fill="none" stroke="var(--color-divider)" strokeWidth="1" />
          <g className="ring-arcs">
            {arcs.map((arc) => (
              <Arc
                key={arc.id}
                color={arc.color}
                length={arc.length}
                offset={arc.offset}
                isActive={hoverId === arc.id}
                isDimmed={hoverIsOnRing && hoverId !== arc.id}
                introDelay={settled ? NEW_ARC_DELAY_MS : arc.index * STAGGER_MS}
                introMs={settled ? RESWEEP_MS : DRAW_MS}
              />
            ))}
          </g>
        </svg>
        <div className="ring-center">
          <div key={pulseKey} className="ring-number" data-pulse={pulseKey > 0}>
            {displayTotal.toLocaleString("en-US")}
          </div>
          <div className="ring-unit">calories</div>
        </div>
      </div>

      {meals.length === 0 ? (
        <p className="ring-note">Nothing logged yet — add a meal and the ring fills in.</p>
      ) : energyTotal === 0 ? (
        <p className="ring-note">No macro data for these meals. Foods picked from search carry it.</p>
      ) : (
        <div className="macros">
          {/* With no calorie goal to measure against, what each macro contributes
              to the day's energy is the meaningful split. */}
          <MacroBar share={share} hovered={macroHover} onHover={setMacroHover} />
          <ul className="macro-rows">
            {MACROS.map(({ key, label, color }) => (
              <li
                key={key}
                className="macro-row"
                data-dim={macroHover != null && macroHover !== key}
                onMouseEnter={() => setMacroHover(key)}
                onMouseLeave={() => setMacroHover(null)}
              >
                <span className="dot" style={{ background: color }} />
                <span>{label}</span>
                <span className="macro-grams">{grams[key]} g</span>
                <span className="macro-pct">{Math.round(share(key) * 100)}%</span>
              </li>
            ))}
          </ul>
          {hasPartialData && (
            <p className="ring-note">
              {totals.withData} of {meals.length} meals have macro data
            </p>
          )}
        </div>
      )}
    </div>
  );
}
