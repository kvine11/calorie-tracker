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
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
      <input
        type="text"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Food name"
        aria-label="Food name"
        className="flex-1 rounded-full border border-border bg-card px-4 py-2 text-sm text-ink placeholder:text-ink-mute focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
      />
      <input
        type="number"
        min="0"
        value={calories}
        onChange={(event) => setCalories(event.target.value)}
        placeholder="Calories"
        aria-label="Calories"
        className="w-full rounded-full border border-border bg-card px-4 py-2 text-sm text-ink placeholder:text-ink-mute focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent sm:w-32"
      />
      <button
        type="submit"
        className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        Add
      </button>
    </form>
  );
}
