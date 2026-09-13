import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import FoodItem from "./FoodItem.jsx";
import { SEG_COLORS } from "./CalorieRing.jsx";

export default function MealList({ listKey, meals, hoverId, onHover, onUpdate, onDelete, onDuplicate }) {
  // Only one meal is ever open, so the list never turns into a wall of forms.
  const [expandedId, setExpandedId] = useState(null);

  // A different day loaded: close whatever was open on the previous one.
  const [shownKey, setShownKey] = useState(listKey);
  if (listKey !== shownKey) {
    setShownKey(listKey);
    setExpandedId(null);
  }

  return (
    <section className="meal-list" aria-label="Meals">
      <div className="meal-list-head">
        <span className="section-label">Meals</span>
        <span className="section-count">{meals.length}</span>
      </div>

      {/* Two levels of animation. Switching days crossfades the whole ledger —
          otherwise every row would exit and every new row enter at once. Adding
          or deleting within the same day animates just that row. */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={listKey ?? "loading"}
          className="card ledger"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.14 }}
        >
          <AnimatePresence initial={false}>
            {meals.map((meal, index) => (
              <FoodItem
                key={meal.id}
                meal={meal}
                color={SEG_COLORS[index % SEG_COLORS.length]}
                isExpanded={expandedId === meal.id}
                isHovered={hoverId === meal.id}
                onToggle={() => setExpandedId((id) => (id === meal.id ? null : meal.id))}
                onHover={onHover}
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

          {meals.length === 0 && <p className="meal-empty">Nothing logged for this day yet.</p>}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
