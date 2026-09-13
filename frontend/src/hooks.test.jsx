import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDebounce, useFoodSearch } from "./hooks.js";

// The search hook is the most timing-dependent code in the app: a debounce, a
// minimum length, an out-of-order-response guard, and two different empty
// states. All four have been wrong at some point.

describe("useDebounce", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("holds the value until the typing stops", () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: "c" },
    });

    rerender({ value: "ch" });
    rerender({ value: "chi" });
    act(() => vi.advanceTimersByTime(299));
    expect(result.current).toBe("c");

    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe("chi");
  });

  it("restarts the wait on every keystroke rather than firing mid-word", () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: "a" },
    });

    act(() => vi.advanceTimersByTime(250));
    rerender({ value: "ab" });
    act(() => vi.advanceTimersByTime(250));

    expect(result.current).toBe("a");
  });
});

describe("useFoodSearch", () => {
  let onSearch;

  beforeEach(() => {
    vi.useFakeTimers();
    onSearch = vi.fn().mockResolvedValue([]);
  });

  afterEach(() => vi.useRealTimers());

  // Mounts empty and types the query in, which is what the real field does.
  // Mounting with text already present would fire a search on the first render,
  // because useDebounce seeds its state with the value it is handed.
  function search(query, options = {}) {
    const view = renderHook(({ q }) => useFoodSearch(q, { onSearch, ...options }), {
      initialProps: { q: "" },
    });
    view.rerender({ q: query });
    return view;
  }

  // Push past the debounce, then let the promise chain in the effect finish.
  async function settle() {
    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });
  }

  it("does not call the API for one character", async () => {
    search("c");
    await settle();

    expect(onSearch).not.toHaveBeenCalled();
  });

  it("does not call the API for whitespace that only looks long enough", async () => {
    search("   ");
    await settle();

    expect(onSearch).not.toHaveBeenCalled();
  });

  it("calls the API once for a whole typed word, not once per keystroke", async () => {
    const { rerender } = search("ch");
    rerender({ q: "chi" });
    rerender({ q: "chic" });
    rerender({ q: "chicken" });
    await settle();

    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith("chicken");
  });

  it("trims the query before sending it", async () => {
    search("  chicken  ");
    await settle();

    expect(onSearch).toHaveBeenCalledWith("chicken");
  });

  it("never asks when disabled, which is how the form stops after a pick", async () => {
    search("chicken", { enabled: false });
    await settle();

    expect(onSearch).not.toHaveBeenCalled();
  });

  it("caps results at the limit its component asked for", async () => {
    const six = Array.from({ length: 6 }, (_, i) => ({ foodName: `food ${i}`, calories: 100 }));
    onSearch.mockResolvedValue(six);

    const { result } = search("chicken", { limit: 2 });
    await settle();

    expect(result.current.suggestions).toHaveLength(2);
  });

  it("reports searching while the keystrokes are still settling", async () => {
    const { result } = search("chicken");

    // Before the debounce elapses there is no request yet, but the dropdown
    // must not flash "no matches" in the gap.
    expect(result.current.isSearching).toBe(true);
  });

  it("treats an empty result as no matches, not as a failure", async () => {
    onSearch.mockResolvedValue([]);

    const { result } = search("asdfgh");
    await settle();

    expect(result.current.suggestions).toEqual([]);
    expect(result.current.unavailable).toBe(false);
  });

  it("marks the search unavailable when the request throws", async () => {
    onSearch.mockRejectedValue(new Error("502"));

    const { result } = search("chicken");
    await settle();

    // A different state from "no matches": the UI says so rather than implying
    // FatSecret has never heard of chicken.
    expect(result.current.unavailable).toBe(true);
    expect(result.current.suggestions).toEqual([]);
    expect(result.current.isSearching).toBe(false);
  });

  it("clears an earlier failure once a search succeeds again", async () => {
    onSearch.mockRejectedValueOnce(new Error("502"));

    const { result, rerender } = search("chicken");
    await settle();
    expect(result.current.unavailable).toBe(true);
    onSearch.mockResolvedValue([{ foodName: "Chicken Breast", calories: 165 }]);
    rerender({ q: "chicken breast" });
    await settle();

    expect(result.current.unavailable).toBe(false);
    expect(result.current.suggestions).toHaveLength(1);
  });

  it("ignores a slow reply for a query the user has already moved past", async () => {
    let resolveStale;
    onSearch
      .mockImplementationOnce(() => new Promise((resolve) => (resolveStale = resolve)))
      .mockResolvedValueOnce([{ foodName: "chicken breast", calories: 165 }]);

    const { result, rerender } = search("chi");
    await settle();

    rerender({ q: "chicken breast" });
    await settle();
    expect(result.current.suggestions).toHaveLength(1);
    // The first request finally answers, long after its query stopped mattering.
    await act(async () => {
      resolveStale([{ foodName: "chives", calories: 1 }]);
      await Promise.resolve();
    });

    expect(result.current.suggestions).toEqual([{ foodName: "chicken breast", calories: 165 }]);
  });
});
