// Custom React hooks shared across the app.
//
// A hook is just a function that lets components reuse stateful logic. These
// were pulled out during the frontend revamp. Before this file existed, the
// search-as-you-type logic was copy-pasted into two components and had already
// started to drift apart between them. Extracting it here is what made it
// possible for four very different-looking parts of the UI to share one
// behavior.

import { useEffect, useRef, useState } from "react";

/**
 * Waits until a value stops changing before passing it along.
 *
 * The problem it solves: typing "chicken" fires seven state updates, one per
 * keystroke. Without this, that would be seven API calls for a single search.
 *
 * How it works: every time the value changes, it starts a timer and cancels the
 * previous one. Only the last timer in a burst of typing survives long enough to
 * fire, so seven keystrokes become one request.
 *
 * @param {*} value The value that changes rapidly, usually text from an input.
 * @param {number} [delay=300] How long the value must hold still, in milliseconds.
 * @returns {*} The same value, but delayed.
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Search-as-you-type against the food database. Calls GET /api/meals/search,
 * which is the Spring Boot endpoint that talks to the FatSecret API.
 *
 * This hook is the single place the search behavior is defined. It handles four
 * things that are individually easy to get wrong:
 *
 *   1. Debouncing, so typing does not fire one request per keystroke.
 *   2. A two-character minimum, so a single letter does not ask the API for
 *      thousands of matches.
 *   3. A guard against out-of-order responses. Requests do not necessarily come
 *      back in the order they were sent, so a slow response for "chi" could
 *      arrive after a fast one for "chicken" and overwrite the newer results
 *      with older ones. The effect's cleanup function sets a `cancelled` flag,
 *      so a response that arrives after its query is stale gets thrown away.
 *   4. Limiting how many results are kept.
 *
 * What it deliberately does not handle is how results look. Four parts of the
 * app call this hook and each displays the list differently:
 *
 *   - MealForm      a dropdown floating under the input
 *   - FoodItem      wrapped chips, because a dropdown would cover the small card
 *   - SearchView    full-width rows with an Add button
 *   - QuickAddPalette   a command-palette style list
 *
 * That split is the reason there is no shared "suggestions list" component. The
 * part worth reusing was the data fetching. The markup genuinely differs each
 * time, and forcing one component to cover all four cases would have meant a
 * pile of layout props.
 *
 * A search matching nothing returns an empty array, never an error. That matters
 * more than it sounds: the entire point of the feature is that you can type
 * anything, get no matches, and still log the meal by hand.
 *
 * @param {string} query The current text, before debouncing.
 * @param {object} options
 * @param {boolean} [options.enabled=true] When false, skips searching entirely.
 *   Nothing passes this today (FoodItem uses its own flag instead), but the
 *   option exists because a hook cannot be wrapped in an `if`. React requires
 *   hooks to run in the same order on every render, so "sometimes do not search"
 *   has to be a parameter rather than a conditional call.
 * @param {(query: string) => Promise<Array<{foodName: string, calories: number}>>} options.onSearch
 *   The function that performs the fetch. App.jsx wraps this in useCallback so
 *   the same function object is reused between renders. That is required, not a
 *   micro-optimization: this hook lists onSearch as a useEffect dependency, so a
 *   newly-created arrow function on every render would look like a changed
 *   dependency, re-run the effect, and loop.
 * @param {number} [options.limit=6] How many results to keep. Each caller picks
 *   its own based on the space it has: 5 in a meal card, 6 in the log form, 8 in
 *   the palette, 20 on the full search screen.
 * @returns {{suggestions: Array<{foodName: string, calories: number}>, isSearching: boolean}}
 *   isSearching stays true during the debounce wait as well as the request
 *   itself. Without that, the UI would briefly flash "no matches" in the gap
 *   between the last keystroke and the request actually going out.
 */
export function useFoodSearch(query, { enabled = true, onSearch, limit = 6 }) {
  const debouncedQuery = useDebounce(query, 300);
  const [suggestions, setSuggestions] = useState([]);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    if (!enabled || debouncedQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    // A slow response for an older query must not overwrite a newer one.
    let cancelled = false;
    setIsFetching(true);
    onSearch(debouncedQuery).then((results) => {
      if (cancelled) return;
      setSuggestions(results.slice(0, limit));
      setIsFetching(false);
    });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, enabled, onSearch, limit]);

  // Keystrokes that haven't been sent yet count as searching too, so callers
  // don't flash "no matches" between the last keypress and the request.
  return { suggestions, isSearching: isFetching || debouncedQuery !== query };
}

/**
 * Runs `handler` when the user clicks anywhere outside the given element.
 * MealForm uses it to close its suggestions dropdown.
 *
 * The interesting part is why the handler is stored in a ref rather than used
 * directly. This hook attaches one listener to the document and leaves it there.
 * If it used the function argument directly, that listener would capture the
 * very first version of the function it ever saw, along with whatever state that
 * version could see at the time. It would keep calling that stale version
 * forever.
 *
 * This is called a stale closure, and it was a real bug here. The old code
 * checked `suggestions.length > 0` inside a listener registered once on mount,
 * so it always read the empty array from mount, the check was permanently false,
 * and the dropdown never closed on an outside click.
 *
 * Storing the handler in a ref and reassigning it on every render fixes it. The
 * listener reads handlerRef.current at click time, so it always runs the newest
 * version, seeing current state.
 *
 * @param {React.RefObject<HTMLElement>} ref The element that counts as "inside".
 * @param {(event: MouseEvent) => void} handler Runs on a click outside it.
 */
export function useClickOutside(ref, handler) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    function handleMouseDown(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        handlerRef.current(event);
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [ref]);
}

/**
 * Animates a number toward a target value, so the calorie total in the middle of
 * the ring rolls up instead of jumping.
 *
 * It uses requestAnimationFrame, which asks the browser to run a function just
 * before each repaint, roughly 60 times a second. Each frame moves the displayed
 * value a little closer to the target along an ease-out curve, so it starts fast
 * and settles gently.
 *
 * The animation always starts from the number currently on screen, which is kept
 * in a ref. That makes it interruptible: logging three meals in quick succession
 * means each new animation picks up wherever the previous one had reached, and
 * the counter reads as one continuous climb. Starting from the previous target
 * instead would make the number visibly jump and restart each time.
 *
 * @param {number} target The value to settle on.
 * @param {number} [duration=520] Length of a full animation, in milliseconds.
 * @returns {number} The current in-between value. Round it before displaying.
 */
export function useCountUp(target, duration = 520) {
  const [value, setValue] = useState(target);
  const currentRef = useRef(target);

  useEffect(() => {
    const from = currentRef.current;
    const start = performance.now();
    let frame = 0;

    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      currentRef.current = from + (target - from) * eased;
      setValue(currentRef.current);
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}
