import { MACROS, formatGrams, hasMacros } from "../macros.js";

// The compact P/C/F readout that sits under a food's name in every search
// result. Renders nothing when the food carries no macro data, so the
// manual-entry path stays as uncluttered as it was before macros existed.
export default function MacroLine({ food, size = 12 }) {
  if (!hasMacros(food)) return null;

  return (
    <span
      style={{
        display: "inline-flex",
        gap: 9,
        fontSize: size,
        lineHeight: 1.3,
        fontVariantNumeric: "tabular-nums",
        color: "color-mix(in srgb, var(--color-text) 58%, transparent)",
      }}
    >
      {MACROS.map(({ key, short, color }) => (
        <span key={key} style={{ whiteSpace: "nowrap" }}>
          {/* The letter carries the macro's colour, so the same three hues
              identify the same three macros here and in the ring. */}
          <span style={{ color, fontWeight: 700 }}>{short}</span> {formatGrams(food[key])}
        </span>
      ))}
    </span>
  );
}
