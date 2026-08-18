import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {addMeal, deleteMeal, getMealsByDate, updateMeal } from "./api.js";
import Header from "./components/Header.jsx";
import CalorieSummary from "./components/CalorieSummary.jsx";
import MealForm from "./components/MealForm.jsx";
import MealList from "./components/MealList.jsx";
import DateSelection from "./components/DateSelection.jsx";

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const rise = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

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

  async function handleUpdate(id, updates) {
    try {
      await updateMeal(id, {name: updates.name, calories: updates.calories, date: updates.date});
      setMeals(await getMealsByDate(entryDate));
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="min-h-screen px-4 py-10 sm:py-16">
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="mx-auto flex max-w-md flex-col gap-7 border border-border bg-card px-5 py-6 shadow-[0_1px_0_theme(colors.border)] sm:px-7 sm:py-8"
      >
        <motion.div variants={rise}>
          <Header />
        </motion.div>
        <motion.div variants={rise}>
          <DateSelection entryDate={entryDate} onDateChange={setEntryDate} />
        </motion.div>
        <motion.div variants={rise}>
          <CalorieSummary total={total} />
        </motion.div>
        <motion.div variants={rise}>
          <MealForm onAdd={handleAdd} />
        </motion.div>
        <motion.div variants={rise}>
          <MealList meals={meals} onDelete={handleDelete} onUpdate={handleUpdate} />
        </motion.div>
      </motion.div>
    </div>
  );
}
