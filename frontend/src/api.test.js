import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, addMeal, deleteMeal, getMealsByDate, getMealsInRange, searchMeals, updateMeal } from "./api.js";

// Every call goes through one request() helper, so these cover the whole
// frontend-to-backend contract: what gets sent, and what a failure turns into.

function jsonResponse(body, status = 200) {
  return { ok: status < 400, status, json: async () => body };
}

function problemResponse(detail, status) {
  return { ok: false, status, json: async () => ({ title: "x", status, detail }) };
}

let fetchMock;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function lastCall() {
  const [url, options] = fetchMock.mock.calls.at(-1);
  return { url, options: options ?? {} };
}

describe("what goes out", () => {
  it("asks for one day by date", async () => {
    fetchMock.mockResolvedValue(jsonResponse([]));
    await getMealsByDate("2026-09-13");

    expect(lastCall().url).toBe("/api/meals/date/2026-09-13");
  });

  it("asks for a range with both ends", async () => {
    fetchMock.mockResolvedValue(jsonResponse([]));
    await getMealsInRange("2026-09-07", "2026-09-13");

    expect(lastCall().url).toBe("/api/meals?from=2026-09-07&to=2026-09-13");
  });

  it("sends a create body with no id in it", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 42 }, 201));
    await addMeal({ name: "Chicken", calories: 165, protein: 31, carbs: 0, fats: 3.6, date: "2026-09-13" });

    const { url, options } = lastCall();
    expect(url).toBe("/api/meals");
    expect(options.method).toBe("POST");
    expect(options.headers).toEqual({ "Content-Type": "application/json" });
    // An id in the body is what used to turn an insert into an overwrite.
    expect(JSON.parse(options.body)).not.toHaveProperty("id");
    expect(JSON.parse(options.body)).toMatchObject({ name: "Chicken", calories: 165 });
  });

  it("sends no macros on an update, because the server rescales the stored ones", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 9 }));
    await updateMeal(9, { name: "Steak", calories: 700, date: "2026-09-13" });

    const { url, options } = lastCall();
    expect(url).toBe("/api/meals/9");
    expect(options.method).toBe("PUT");
    expect(Object.keys(JSON.parse(options.body)).sort()).toEqual(["calories", "date", "name"]);
  });

  it("sends no body at all on a delete", async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 204, json: async () => null });
    await deleteMeal(9);

    const { url, options } = lastCall();
    expect(url).toBe("/api/meals/9");
    expect(options.method).toBe("DELETE");
    expect(options.body).toBeUndefined();
    expect(options.headers).toBeUndefined();
  });

  it("url-encodes a search query so spaces and symbols survive", async () => {
    fetchMock.mockResolvedValue(jsonResponse([]));
    await searchMeals("chipotle chicken & rice");

    expect(lastCall().url).toBe("/api/meals/search?query=chipotle%20chicken%20%26%20rice");
  });
});

describe("what comes back", () => {
  it("returns the parsed body", async () => {
    fetchMock.mockResolvedValue(jsonResponse([{ id: 1, name: "Chicken" }]));

    await expect(getMealsByDate("2026-09-13")).resolves.toEqual([{ id: 1, name: "Chicken" }]);
  });

  it("returns null for a 204 instead of trying to parse an empty body", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 204,
      json: async () => {
        throw new SyntaxError("Unexpected end of JSON input");
      },
    });

    await expect(deleteMeal(9)).resolves.toBeNull();
  });

  it("resolves a create to the saved meal, id included", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 42, name: "Chicken", calories: 165 }, 201));

    await expect(addMeal({ name: "Chicken", calories: 165, date: "2026-09-13" })).resolves.toMatchObject({ id: 42 });
  });
});

describe("what a failure turns into", () => {
  it("surfaces the server's own detail, not a generic message", async () => {
    fetchMock.mockResolvedValue(problemResponse("No meal with id 9.", 404));

    // This is what reaches the error toast, so it has to be the useful sentence.
    await expect(deleteMeal(9)).rejects.toThrow("No meal with id 9.");
  });

  it("carries the status code on the error", async () => {
    fetchMock.mockResolvedValue(problemResponse("Food search is unavailable right now.", 502));

    await expect(searchMeals("chicken")).rejects.toMatchObject({ status: 502 });
  });

  it("falls back to a generic message when the error body isn't json", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => {
        throw new SyntaxError("not json");
      },
    });

    await expect(getMealsByDate("2026-09-13")).rejects.toThrow("Request failed (500).");
  });

  it("turns an unreachable server into an ApiError, not a raw TypeError", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    const error = await getMealsByDate("2026-09-13").catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(0);
    expect(error.message).toBe("Can't reach the server.");
  });
});
