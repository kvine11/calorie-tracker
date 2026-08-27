import { useState } from "react";
import { useFoodSearch } from "../hooks.js";
import { shortDate } from "../dates.js";

// Cmd/Ctrl-K anywhere in the app: search, hit a row, it's logged to the
// selected day. No calorie field — that's what the full form on Today is for.
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
