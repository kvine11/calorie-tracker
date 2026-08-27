import { useState } from "react";
import { useFoodSearch } from "../hooks.js";
import { shortDate } from "../dates.js";

// The full-width version of the same search the log form does inline — room for
// long database names, and one tap adds straight to the selected day.
export default function SearchView({ entryDate, onSearch, onAdd }) {
  const [query, setQuery] = useState("");
  const { suggestions: results, isSearching } = useFoodSearch(query, { onSearch, limit: 20 });
  const hasQuery = query.trim().length >= 2;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)", maxWidth: 640 }}>
      <header>
        <div
          style={{
            fontSize: 11,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--color-accent)",
          }}
        >
          Search foods
        </div>
        <h1 style={{ margin: "6px 0 0", fontSize: 38 }}>Find a food</h1>
        <p
          style={{
            marginTop: "var(--space-2)",
            color: "color-mix(in srgb, var(--color-text) 60%, transparent)",
            fontSize: 14,
          }}
        >
          Searches the food database and adds straight to {shortDate(entryDate)}.
        </p>
      </header>

      <input
        className="input"
        type="search"
        placeholder="Search by name…"
        aria-label="Search foods"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        style={{ minHeight: 46, fontSize: 16 }}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
        {results.map((result, index) => (
          <div
            key={`${result.foodName}-${index}`}
            className="card"
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: "var(--space-3)",
              padding: "var(--space-3) var(--space-4)",
            }}
          >
            <span style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 600 }}>
              {result.foodName}
            </span>
            <span
              style={{
                fontVariantNumeric: "tabular-nums",
                fontSize: 14,
                color: "color-mix(in srgb, var(--color-text) 60%, transparent)",
              }}
            >
              {result.calories} cal
            </span>
            <button
              type="button"
              className="btn btn-primary"
              style={{ fontSize: 13 }}
              onClick={() => onAdd(result.foodName, result.calories)}
            >
              Add
            </button>
          </div>
        ))}

        {hasQuery && !isSearching && results.length === 0 && (
          <div
            style={{
              border: "1px dashed var(--color-neutral-400)",
              borderRadius: "calc(var(--radius-lg) * 1.15)",
              padding: "var(--space-6)",
              textAlign: "center",
              fontSize: 14,
              color: "color-mix(in srgb, var(--color-text) 55%, transparent)",
            }}
          >
            No foods match that name — you can still log it by hand from Today.
          </div>
        )}
      </div>
    </div>
  );
}
