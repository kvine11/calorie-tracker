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

// Food-name autocomplete against GET /api/meals/search. A miss is an empty list,
// never an error, so "type anything, get no matches, enter it by hand" stays
// open. `unavailable` means the search itself failed (FatSecret down, server
// unreachable) — a different message from "no matches".
export function useFoodSearch(query, { enabled = true, onSearch, limit = 6 }) {
  const debouncedQuery = useDebounce(query, 300);
  const [suggestions, setSuggestions] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    if (!enabled || debouncedQuery.trim().length < 2) {
      setSuggestions([]);
      setIsFetching(false);
      setUnavailable(false);
      return;
    }

    // A slow response for an older query must not overwrite a newer one.
    let cancelled = false;
    setIsFetching(true);
    onSearch(debouncedQuery.trim())
      .then((results) => {
        if (cancelled) return;
        setSuggestions(results.slice(0, limit));
        setUnavailable(false);
      })
      .catch(() => {
        if (cancelled) return;
        setSuggestions([]);
        setUnavailable(true);
      })
      .finally(() => {
        if (!cancelled) setIsFetching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, enabled, onSearch, limit]);

  // Keystrokes that haven't been sent yet count as searching too, so callers
  // don't flash "no matches" between the last keypress and the request.
  return {
    suggestions,
    unavailable,
    isSearching: enabled && (isFetching || debouncedQuery !== query),
  };
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

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

// Eases toward `target` on every change, so a number rolls rather than snapping.
// Interruptible: a change mid-flight continues from wherever it had reached.
// `from` is where the very first roll starts — 0 makes a freshly mounted number
// count up. Reduced motion snaps straight to the value (DESIGN.md → Motion).
export function useCountUp(target, { duration = 450, from = target } = {}) {
  const [value, setValue] = useState(from);
  const currentRef = useRef(from);

  useEffect(() => {
    if (prefersReducedMotion()) {
      currentRef.current = target;
      setValue(target);
      return undefined;
    }

    const origin = currentRef.current;
    const start = performance.now();
    let frame = 0;

    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 4); // ease-out-quart
      currentRef.current = origin + (target - origin) * eased;
      setValue(currentRef.current);
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}

// False for the first painted frame, true from the next. A CSS transition needs
// the browser to have painted the start value, so this is how an element
// animates in from empty on mount — a ring arc from length 0, a bar from width 0.
export function useAfterFirstPaint() {
  const [painted, setPainted] = useState(false);

  useEffect(() => {
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setPainted(true));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, []);

  return painted;
}
