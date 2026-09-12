import { useState } from "react";
import CalorieRing from "./CalorieRing.jsx";
import DateSelection from "./DateSelection.jsx";
import MealForm from "./MealForm.jsx";
import MealList from "./MealList.jsx";
import { longDate, todayISO } from "../dates.js";

export default function TodayView({
  entryDate,
  mealsDate,
  meals,
  loadError,
  onRetry,
  onDateChange,
  onAdd,
  onUpdate,
  onDelete,
  onDuplicate,
  onSearch,
}) {
  // Hovering a meal row lifts its arc in the ring.
  const [hoverId, setHoverId] = useState(null);
  const total = meals.reduce((sum, meal) => sum + meal.calories, 0);
  const isToday = entryDate === todayISO();

  return (
    <div className="today">
      <header className="today-header">
        <div className="today-heading">
          {/* The heading is the selected day, so browsing back never leaves a
              "today" label sitting above another day's number. */}
          <h1 className="today-title">{longDate(entryDate)}</h1>
          {!isToday && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => onDateChange(todayISO())}>
              Back to today
            </button>
          )}
        </div>
        <DateSelection entryDate={entryDate} onDateChange={onDateChange} showWeekNav />
      </header>

      {loadError && (
        <div className="banner" role="alert">
          <span>{loadError}</span>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onRetry}>
            Retry
          </button>
        </div>
      )}

      <section className="today-grid">
        {/* Remounts per loaded day, so the ring draws itself in for each one. */}
        <CalorieRing key={mealsDate ?? "loading"} meals={meals} total={total} hoverId={hoverId} />

        <div className="today-log">
          <MealForm onAdd={onAdd} onSearch={onSearch} />
          <MealList
            listKey={mealsDate}
            meals={meals}
            hoverId={hoverId}
            onHover={setHoverId}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
          />
        </div>
      </section>
    </div>
  );
}
