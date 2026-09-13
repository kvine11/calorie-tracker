import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import DateSelection from "./DateSelection.jsx";
import MacroLine from "./MacroLine.jsx";
import { TrashIcon } from "./Icons.jsx";
import { MACROS, hasMacros, scaleMacro } from "../macros.js";
import { todayISO } from "../dates.js";
import { EASE_OUT, LAYOUT_SPRING } from "../motion.js";

// The expanded half of a row. Mounted only while open, so its drafts always
// start from the meal as it is now — no stale values after a cancel.
//
// There's deliberately no food-name search here. Picking a different food
// would change the name and calories but keep this meal's old macros (the
// update rescales what's stored), so a meal renamed to "Apple" would carry the
// steak's protein. Editing is for fixing a portion, a typo, or the day.
function MealDetail({ meal, onSave, onCancel, onDelete, onDuplicate }) {
  const [draftName, setDraftName] = useState(meal.name);
  const [draftCalories, setDraftCalories] = useState(String(meal.calories));
  const [draftDate, setDraftDate] = useState(meal.date);

  const calories = draftCalories === "" ? null : Number(draftCalories);
  const isValid = draftName.trim() !== "" && calories != null && calories >= 0;
  const isDirty = draftName.trim() !== meal.name || calories !== meal.calories || draftDate !== meal.date;

  // Macros move with the calories — the backend rescales them on save.
  // Previewing it here means the numbers you see are the numbers you'll get.
  const ratio = meal.calories && calories != null ? calories / meal.calories : 1;
  const preview = Object.fromEntries(MACROS.map(({ key }) => [key, scaleMacro(meal[key], ratio)]));

  function handleSubmit(event) {
    event.preventDefault();
    if (!isValid || !isDirty) return;
    onSave({ name: draftName.trim(), calories, date: draftDate });
  }

  return (
    <form
      className="meal-detail"
      onSubmit={handleSubmit}
      onKeyDown={(event) => {
        if (event.key === "Escape") onCancel();
      }}
    >
      <div className="detail-fields">
        <label className="field field-grow">
          Food
          <input
            className="input"
            type="text"
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
          />
        </label>
        <label className="field field-cal">
          Calories
          <input
            className="input"
            type="number"
            min="0"
            inputMode="numeric"
            value={draftCalories}
            onChange={(event) => setDraftCalories(event.target.value)}
          />
        </label>
      </div>

      <div className="detail-macros">
        <span className="section-label">Macros</span>
        {hasMacros(meal) ? (
          <>
            <MacroLine food={preview} size={13} />
            {ratio !== 1 && calories != null && <span>rescaled to {calories} cal</span>}
          </>
        ) : (
          <span>unknown — entered by hand</span>
        )}
      </div>

      <div className="field">
        Day
        <DateSelection
          entryDate={draftDate}
          onDateChange={setDraftDate}
          showWeekNav
          compact
          layoutId={`day-highlight-${meal.id}`}
        />
      </div>

      <div className="detail-actions">
        <button type="submit" className="btn btn-primary btn-sm" disabled={!isValid || !isDirty}>
          Save
        </button>
        <button type="button" className="btn btn-quiet btn-sm" onClick={onCancel}>
          Cancel
        </button>
        {meal.date !== todayISO() && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={onDuplicate}>
            Log again today
          </button>
        )}
        <button type="button" className="btn btn-quiet btn-sm push" onClick={onDelete}>
          Delete
        </button>
      </div>
    </form>
  );
}

export default function FoodItem({ meal, color, isExpanded, isHovered, onToggle, onHover, onSave, onDelete, onDuplicate }) {
  return (
    // layout="position": when a row above is added or removed, this one slides
    // to its new place instead of jumping. "position" rather than full `layout`
    // so an expanding row grows for real instead of being scaled (which would
    // squash its text). The exit is why this needs framer-motion at all — CSS
    // can't animate an element React is removing.
    <motion.div
      layout="position"
      className="meal-row"
      data-expanded={isExpanded}
      data-hovered={isHovered}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, transition: { duration: 0.2, ease: "easeIn" } }}
      transition={{ duration: 0.22, ease: EASE_OUT, layout: LAYOUT_SPRING }}
      onMouseEnter={() => onHover(meal.id)}
      onMouseLeave={() => onHover(null)}
    >
      <div className="meal-row-main">
        <button type="button" className="meal-toggle" aria-expanded={isExpanded} onClick={onToggle}>
          <span className="dot" style={{ background: color }} />
          <span className="meal-name">{meal.name}</span>
          <span className="meal-macros">
            <MacroLine food={meal} />
          </span>
          <span className="meal-cal">
            {meal.calories}
            <small>cal</small>
          </span>
        </button>
        <button
          type="button"
          className="btn btn-icon btn-sm btn-quiet meal-delete"
          aria-label={`Delete ${meal.name}`}
          onClick={onDelete}
        >
          <TrashIcon size={14} />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ height: { duration: 0.24, ease: EASE_OUT }, opacity: { duration: 0.16 } }}
            style={{ overflow: "hidden" }}
          >
            <MealDetail
              meal={meal}
              onSave={onSave}
              onCancel={onToggle}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
