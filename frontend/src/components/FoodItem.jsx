import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import DateSelection from "./DateSelection.jsx";

export default function FoodItem({ name, calories, id, date, onUpdate, onDelete }) {

  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(name);
  const [draftCalories, setDraftCalories] = useState(calories);
  const [draftDate, setDraftDate] = useState(date);

  function handleEditClick() {
    setDraftName(name);
    setDraftCalories(calories);
    setDraftDate(date);
    setIsEditing(true);
  }

  function handleSave() {
    if (!draftName.trim() || !draftCalories || !draftDate) {
      return;
    }
    onUpdate({name: draftName, calories: Number(draftCalories), date: draftDate});
    setIsEditing(false);
  }

  function handleCancel() {
    setIsEditing(false);
  }

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -12, transition: { duration: 0.2 } }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col gap-3 border-b border-border py-3 last:border-b-0"
    >
      <AnimatePresence mode="wait" initial={false}>
      {isEditing ? (
        <motion.div
          key="edit"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="flex flex-col gap-3"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex-1">
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-ink-mute">
                Food
              </span>
              <input
                type="text"
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                aria-label="Edit food name"
                className="mt-1 w-full border-b-2 border-border bg-transparent py-1.5 text-sm text-ink placeholder:text-ink-mute/70 focus:border-accent focus:outline-none"
              />
            </label>
            <label className="sm:w-24">
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-ink-mute">
                Cal
              </span>
              <input
                type="number"
                min="0"
                value={draftCalories}
                onChange={(event) => setDraftCalories(event.target.value)}
                aria-label="Edit calories"
                className="mt-1 w-full border-b-2 border-border bg-transparent py-1.5 text-sm tabular-nums text-ink placeholder:text-ink-mute/70 focus:border-accent focus:outline-none"
              />
            </label>
          </div>

          <DateSelection
            entryDate={draftDate}
            onDateChange={setDraftDate}
            layoutId={`day-highlight-edit-${id}`}
          />

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-semibold uppercase tracking-wide text-ink-mute transition hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="bg-ink px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-bg transition hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Save
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="display"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="flex items-center justify-between gap-4"
        >
          <span className="font-medium text-ink">{name}</span>
          <div className="flex items-center gap-3">
            <span className="text-sm tabular-nums text-ink-mute">{calories} cal</span>
            <button
              type="button"
              onClick={onDelete}
              aria-label={`Delete ${name}`}
              className="rounded-full px-1.5 py-1 text-lg leading-none text-ink-mute transition hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              ×
            </button>
            <button
              type="button"
              onClick={handleEditClick}
              aria-label={`Update ${name}`}
              className="rounded-full px-1.5 py-1 text-lg leading-none text-ink-mute transition hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              ✎
            </button>
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </motion.li>
  );
}
