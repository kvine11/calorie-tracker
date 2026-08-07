import { useState } from "react";

export default function MealForm({ onAdd }) {
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    if (!name.trim() || !calories) return;

    onAdd(name.trim(), Number(calories));
    setName("");
    setCalories("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <label className="flex-1">
        <span className="text-xs font-semibold uppercase tracking-[0.15em] text-ink-mute">
          Food
        </span>
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="What did you eat?"
          aria-label="Food name"
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
          value={calories}
          onChange={(event) => setCalories(event.target.value)}
          placeholder="0"
          aria-label="Calories"
          className="mt-1 w-full border-b-2 border-border bg-transparent py-1.5 text-sm tabular-nums text-ink placeholder:text-ink-mute/70 focus:border-accent focus:outline-none"
        />
      </label>
      <button
        type="submit"
        className="bg-ink px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-bg transition hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        Add
      </button>
    </form>
  );
}
