import { useRef, useState } from "react";
import { useClickOutside, useFoodSearch } from "../hooks.js";
import { CameraIcon } from "./Icons.jsx";

/**
 * The add-a-meal form on the Today screen: food name, calories, Add.
 *
 * Typing two or more characters searches the food database and shows matches in
 * a dropdown floating under the input. A floating dropdown works here because
 * this form sits at the top of a wide column with nothing underneath it to
 * cover. That is not true inside a meal card, which is why FoodItem shows chips
 * instead of reusing this markup. The two share the search hook, not the layout.
 *
 * Picking a match fills in both fields but leaves calories editable, on purpose:
 * the portion you actually ate is rarely the portion the database assumed.
 *
 * Typing a name that matches nothing and entering the calories by hand is a
 * fully supported path, not a fallback. The search speeds up manual entry; it
 * never stands in front of it.
 *
 * There is no date field here. The meal is stamped with whichever day is
 * selected in the picker above, and App supplies that date.
 *
 * @param {object} props
 * @param {(name: string, calories: number) => void} props.onAdd
 *   calories is converted with Number() first, since a number input returns a string.
 * @param {(query: string) => Promise<Array>} props.onSearch
 */
export default function MealForm({ onAdd, onSearch }) {
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const fieldRef = useRef(null);

  const { suggestions } = useFoodSearch(name, { onSearch });
  useClickOutside(fieldRef, () => setIsOpen(false));

  function handleSubmit(event) {
    event.preventDefault();
    if (!name.trim() || !calories) return;

    onAdd(name.trim(), Number(calories));
    setName("");
    setCalories("");
    setIsOpen(false);
  }

  // Picking a match fills both fields but leaves calories editable — the
  // portion on the plate is rarely the portion the database assumed.
  function handlePick(suggestion) {
    setName(suggestion.foodName);
    setCalories(suggestion.calories);
    setIsOpen(false);
  }

  return (
    <div className="card elev-sm" style={{ gap: "var(--space-3)" }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: "var(--space-3)",
        }}
      >
        <div className="card-title">Log a meal</div>
        <div style={{ fontSize: 12, color: "color-mix(in srgb, var(--color-text) 50%, transparent)" }}>
          Start typing for matches
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", gap: "var(--space-2)", alignItems: "flex-start", flexWrap: "wrap" }}
      >
        <div ref={fieldRef} style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <input
            className="input"
            type="text"
            placeholder="What did you eat?"
            aria-label="Food name"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
          />

          {isOpen && suggestions.length > 0 && (
            <ul
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: "calc(100% + 6px)",
                zIndex: 40,
                margin: 0,
                padding: 6,
                listStyle: "none",
                background: "var(--color-neutral-100)",
                border: "1px solid var(--color-divider)",
                borderRadius: "var(--radius-md)",
                boxShadow: "var(--shadow-md)",
                animation: "popIn 140ms ease both",
              }}
            >
              {suggestions.map((suggestion, index) => (
                <li key={`${suggestion.foodName}-${index}`}>
                  <button
                    type="button"
                    className="suggestion"
                    onClick={() => handlePick(suggestion)}
                    style={{
                      display: "flex",
                      width: "100%",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 16,
                      padding: "7px 10px",
                      border: 0,
                      borderRadius: 999,
                      background: "transparent",
                      cursor: "pointer",
                      fontFamily: "var(--font-body)",
                      fontSize: 14,
                      color: "var(--color-text)",
                      textAlign: "left",
                    }}
                  >
                    <span>{suggestion.foodName}</span>
                    <span
                      style={{
                        fontVariantNumeric: "tabular-nums",
                        color: "color-mix(in srgb, var(--color-text) 55%, transparent)",
                      }}
                    >
                      {suggestion.calories} cal
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <input
          className="input"
          type="number"
          min="0"
          placeholder="cal"
          aria-label="Calories"
          value={calories}
          onChange={(event) => setCalories(event.target.value)}
          style={{ width: 96, flex: "none", fontVariantNumeric: "tabular-nums" }}
        />

        <button type="submit" className="btn btn-primary">
          Add meal
        </button>

        <button type="button" className="btn btn-secondary" disabled style={{ gap: 8 }}>
          <CameraIcon size={15} />
          Scan
          <span className="tag tag-neutral" style={{ fontSize: 10, padding: "1px 7px" }}>
            soon
          </span>
        </button>
      </form>
    </div>
  );
}
