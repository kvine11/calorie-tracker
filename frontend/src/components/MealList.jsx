import { useState } from "react";
import FoodItem from "./FoodItem.jsx";
import { SEG_COLORS } from "./CalorieRing.jsx";

/**
 * Renders the day's meals as a list of rows, or a message when the day is empty.
 *
 * It owns `expandedId`, so only one meal can be open for editing at a time.
 * Opening a second row closes the first. Without that, a day with eight meals
 * could turn into eight open forms stacked down the page.
 *
 * This is also the layer that attaches each meal's id to the callbacks. FoodItem
 * calls onSave(updates) knowing nothing about ids, and this wraps it into
 * onUpdate(meal.id, updates). That keeps the child component simple and matches
 * how delete has worked since v1. Each wrapper also clears expandedId, so acting
 * on a meal closes its form.
 *
 * @param {object} props
 * @param {Array<{id: number, name: string, calories: number, date: string}>} props.meals
 * @param {number} props.weekStartsOn Passed down to each open row's date picker.
 * @param {number|null} props.hoverId Shared with CalorieRing through TodayView.
 * @param {(id: number|null) => void} props.onHover
 * @param {(id: number, updates: object) => void} props.onUpdate
 * @param {(meal: object) => void} props.onDelete
 * @param {(meal: object) => void} props.onDuplicate
 * @param {(query: string) => Promise<Array>} props.onSearch
 */
export default function MealList({
  meals,
  weekStartsOn,
  hoverId,
  onHover,
  onUpdate,
  onDelete,
  onDuplicate,
  onSearch,
}) {
  // Only one meal is ever open, so the list never turns into a wall of forms.
  const [expandedId, setExpandedId] = useState(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          padding: "0 var(--space-3)",
        }}
      >
        <h4 style={{ margin: 0 }}>
          {meals.length === 1 ? "1 meal logged" : `${meals.length} meals logged`}
        </h4>
      </div>

      {meals.map((meal, index) => (
        <FoodItem
          key={meal.id}
          meal={meal}
          color={SEG_COLORS[index % SEG_COLORS.length]}
          weekStartsOn={weekStartsOn}
          isExpanded={expandedId === meal.id}
          isHovered={hoverId === meal.id}
          onExpand={() => setExpandedId(meal.id)}
          onCollapse={() => setExpandedId(null)}
          onHover={onHover}
          onSearch={onSearch}
          onSave={(updates) => {
            setExpandedId(null);
            onUpdate(meal.id, updates);
          }}
          onDelete={() => {
            setExpandedId(null);
            onDelete(meal);
          }}
          onDuplicate={() => {
            setExpandedId(null);
            onDuplicate(meal);
          }}
        />
      ))}

      {meals.length === 0 && (
        <div
          style={{
            border: "1px dashed var(--color-neutral-400)",
            borderRadius: "calc(var(--radius-lg) * 1.15)",
            padding: "var(--space-8) var(--space-4)",
            textAlign: "center",
            color: "color-mix(in srgb, var(--color-text) 55%, transparent)",
            fontSize: 14,
          }}
        >
          Nothing logged for this day yet. Add the first meal above.
        </div>
      )}
    </div>
  );
}
