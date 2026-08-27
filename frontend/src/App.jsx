import { useCallback, useEffect, useRef, useState } from "react";
import { addMeal, deleteMeal, getMealsByDate, searchMeals, updateMeal } from "./api.js";
import { todayISO } from "./dates.js";
import Sidebar from "./components/Sidebar.jsx";
import TodayView from "./components/TodayView.jsx";
import HistoryView from "./components/HistoryView.jsx";
import SearchView from "./components/SearchView.jsx";
import SettingsView from "./components/SettingsView.jsx";
import QuickAddPalette from "./components/QuickAddPalette.jsx";
import ConfirmDialog from "./components/ConfirmDialog.jsx";
import UndoToast from "./components/UndoToast.jsx";

const UNDO_WINDOW_MS = 6000;

export default function App() {
  // Which pane of the shell is showing. A hand-rolled view state rather than a
  // router — there's one shell and four panes, nothing to route.
  const [view, setView] = useState("today");
  const [entryDate, setEntryDate] = useState(todayISO());
  const [meals, setMeals] = useState([]);

  const [weekStartsOn, setWeekStartsOn] = useState(0);
  const [confirmBeforeDelete, setConfirmBeforeDelete] = useState(false);

  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const undoTimer = useRef(null);

  useEffect(() => {
    getMealsByDate(entryDate).then(setMeals).catch(console.error);
  }, [entryDate]);

  useEffect(() => {
    function handleKeyDown(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsPaletteOpen(true);
      } else if (event.key === "Escape") {
        setIsPaletteOpen(false);
        setConfirmTarget(null);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => () => clearTimeout(undoTimer.current), []);

  async function refresh() {
    setMeals(await getMealsByDate(entryDate));
  }

  async function handleAdd(name, calories, date = entryDate) {
    try {
      await addMeal({ name, calories, date });
      await refresh();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleUpdate(id, updates) {
    try {
      await updateMeal(id, updates);
      await refresh();
    } catch (err) {
      console.error(err);
    }
  }

  // Deleting goes through here so the Settings preference decides whether it
  // asks first or just offers an undo afterwards.
  function requestDelete(meal) {
    if (confirmBeforeDelete) {
      setConfirmTarget(meal);
    } else {
      performDelete(meal);
    }
  }

  async function performDelete(meal) {
    setConfirmTarget(null);
    try {
      await deleteMeal(meal.id);
      await refresh();
      clearTimeout(undoTimer.current);
      setPendingDelete(meal);
      undoTimer.current = setTimeout(() => setPendingDelete(null), UNDO_WINDOW_MS);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleUndo() {
    const meal = pendingDelete;
    if (!meal) return;
    clearTimeout(undoTimer.current);
    setPendingDelete(null);
    // Re-posted, so it returns with a fresh id — the row is back, not the row.
    await handleAdd(meal.name, meal.calories, meal.date);
  }

  // Stable so the search hooks don't re-fire on every parent render.
  const handleSearch = useCallback(async (query) => {
    try {
      return await searchMeals(query);
    } catch (err) {
      console.error(err);
      return [];
    }
  }, []);

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "var(--color-bg)",
        color: "var(--color-text)",
        fontFamily: "var(--font-body)",
      }}
    >
      <Sidebar view={view} onNavigate={setView} onQuickAdd={() => setIsPaletteOpen(true)} />

      <main data-main style={{ flex: 1, minWidth: 0, padding: "var(--space-8) var(--space-8) 120px", maxWidth: 1180 }}>
        {view === "today" && (
          <TodayView
            entryDate={entryDate}
            onDateChange={setEntryDate}
            meals={meals}
            weekStartsOn={weekStartsOn}
            onAdd={handleAdd}
            onUpdate={handleUpdate}
            onDelete={requestDelete}
            onDuplicate={(meal) => handleAdd(meal.name, meal.calories, todayISO())}
            onSearch={handleSearch}
          />
        )}

        {view === "history" && (
          <HistoryView
            entryDate={entryDate}
            onOpenDay={(date) => {
              setEntryDate(date);
              setView("today");
            }}
          />
        )}

        {view === "search" && (
          <SearchView entryDate={entryDate} onSearch={handleSearch} onAdd={handleAdd} />
        )}

        {view === "settings" && (
          <SettingsView
            weekStartsOn={weekStartsOn}
            onWeekStartsOnChange={setWeekStartsOn}
            confirmBeforeDelete={confirmBeforeDelete}
            onConfirmBeforeDeleteChange={setConfirmBeforeDelete}
          />
        )}
      </main>

      {pendingDelete && <UndoToast meal={pendingDelete} onUndo={handleUndo} />}

      {isPaletteOpen && (
        <QuickAddPalette
          entryDate={entryDate}
          onSearch={handleSearch}
          onAdd={handleAdd}
          onClose={() => setIsPaletteOpen(false)}
        />
      )}

      {confirmTarget && (
        <ConfirmDialog
          meal={confirmTarget}
          onConfirm={() => performDelete(confirmTarget)}
          onCancel={() => setConfirmTarget(null)}
        />
      )}
    </div>
  );
}
