import { motion, AnimatePresence } from "framer-motion";
import FoodItem from "./FoodItem.jsx";

export default function MealList({ meals, onDelete, onUpdate }) {
  if (meals.length === 0) {
    return (
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="border border-dashed border-border px-4 py-6 text-center text-sm text-ink-mute"
      >
        No meals logged yet — add your first one above.
      </motion.p>
    );
  }

  return (
    <ul className="flex flex-col">
      <AnimatePresence initial={false}>
        {meals.map((meal) => (
          <FoodItem
            key={meal.id}
            name={meal.name}
            calories={meal.calories}
            id={meal.id}
            date={meal.date}
            onDelete={() => onDelete(meal.id)}
            onUpdate={(updates) => onUpdate(meal.id, updates)}
          />
        ))}
      </AnimatePresence>
    </ul>
  );
}
