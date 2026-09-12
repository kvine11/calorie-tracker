import { useState } from "react";
import { motion } from "framer-motion";
import { useFoodSearch } from "../hooks.js";
import { shortDate } from "../dates.js";
import { EASE_OUT } from "../motion.js";
import MacroLine from "./MacroLine.jsx";
import { SearchIcon } from "./Icons.jsx";

// Cmd/Ctrl-K anywhere: type, pick, and it's logged to the selected day. No
// calorie field — the form on Today is where portions get adjusted.
export default function QuickAddPalette({ entryDate, onSearch, onAdd, onClose }) {
  const [query, setQuery] = useState("");
  const { suggestions, isSearching, unavailable } = useFoodSearch(query, { onSearch, limit: 8 });
  const [activeIndex, setActiveIndex] = useState(0);

  // New results, keyboard back to the top one.
  const [shownSuggestions, setShownSuggestions] = useState(suggestions);
  if (suggestions !== shownSuggestions) {
    setShownSuggestions(suggestions);
    setActiveIndex(0);
  }

  const hasQuery = query.trim().length >= 2;
  const message = unavailable
    ? "Food search is unavailable right now — log it by hand on Today."
    : hasQuery && !isSearching && suggestions.length === 0
      ? "No matches — log it by hand on Today."
      : null;

  function add(food) {
    onAdd({ name: food.foodName, calories: food.calories, protein: food.protein, carbs: food.carbs, fats: food.fats });
    onClose();
  }

  function handleKeyDown(event) {
    if (suggestions.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      add(suggestions[activeIndex]);
    }
  }

  return (
    <motion.div
      className="palette-backdrop"
      onMouseDown={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.12 }}
    >
      <motion.div
        className="palette"
        role="dialog"
        aria-modal="true"
        aria-label="Quick add"
        onMouseDown={(event) => event.stopPropagation()}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 6 }}
        transition={{ duration: 0.16, ease: EASE_OUT }}
      >
        <div className="palette-input">
          <SearchIcon size={16} />
          <input
            type="text"
            placeholder="Search a food to log…"
            aria-label="Search foods"
            autoComplete="off"
            autoFocus
            role="combobox"
            aria-expanded={suggestions.length > 0}
            aria-controls="palette-results"
            aria-activedescendant={suggestions.length > 0 ? `palette-option-${activeIndex}` : undefined}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        {suggestions.length > 0 && (
          <ul id="palette-results" className="palette-results" role="listbox">
            {suggestions.map((food, index) => (
              <li
                key={`${food.foodName}-${index}`}
                id={`palette-option-${index}`}
                role="option"
                aria-selected={index === activeIndex}
              >
                <button
                  type="button"
                  tabIndex={-1}
                  className="suggestion"
                  data-active={index === activeIndex}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => add(food)}
                >
                  <span className="suggestion-text">
                    <span className="suggestion-name">{food.foodName}</span>
                    <MacroLine food={food} />
                  </span>
                  <span className="suggestion-cal">{food.calories} cal</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {message && <p className="palette-empty">{message}</p>}

        <div className="palette-footer">
          <span>Adds to {shortDate(entryDate)}</span>
          <span>
            <kbd>↑</kbd> <kbd>↓</kbd> choose · <kbd>Enter</kbd> add · <kbd>Esc</kbd> close
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}
