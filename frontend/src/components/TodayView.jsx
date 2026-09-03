import { useState } from "react";
import CalorieRing from "./CalorieRing.jsx";
import DateSelection from "./DateSelection.jsx";
import MealForm from "./MealForm.jsx";
import MealList from "./MealList.jsx";
import { longDate } from "../dates.js";

/**
 * The main screen: one day's meals, shown four ways at once — as a heading, a
 * ring chart, an add form, and a list.
 *
 * It owns one piece of state: `hoverId`, the id of the meal the mouse is
 * currently over. Three separate components read it — the ring's arcs, the
 * ring's legend, and the meal list rows — so hovering any one of them highlights
 * the matching arc and dims the rest.
 *
 * That shared highlight is what makes the ring readable. Without it, a ring of
 * six similar-looking arcs does not tell you which meal is which.
 *
 * The state lives here rather than inside the ring or the list because those two
 * are siblings, and sibling components can only share state through their common
 * parent.
 *
 * Note this is a mouse-only interaction. Touch devices have no hover state, so
 * this will need a tap equivalent when mobile is addressed.
 *
 * The day's total is calculated here with reduce() rather than stored in state.
 * A value derived at render time cannot fall out of sync with the list it came
 * from.
 *
 * @param {object} props
 * @param {string} props.entryDate The day being shown, as "yyyy-MM-dd".
 * @param {(date: string) => void} props.onDateChange Called by the day picker; triggers App's refetch.
 * @param {Array<{id: number, name: string, calories: number, date: string}>} props.meals
 * @param {number} props.weekStartsOn 0 for Sunday, 1 for Monday, from Settings.
 * @param {(name: string, calories: number, date?: string) => void} props.onAdd
 * @param {(id: number, updates: object) => void} props.onUpdate
 * @param {(meal: object) => void} props.onDelete Goes to App's confirm-or-undo logic, not a direct delete.
 * @param {(meal: object) => void} props.onDuplicate Re-adds this meal onto today.
 * @param {(query: string) => Promise<Array>} props.onSearch The shared food search function.
 */
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
