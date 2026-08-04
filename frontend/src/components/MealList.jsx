import FoodItem from "./FoodItem.jsx";

export default function MealList({ meals, onDelete }) {
  if (meals.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-sm text-ink-mute">
        No meals logged yet — add your first one above.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {meals.map((meal) => (
        <FoodItem
          key={meal.id}
          name={meal.name}
          calories={meal.calories}
          onDelete={() => onDelete(meal.id)}
        />
      ))}
    </ul>
  );
}
