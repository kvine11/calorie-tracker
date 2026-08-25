const BASE_URL = "http://localhost:8080/api/meals";


export async function getMealsByDate(date) {
  const res = await fetch(`${BASE_URL}/date/${date}`);
  if (!res.ok) throw new Error("Failed to load meals for the specified date");
  return res.json();
}


export async function addMeal({ name, calories, date }) {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, calories, date }),
  });
  if (!res.ok) throw new Error("Failed to add meal");
}

export async function deleteMeal(id) {
  const res = await fetch(`${BASE_URL}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete meal");
}

export async function updateMeal(id, { name, calories, date }) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, calories, date }),
  });
  if (!res.ok) throw new Error("Failed to update meal");
}

