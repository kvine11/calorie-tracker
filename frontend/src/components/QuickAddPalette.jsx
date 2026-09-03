import { useState } from "react";
import { useFoodSearch } from "../hooks.js";
import { shortDate } from "../dates.js";

/**
 * A command-palette overlay, opened with Cmd/Ctrl-K from anywhere in the app.
 * Type, click a result, and the meal is logged to the selected day and the
 * palette closes. This is the fastest path in the app from "I ate something" to
 * a saved meal.
 *
 * It intentionally has no calorie field and no date picker. It takes the
 * database's calorie figure and the currently selected day, and the full form on
 * Today is where you go when either needs to be different. The footer names the
 * day it will add to, since the palette can be opened from screens that are not
 * showing that day.
 *
 * App owns the keyboard shortcut and the Escape handler, so no individual screen
 * has to know this component exists.
 *
 * LIMITATION: apart from the sidebar button, a keyboard shortcut is the only way
 * to open this, so on a touch device it is effectively unreachable. The mobile
 * plan turns it into the center button of a bottom tab bar.
 *
 * @param {object} props
 * @param {string} props.entryDate The day an add lands on, named in the footer.
 * @param {(query: string) => Promise<Array>} props.onSearch
 * @param {(name: string, calories: number) => void} props.onAdd
 * @param {() => void} props.onClose Called on backdrop click, Escape, or a successful add.
 */
export default function QuickAddPalette({ entryDate, onSearch, onAdd, onClose }) {
  const [query, setQuery] = useState("");
  const { suggestions, isSearching } = useFoodSearch(query, { onSearch, limit: 8 });
  const hasQuery = query.trim().length >= 2;

  return (
    <div
      className="dialog-backdrop"
      style={{ zIndex: 80, alignItems: "flex-start", paddingTop: "14vh" }}
      onClick={onClose}
    >
      <div
        className="dialog"
        style={{ width: "min(560px, 100%)", gap: "var(--space-3)", padding: "var(--space-4)" }}
        onClick={(event) => event.stopPropagation()}
      >
        <input
          className="input"
          type="text"
          placeholder="Quick add — food name"
          aria-label="Quick add food"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          autoFocus
          style={{ minHeight: 46, fontSize: 16 }}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: 2, maxHeight: 300, overflow: "auto" }}>
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.foodName}-${index}`}
              type="button"
              className="suggestion"
              onClick={() => {
                onAdd(suggestion.foodName, suggestion.calories);
                onClose();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                padding: "10px 14px",
                border: 0,
                borderRadius: 999,
                background: "transparent",
                cursor: "pointer",
                fontFamily: "var(--font-body)",
                fontSize: 15,
                color: "var(--color-text)",
                textAlign: "left",
              }}
            >
              <span>{suggestion.foodName}</span>
              <span
                style={{
                  fontVariantNumeric: "tabular-nums",
                  fontSize: 13,
                  color: "color-mix(in srgb, var(--color-text) 55%, transparent)",
                }}
              >
                {suggestion.calories} cal
              </span>
            </button>
          ))}

          {hasQuery && !isSearching && suggestions.length === 0 && (
            <div style={{ padding: "10px 14px", fontSize: 14, color: "color-mix(in srgb, var(--color-text) 55%, transparent)" }}>
              No matches — log it by hand on Today.
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 12,
            color: "color-mix(in srgb, var(--color-text) 50%, transparent)",
            padding: "0 6px",
          }}
        >
          <span>Adds to {shortDate(entryDate)}</span>
          <span>Esc to close</span>
        </div>
      </div>
    </div>
  );
}
