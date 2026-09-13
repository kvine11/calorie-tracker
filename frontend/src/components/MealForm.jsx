import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useClickOutside, useFoodSearch } from "../hooks.js";
import MacroLine from "./MacroLine.jsx";
import { scaleMacro } from "../macros.js";

export default function MealForm({ onAdd, onSearch }) {
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  // The food picked from search, if any. Its macros are scaled to whatever the
  // calorie field ends up at; nothing picked means macros are genuinely unknown.
  const [picked, setPicked] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isSaving, setIsSaving] = useState(false);
  // Lights the card's edge after a successful add — deliberately not a scale or
  // a bounce, because the ring is the only thing allowed to move like that.
  const [flash, setFlash] = useState(false);

  const fieldRef = useRef(null);
  const nameRef = useRef(null);
  const caloriesRef = useRef(null);

  // No search once a match is picked: the name already is the match.
  const { suggestions, unavailable } = useFoodSearch(name, { onSearch, enabled: !picked });

  // New results, fresh keyboard position.
  const [shownSuggestions, setShownSuggestions] = useState(suggestions);
  if (suggestions !== shownSuggestions) {
    setShownSuggestions(suggestions);
    setActiveIndex(-1);
  }

  useClickOutside(fieldRef, () => setIsOpen(false));

  const showSuggestions = isOpen && suggestions.length > 0;
  const canSubmit = name.trim() !== "" && calories !== "" && !isSaving;

  // Picking fills both fields but leaves calories editable — the portion on the
  // plate is rarely the portion the database assumed — so focus moves there.
  function handlePick(food) {
    setName(food.foodName);
    setCalories(String(food.calories));
    setPicked(food);
    setIsOpen(false);
    caloriesRef.current?.focus();
  }

  function handleNameKeyDown(event) {
    if (!showSuggestions) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      handlePick(suggestions[activeIndex]);
    } else if (event.key === "Escape") {
      setIsOpen(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit) return;

    const ratio = picked?.calories ? Number(calories) / picked.calories : 1;

    setIsSaving(true);
    const ok = await onAdd({
      name: name.trim(),
      calories: Number(calories),
      protein: scaleMacro(picked?.protein, ratio),
      carbs: scaleMacro(picked?.carbs, ratio),
      fats: scaleMacro(picked?.fats, ratio),
    });
    setIsSaving(false);

    // On failure the toast explains, and what was typed stays put.
    if (!ok) return;
    setName("");
    setCalories("");
    setPicked(null);
    setIsOpen(false);
    setFlash(true);
    nameRef.current?.focus();
  }

  return (
    <div
      className="card log-card"
      data-flash={flash}
      onAnimationEnd={(event) => event.target === event.currentTarget && setFlash(false)}
    >
      <form className="log-row" onSubmit={handleSubmit}>
        <div ref={fieldRef} className="log-name">
          <input
            ref={nameRef}
            className="input"
            type="text"
            placeholder="What did you eat?"
            aria-label="Food name"
            autoComplete="off"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={showSuggestions}
            aria-controls="meal-suggestions"
            aria-activedescendant={showSuggestions && activeIndex >= 0 ? `meal-suggestion-${activeIndex}` : undefined}
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setPicked(null);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleNameKeyDown}
          />

          <AnimatePresence>
            {showSuggestions && (
              // The container fades; the rows don't stagger. Staggered search
              // results feel slow, and fast logging is the point (DESIGN.md).
              <motion.ul
                id="meal-suggestions"
                role="listbox"
                className="suggestions"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.09 }}
              >
                {suggestions.map((food, index) => (
                  <li
                    key={`${food.foodName}-${index}`}
                    id={`meal-suggestion-${index}`}
                    role="option"
                    aria-selected={index === activeIndex}
                  >
                    <button
                      type="button"
                      tabIndex={-1}
                      className="suggestion"
                      data-active={index === activeIndex}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => handlePick(food)}
                    >
                      <span className="suggestion-text">
                        <span className="suggestion-name">{food.foodName}</span>
                        <MacroLine food={food} />
                      </span>
                      <span className="suggestion-cal">{food.calories} cal</span>
                    </button>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>

        <input
          ref={caloriesRef}
          className="input log-cal"
          type="number"
          min="0"
          inputMode="numeric"
          placeholder="cal"
          aria-label="Calories"
          value={calories}
          onChange={(event) => setCalories(event.target.value)}
        />

        <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
          Add
        </button>
      </form>

      {unavailable && <p className="log-hint">Food search is unavailable right now — enter the calories by hand.</p>}
    </div>
  );
}
