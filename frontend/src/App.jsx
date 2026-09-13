import { useEffect, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { addMeal, deleteMeal, getMealsByDate, searchMeals, updateMeal } from "./api.js";
import { todayISO } from "./dates.js";
import { EASE_OUT } from "./motion.js";
import TopBar from "./components/TopBar.jsx";
import TodayView from "./components/TodayView.jsx";
import HistoryView from "./components/HistoryView.jsx";
import QuickAddPalette from "./components/QuickAddPalette.jsx";
import Toast from "./components/Toast.jsx";

const UNDO_WINDOW_MS = 6000;
const ERROR_WINDOW_MS = 5000;

export default function App() {
  // Which pane is showing. Hand-rolled view state rather than a router — one
  // shell, two panes, nothing to route.
  const [view, setView] = useState("today");
  const [entryDate, setEntryDate] = useState(todayISO());

  const [meals, setMeals] = useState([]);
  // The day `meals` actually belongs to. It trails `entryDate` by one request;
  // the ring and list key off it, so they redraw when the new day's data lands
  // rather than a frame early with the previous day's meals.
  const [mealsDate, setMealsDate] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  // Bumped after every successful write, so History refetches if it's showing.
  const [revision, setRevision] = useState(0);

  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  // One toast at a time: { kind: "undo", meal } or { kind: "error", message }.
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  useEffect(() => {
    // A slow response for a day you've already left must not overwrite the day
    // you're on now.
    let cancelled = false;
    getMealsByDate(entryDate)
      .then((data) => {
        if (cancelled) return;
        setMeals(data);
        setMealsDate(entryDate);
        setLoadError(null);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [entryDate, loadAttempt]);

  useEffect(() => {
    function handleKeyDown(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsPaletteOpen(true);
      } else if (event.key === "Escape") {
        setIsPaletteOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  function showToast(next, duration) {
    clearTimeout(toastTimer.current);
    setToast({ ...next, id: Date.now(), duration });
    toastTimer.current = setTimeout(() => setToast(null), duration);
  }

  function dismissToast() {
    clearTimeout(toastTimer.current);
    setToast(null);
  }

  async function refresh() {
    const data = await getMealsByDate(entryDate);
    setMeals(data);
    setMealsDate(entryDate);
    setLoadError(null);
  }

  // Every write goes through here: run it, reload the day, and turn a failure
  // into a toast rather than a console line. Resolves to whether the write
  // worked, so the form only clears itself on success.
  async function mutate(write, whatFailed) {
    try {
      await write();
    } catch (err) {
      showToast({ kind: "error", message: `Couldn't ${whatFailed}. ${err.message}` }, ERROR_WINDOW_MS);
      return false;
    }

    setRevision((r) => r + 1);
    try {
      await refresh();
    } catch (err) {
      setLoadError(err.message);
    }
    return true;
  }

  // `meal` is { name, calories, protein, carbs, fats } and optionally `date`;
  // without one it lands on the day being viewed.
  function handleAdd(meal) {
    return mutate(() => addMeal({ date: entryDate, ...meal }), "add the meal");
  }

  function handleUpdate(id, updates) {
    return mutate(() => updateMeal(id, updates), "update the meal");
  }

  async function handleDelete(meal) {
    if (await mutate(() => deleteMeal(meal.id), "delete the meal")) {
      showToast({ kind: "undo", meal }, UNDO_WINDOW_MS);
    }
  }

  async function handleUndo() {
    if (toast?.kind !== "undo") return;
    const { meal } = toast;
    dismissToast();
    // Re-posted, so it comes back with a new id — the row is restored, not the
    // row's history.
    await mutate(() => addMeal(meal), "restore the meal");
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="app">
        <TopBar view={view} onNavigate={setView} onQuickAdd={() => setIsPaletteOpen(true)} />

        <main className="app-main">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: EASE_OUT }}
            >
              {view === "today" ? (
                <TodayView
                  entryDate={entryDate}
                  mealsDate={mealsDate}
                  meals={meals}
                  loadError={loadError}
                  onRetry={() => setLoadAttempt((n) => n + 1)}
                  onDateChange={setEntryDate}
                  onAdd={handleAdd}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                  onDuplicate={(meal) =>
                    handleAdd({
                      name: meal.name,
                      calories: meal.calories,
                      protein: meal.protein,
                      carbs: meal.carbs,
                      fats: meal.fats,
                      date: todayISO(),
                    })
                  }
                  onSearch={searchMeals}
                />
              ) : (
                <HistoryView
                  entryDate={entryDate}
                  revision={revision}
                  onOpenDay={(date) => {
                    setEntryDate(date);
                    setView("today");
                  }}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        <AnimatePresence mode="wait">
          {toast && <Toast key={toast.id} toast={toast} onUndo={handleUndo} onDismiss={dismissToast} />}
        </AnimatePresence>

        <AnimatePresence>
          {isPaletteOpen && (
            <QuickAddPalette
              entryDate={entryDate}
              onSearch={searchMeals}
              onAdd={handleAdd}
              onClose={() => setIsPaletteOpen(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
