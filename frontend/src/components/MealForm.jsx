import { useState, useEffect } from "react";

export default function MealForm({ onAdd, onSearch }) {
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const debouncedQuery = useDebounce(name, 300);


  function handleSubmit(event) {
    event.preventDefault();
    if (!name.trim() || !calories) return;

    onAdd(name.trim(), Number(calories));
    setName("");
    setCalories("");
  }

  function useDebounce(value, delay = 300) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      // Clear timeout if value changes before delay finishes
      return () => clearTimeout(handler);
    }, [value, delay]);

    return debouncedValue;
  }

  useEffect(() => {
    if(debouncedQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    onSearch(debouncedQuery).then(setSuggestions);
  }, [debouncedQuery]);



  const handleSelect = ({foodName, calories}) => {
    setName(foodName);
    setCalories(calories);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <label className="relative flex-1">
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

        {suggestions.length > 0 && (
          <ul className="absolute left-0 right-0 top-full z-10 mt-1 border border-border bg-card">
            {suggestions.slice(0, 10).map((suggestion, index) => (
              <li key={index}>
                <button
                  type="button"
                  onClick={() => handleSelect(suggestion)}
                  className="flex w-full items-center justify-between gap-4 px-3 py-2 text-left text-sm text-ink hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                >
                  <span>{suggestion.foodName}</span>
                  <span className="tabular-nums text-ink-mute">{suggestion.calories} cal</span>
                </button>
              </li>
            ))}
          </ul>
        )}
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
