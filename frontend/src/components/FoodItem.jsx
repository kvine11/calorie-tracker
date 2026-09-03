import { useRef, useState } from "react";
import DateSelection from "./DateSelection.jsx";
import { TrashIcon } from "./Icons.jsx";
import { useFoodSearch } from "../hooks.js";

/**
 * The expanded form inside a meal row: edit the name, calories or date, or
 * duplicate and delete the meal.
 *
 * This is a separate component that only exists while the row is open, and that
 * is the whole trick. Its draft values are set from the meal when it mounts, so
 * closing and reopening always starts fresh from the current values. The
 * previous version kept this state alive permanently and had to reset it by
 * hand, which is where a bug came from: cancelling an edit and reopening the row
 * showed the abandoned draft values instead of the real ones.
 *
 * The date picker in here is a second, completely separate instance of
 * DateSelection. The one at the top of the page controls which day you are
 * looking at; this one moves this single meal to a different day. Saving a new
 * date makes the meal disappear from the current list on the next refetch,
 * without any code that specifically handles "this meal moved away".
 *
 * Search matches appear as wrapped chips below the fields rather than a floating
 * dropdown. This card is narrow, and a dropdown here used to cover the calorie
 * field, the buttons and the date picker. MealForm still uses a real dropdown
 * because it has the room for one.
 *
 * @param {object} props
 * @param {{id: number, name: string, calories: number, date: string}} props.meal
 * @param {number} props.weekStartsOn
 * @param {(query: string) => Promise<Array>} props.onSearch
 * @param {(updates: {name: string, calories: number, date: string}) => void} props.onSave
 *   Called with one object rather than separate arguments, matching what api.js's
 *   updateMeal(id, updates) expects. Note calories is converted with Number()
 *   first: a number input still hands back a string, so without that conversion
 *   the PUT body would send "550" instead of 550.
 * @param {() => void} props.onClose
 * @param {() => void} props.onDelete
 * @param {() => void} props.onDuplicate
 */
function MealDetail({ meal, weekStartsOn, onSearch, onSave, onClose, onDelete, onDuplicate }) {
  const [draftName, setDraftName] = useState(meal.name);
  const [draftCalories, setDraftCalories] = useState(meal.calories);
  const [draftDate, setDraftDate] = useState(meal.date);
  // Matches stay hidden until the name is actually edited — opening a row to
  // change its date shouldn't fill the card with suggestions for its own name.
  const dismissedRef = useRef(true);

  const { suggestions: matches } = useFoodSearch(draftName, { onSearch, limit: 5 });
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

/**
 * A single meal, shown either as a compact row or expanded into its edit form.
 *
 * Collapsed, it shows a colored dot matching its arc in the ring, the name, the
 * calorie count, a Details button and a delete button. Hovering anywhere on the
 * row reports up to TodayView, which highlights the matching arc.
 *
 * The row itself holds no state at all. Whether it is open is MealList's
 * business, and every piece of editing state belongs to MealDetail, which only
 * exists while the row is open.
 *
 * The delete button calls up to App rather than deleting directly, because App
 * is where the confirm-or-undo preference gets checked.
 *
 * @param {object} props
 * @param {{id: number, name: string, calories: number, date: string}} props.meal
 * @param {string} props.color Its color from SEG_COLORS — the dot that ties this row to its arc.
 * @param {boolean} props.isExpanded
 * @param {boolean} props.isHovered Driven by the shared hoverId, so the ring's legend can highlight this row too.
 * @param {number} props.weekStartsOn
 * @param {() => void} props.onExpand
 * @param {() => void} props.onCollapse
 * @param {(id: number|null) => void} props.onHover
 * @param {(updates: object) => void} props.onSave MealList attaches the id.
 * @param {() => void} props.onDelete
 * @param {() => void} props.onDuplicate
 * @param {(query: string) => Promise<Array>} props.onSearch
 */
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
    <div
      className="card"
      onMouseEnter={() => onHover(meal.id)}
      onMouseLeave={() => onHover(null)}
      style={{
        gap: "var(--space-2)",
        padding: "var(--space-3) var(--space-4)",
        background: isHovered ? "var(--color-neutral-200)" : "var(--color-surface)",
        boxShadow: "var(--shadow-sm)",
        animation: "riseIn 260ms ease both",
        transition: "background 160ms ease",
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
    </div>
  );
}
