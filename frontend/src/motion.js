// Shared motion values, so every animation in the app moves the same way.
// Durations and curves come from DESIGN.md → Motion.

// Entrances: rows landing, views and dialogs appearing.
export const EASE_OUT = [0.22, 1, 0.36, 1];

// The ring's sweeps — fast start, long settle.
export const EASE_EXPO = [0.16, 1, 0.3, 1];

// Rows beneath a new or removed row, the tab and day highlights.
export const LAYOUT_SPRING = { type: "spring", stiffness: 380, damping: 34 };

// For the places that animate with CSS transitions instead of framer-motion.
export function cssBezier(points) {
  return `cubic-bezier(${points.join(", ")})`;
}
