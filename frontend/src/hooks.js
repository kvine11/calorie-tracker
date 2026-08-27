import { useEffect, useRef, useState } from "react";

// Delay a fast-changing value (a keystroke stream) so effects downstream of it
// only run once the user pauses.
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// Food-name autocomplete against GET /api/meals/search. Returns whatever the
// endpoint gives back — a miss is an empty list, never an error, so the
// "type anything, get no matches, enter it by hand" path stays open.
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

// `handler` is re-read on every render, so the listener never closes over a
// stale copy of the state it checks.
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

// Eases toward `target` on every change — used for the calorie readout so the
// number rolls rather than snapping. Interruptible: a change mid-flight
// continues from wherever the previous animation had reached.
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
