import { useState } from "react";
import CalorieRing from "./CalorieRing.jsx";
import DateSelection from "./DateSelection.jsx";
import MealForm from "./MealForm.jsx";
import MealList from "./MealList.jsx";
import { longDate } from "../dates.js";

export default function TodayView({
  entryDate,
  onDateChange,
  meals,
  weekStartsOn,
  onAdd,
  onUpdate,
  onDelete,
  onDuplicate,
  onSearch,
}) {
  // Hovering a meal — in the list or the legend — lifts its arc in the ring.
  const [hoverId, setHoverId] = useState(null);
  const total = meals.reduce((sum, meal) => sum + meal.calories, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--space-6)",
          flexWrap: "wrap",
          paddingBottom: "var(--space-4)",
          borderBottom: "1px solid var(--color-divider)",
        }}
      >
        {/* The heading is the selected day, so browsing back never leaves a
            "today" label sitting above another day's number. */}
        <h1 style={{ margin: 0, fontSize: 38 }}>{longDate(entryDate)}</h1>
        <DateSelection
          entryDate={entryDate}
          onDateChange={onDateChange}
          weekStartsOn={weekStartsOn}
          showWeekNav
        />
      </header>

      <section
        data-grid
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(280px, 340px) minmax(0, 1fr)",
          gap: "var(--space-6)",
          alignItems: "start",
        }}
      >
        {/* Remounts per day so the ring redraws itself on each date change. */}
        <CalorieRing
          key={entryDate}
          meals={meals}
          total={total}
          hoverId={hoverId}
          onHover={setHoverId}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <MealForm onAdd={onAdd} onSearch={onSearch} />
          <MealList
            meals={meals}
            weekStartsOn={weekStartsOn}
            hoverId={hoverId}
            onHover={setHoverId}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onSearch={onSearch}
          />
        </div>
      </section>
    </div>
  );
}
