import { useRef, useState } from "react";
import { motion } from "framer-motion";
import DateSelection from "./DateSelection.jsx";
import { TrashIcon } from "./Icons.jsx";
import { useFoodSearch } from "../hooks.js";
import MacroLine from "./MacroLine.jsx";
import { MACROS, hasMacros, scaleMacro } from "../macros.js";

// The expanded half of a row. Mounted only while open, so its drafts always
// start from the meal as it currently is — no stale values after a cancel.
function MealDetail({ meal, weekStartsOn, onSearch, onSave, onClose, onDelete, onDuplicate }) {
  const [draftName, setDraftName] = useState(meal.name);
  const [draftCalories, setDraftCalories] = useState(meal.calories);
  const [draftDate, setDraftDate] = useState(meal.date);
  // Matches stay hidden until the name is actually edited — opening a row to
  // change its date shouldn't fill the card with suggestions for its own name.
  const dismissedRef = useRef(true);

  const { suggestions: matches } = useFoodSearch(draftName, { onSearch, limit: 5 });

  // Macros aren't editable, but they do move when the calories do — the backend
  // rescales them on save. Previewing that here means the number you see while
  // dragging the calorie field is the number you'll get.
  const ratio = meal.calories && draftCalories ? Number(draftCalories) / meal.calories : 1;
  const preview = Object.fromEntries(
    MACROS.map(({ key }) => [key, scaleMacro(meal[key], ratio)]),
  );
  const suggestions = dismissedRef.current
    ? []
    : matches.filter(
        (suggestion) => suggestion.foodName.toLowerCase() !== draftName.trim().toLowerCase(),
      );

  function handleSave() {
    if (!draftName.trim() || !draftCalories || !draftDate) return;
    onSave({ name: draftName.trim(), calories: Number(draftCalories), date: draftDate });
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-3)",
        animation: "riseIn 200ms ease both",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--space-3)",
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
          Meal detail
        </div>
        <button type="button" onClick={onClose} className="btn btn-ghost" style={{ fontFamily: "var(--font-body)", fontSize: 13 }}>
          Close
        </button>
      </div>

      <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap", alignItems: "flex-end" }}>
        <div className="field" style={{ flex: 1, minWidth: 200 }}>
          <label htmlFor={`meal-name-${meal.id}`}>Food</label>
          <input
            id={`meal-name-${meal.id}`}
            className="input"
            type="text"
            value={draftName}
            aria-label="Edit food name"
            onChange={(event) => {
              dismissedRef.current = false;
              setDraftName(event.target.value);
            }}
          />
        </div>
        <div className="field" style={{ width: 110 }}>
          <label htmlFor={`meal-cal-${meal.id}`}>Calories</label>
          <input
            id={`meal-cal-${meal.id}`}
            className="input"
            type="number"
            min="0"
            value={draftCalories}
            aria-label="Edit calories"
            onChange={(event) => setDraftCalories(event.target.value)}
            style={{ fontVariantNumeric: "tabular-nums" }}
          />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "var(--space-2)",
          padding: "var(--space-2) var(--space-3)",
          borderRadius: "var(--radius-sm)",
          background: "color-mix(in srgb, var(--color-text) 4%, transparent)",
        }}
      >
        <span
          style={{
            fontSize: 11,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "color-mix(in srgb, var(--color-text) 55%, transparent)",
          }}
        >
          Macros
        </span>
        {hasMacros(meal) ? (
          <>
            <MacroLine food={preview} size={13} />
            <span
              style={{
                marginLeft: "auto",
                fontSize: 11,
                color: "color-mix(in srgb, var(--color-text) 45%, transparent)",
              }}
            >
              {ratio === 1 ? "from the food database" : "rescaled to the new calories"}
            </span>
          </>
        ) : (
          <span style={{ fontSize: 12, color: "color-mix(in srgb, var(--color-text) 50%, transparent)" }}>
            — this meal was entered by hand
          </span>
        )}
      </div>

      {suggestions.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, animation: "riseIn 160ms ease both" }}>
          <div style={{ fontSize: 12, color: "color-mix(in srgb, var(--color-text) 70%, transparent)" }}>
            Matches — tap to fill name and calories
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {suggestions.map((suggestion, index) => (
              <button
                key={`${suggestion.foodName}-${index}`}
                type="button"
                className="chip"
                onClick={() => {
                  dismissedRef.current = true;
                  setDraftName(suggestion.foodName);
                  setDraftCalories(suggestion.calories);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 14px",
                  border: "1px solid var(--color-divider)",
                  borderRadius: 999,
                  background: "var(--color-neutral-100)",
                  cursor: "pointer",
                  fontFamily: "var(--font-body)",
                  fontSize: 13,
                  color: "var(--color-text)",
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
                <MacroLine food={suggestion} size={11} />
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <div
          style={{
            fontSize: 12,
            marginBottom: 6,
            color: "color-mix(in srgb, var(--color-text) 70%, transparent)",
          }}
        >
          Date — move this meal to another day
        </div>
        <DateSelection
          entryDate={draftDate}
          onDateChange={setDraftDate}
          weekStartsOn={weekStartsOn}
          compact
        />
      </div>

      <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap", alignItems: "center" }}>
        <button type="button" onClick={handleSave} className="btn btn-primary">
          Save changes
        </button>
        <button type="button" onClick={onDuplicate} className="btn btn-secondary">
          Duplicate to today
        </button>
        <button type="button" onClick={onDelete} className="btn btn-ghost" style={{ marginLeft: "auto" }}>
          Delete
        </button>
      </div>
    </div>
  );
}

export default function FoodItem({
  meal,
  color,
  isExpanded,
  isHovered,
  weekStartsOn,
  onExpand,
  onCollapse,
  onHover,
  onSave,
  onDelete,
  onDuplicate,
  onSearch,
}) {
  return (
    // `layout` is what makes the rows below a new meal slide down rather than
    // jump. The exit animation is the reason this needs framer-motion at all —
    // CSS can't animate an element that React is removing.
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0, transition: { duration: 0.2, ease: "easeIn" } }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1], layout: { type: "spring", stiffness: 380, damping: 34 } }}
      className="card"
      onMouseEnter={() => onHover(meal.id)}
      onMouseLeave={() => onHover(null)}
      style={{
        gap: "var(--space-2)",
        padding: "var(--space-3) var(--space-4)",
        background: isHovered ? "var(--color-neutral-200)" : "var(--color-surface)",
        boxShadow: "var(--shadow-sm)",
        transition: "background 160ms ease",
        overflow: "hidden",
      }}
    >
      {isExpanded ? (
        <MealDetail
          meal={meal}
          weekStartsOn={weekStartsOn}
          onSearch={onSearch}
          onSave={onSave}
          onClose={onCollapse}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
        />
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          <span style={{ width: 9, height: 9, borderRadius: 999, flex: "none", background: color }} />
          <button
            type="button"
            onClick={onExpand}
            style={{
              flex: 1,
              minWidth: 0,
              textAlign: "left",
              border: 0,
              background: "transparent",
              cursor: "pointer",
              fontFamily: "var(--font-body)",
              fontSize: 15,
              fontWeight: 600,
              color: "var(--color-text)",
              padding: 0,
            }}
          >
            {meal.name}
          </button>
          <span
            style={{
              fontSize: 14,
              fontVariantNumeric: "tabular-nums",
              color: "color-mix(in srgb, var(--color-text) 62%, transparent)",
            }}
          >
            {meal.calories} cal
          </span>
          <button
            type="button"
            onClick={onExpand}
            className="btn btn-ghost"
            style={{ fontFamily: "var(--font-body)", fontSize: 13 }}
          >
            Details
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="btn btn-icon btn-secondary"
            aria-label={`Delete ${meal.name}`}
            style={{ borderColor: "transparent" }}
          >
            <TrashIcon size={15} />
          </button>
        </div>
      )}
    </motion.div>
  );
}
