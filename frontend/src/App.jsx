import { useEffect, useState } from "react";
import { getMeals, addMeal, deleteMeal, getMealsByDate } from "./api.js";
import Header from "./components/Header.jsx";
import CalorieSummary from "./components/CalorieSummary.jsx";
import MealForm from "./components/MealForm.jsx";
import MealList from "./components/MealList.jsx";

export default function App() {
  const [meals, setMeals] = useState([]);

  const [entryDate, setEntryDate] = useState(new Date().getFullYear() + "-" + String(new Date().getMonth() + 1).padStart(2, "0") + "-" + String(new Date().getDate()).padStart(2, "0"));

  useEffect(() => {
    getMealsByDate(entryDate).then(setMeals).catch(console.error);
  }, [entryDate]);

  const total = meals.reduce((sum, meal) => sum + meal.calories, 0);

  async function handleAdd(name, calories) {
    try {
      await addMeal({ name, calories, date: entryDate });
      setMeals(await getMealsByDate(entryDate));
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteMeal(id);
      setMeals(await getMealsByDate(entryDate));
    } catch (err) {
      console.error(err);
    }
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
