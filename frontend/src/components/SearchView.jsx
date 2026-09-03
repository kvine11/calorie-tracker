import { useState } from "react";
import { useFoodSearch } from "../hooks.js";
import { shortDate } from "../dates.js";

/**
 * A full-page version of the same food search the add form does inline.
 *
 * It can do two things the inline version cannot: it has room for the long,
 * qualified names the food database returns, and it shows a deeper list (20
 * results against the form's 6).
 *
 * One tap adds the food straight to the selected day using the database's
 * calorie figure. The tradeoff for that speed is that there is no calorie field
 * here, so an unusual portion has to be corrected afterward from the meal's
 * Details view on Today.
 *
 * The empty state points back to manual entry instead of dead-ending, which is
 * the same promise the whole search feature is built on: not finding a food
 * never stops you from logging it.
 *
 * @param {object} props
 * @param {string} props.entryDate The day an Add lands on, named in the subheading so it is never a surprise.
 * @param {(query: string) => Promise<Array>} props.onSearch
 * @param {(name: string, calories: number) => void} props.onAdd
 */
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
