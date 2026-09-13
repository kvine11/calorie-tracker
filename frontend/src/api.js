// In development Vite proxies /api to Spring Boot (see vite.config.js), so the
// base is empty and every request is same-origin. A deployed frontend sets
// VITE_API_BASE_URL to wherever the API is hosted.
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";
const MEALS = `${API_BASE}/api/meals`;

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

// Every call goes through here. Errors from the API arrive as problem+json, so
// a failure throws with the server's own `detail` — "No meal with id 9." rather
// than a generic "request failed".
async function request(url, { body, ...options } = {}) {
  let res;
  try {
    res = await fetch(url, {
      ...options,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Can't reach the server.", 0);
  }

  if (!res.ok) {
    let detail;
    try {
      detail = (await res.json()).detail;
    } catch {
      // Not JSON — fall through to the generic message.
    }
    throw new ApiError(detail ?? `Request failed (${res.status}).`, res.status);
  }

  return res.status === 204 ? null : res.json();
}

export function getMealsByDate(date) {
  return request(`${MEALS}/date/${date}`);
}

// Both ends inclusive.
export function getMealsInRange(from, to) {
  return request(`${MEALS}?from=${from}&to=${to}`);
}

// Resolves to the saved meal, including the id the database assigned.
export function addMeal({ name, calories, protein, carbs, fats, date }) {
  return request(MEALS, { method: "POST", body: { name, calories, protein, carbs, fats, date } });
}

// Macros aren't sent: the server rescales the stored ones to the new calories.
export function updateMeal(id, { name, calories, date }) {
  return request(`${MEALS}/${id}`, { method: "PUT", body: { name, calories, date } });
}

export function deleteMeal(id) {
  return request(`${MEALS}/${id}`, { method: "DELETE" });
}

export function searchMeals(query) {
  return request(`${MEALS}/search?query=${encodeURIComponent(query)}`);
}
