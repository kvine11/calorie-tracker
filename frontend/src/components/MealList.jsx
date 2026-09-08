import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import FoodItem from "./FoodItem.jsx";
import { SEG_COLORS } from "./CalorieRing.jsx";

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

      <AnimatePresence initial={false}>
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
      </AnimatePresence>

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
