const BASE_URL = "http://localhost:8080/api/meals";

export async function getMeals() {
  const res = await fetch(BASE_URL);
  if (!res.ok) throw new Error("Failed to load meals");
  return res.json();
}

export async function addMeal({ name, calories }) {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, calories }),
  });
  if (!res.ok) throw new Error("Failed to add meal");
}

export async function deleteMeal(id) {
  const res = await fetch(`${BASE_URL}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete meal");
}

// Not wired into the UI yet — backend PUT is ready, edit UI is a later session.
export async function updateMeal(id, { name, calories }) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, calories }),
  });
  if (!res.ok) throw new Error("Failed to update meal");
}
