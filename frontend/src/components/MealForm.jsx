import { useRef, useState } from "react";
import { useClickOutside, useFoodSearch } from "../hooks.js";
import { CameraIcon } from "./Icons.jsx";
import MacroLine from "./MacroLine.jsx";
import { scaleMacro } from "../macros.js";

export default function MealForm({ onAdd, onSearch }) {
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [macros, setMacros] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const fieldRef = useRef(null);

  const { suggestions } = useFoodSearch(name, { onSearch });
  useClickOutside(fieldRef, () => setIsOpen(false));

  function handleSubmit(event) {
    event.preventDefault();
    if (!name.trim() || !calories) return;

    // Macros aren't typed — they come from the food that was picked, scaled to
    // whatever portion the calorie field ended up at. Nothing picked means the
    // macros are genuinely unknown, which is null, not zero.
    const ratio = macros && macros.calories ? Number(calories) / macros.calories : 1;

    onAdd(
      name.trim(),
      Number(calories),
      scaleMacro(macros?.protein, ratio),
      scaleMacro(macros?.carbs, ratio),
      scaleMacro(macros?.fats, ratio),
    );
    setName("");
    setCalories("");
    setMacros(null);
    setIsOpen(false);
  }

  // Picking a match fills both fields but leaves calories editable — the
  // portion on the plate is rarely the portion the database assumed.
  function handlePick(suggestion) {
    setName(suggestion.foodName);
    setCalories(suggestion.calories);
    setMacros(suggestion);
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
              setMacros(null);
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
                    <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                      <span>{suggestion.foodName}</span>
                      <MacroLine food={suggestion} />
                    </span>
                    <span
                      style={{
                        flex: "none",
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
