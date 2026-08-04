import { useEffect, useState } from "react";
import { getMeals, addMeal, deleteMeal } from "./api.js";
import Header from "./components/Header.jsx";
import CalorieSummary from "./components/CalorieSummary.jsx";
import MealForm from "./components/MealForm.jsx";
import MealList from "./components/MealList.jsx";

export default function App() {
  const [meals, setMeals] = useState([]);

  useEffect(() => {
    getMeals().then(setMeals);
  }, []);

  const total = meals.reduce((sum, meal) => sum + meal.calories, 0);

  async function handleAdd(name, calories) {
    await addMeal({ name, calories });
    setMeals(await getMeals());
  }

  async function handleDelete(id) {
    await deleteMeal(id);
    setMeals(await getMeals());
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col gap-6 px-4 py-10">
      <Header />
      <CalorieSummary total={total} />
      <MealForm onAdd={handleAdd} />
      <MealList meals={meals} onDelete={handleDelete} />
    </div>
  );
}
