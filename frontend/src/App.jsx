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

/** How long the undo toast stays on screen after a delete, in milliseconds. */
const UNDO_WINDOW_MS = 6000;

/**
 * The top-level component. It owns all shared state and decides which screen is
 * currently showing.
 *
 *
 * WHAT THE REVAMP CHANGED
 *
 * Earlier versions rendered a single page: a header, a calorie total, a form and
 * a list. This version wraps that same functionality in a four-screen app shell.
 *
 * Worth pointing out: no backend code changed, and api.js did not change either.
 * Every new screen is built out of endpoints that already existed.
 *
 *
 * THE SCREENS
 *
 * A sidebar on the left is always visible. One screen shows on the right:
 *
 *   view       component      what it shows
 *   --------   ------------   --------------------------------------------
 *   today      TodayView      day picker, calorie ring, add form, meal list
 *   history    HistoryView    the last 7 days as a bar chart
 *   search     SearchView     a full-page food search
 *   settings   SettingsView   user preferences
 *
 * On top of those, three overlays can appear above any screen: the quick-add
 * palette (Cmd/Ctrl-K), the delete confirmation dialog, and the undo toast.
 *
 * Navigation is a plain string held in state, not a routing library. With one
 * shell and four screens there are no URLs worth managing, so react-router would
 * be weight without benefit. The tradeoff is real and worth stating: there is no
 * browser back button support and no linking directly to a screen. If either
 * becomes a requirement, this is the piece to replace.
 *
 * Because each screen is conditionally rendered, navigating away unmounts it and
 * coming back mounts a fresh copy. That is what makes the History screen reload
 * its data on every visit without any extra code.
 *
 *
 * THE STATE, AND WHY IT LIVES HERE
 *
 * React state only flows downward, so any value that two components both need
 * has to live in their closest shared parent. For this app that is almost always
 * here. This component holds:
 *
 *   entryDate    the selected day, as a "yyyy-MM-dd" string. Every screen reads
 *                it and can change it.
 *   meals        the meals for that day. No child component fetches meals; they
 *                all receive them as props.
 *   weekStartsOn, confirmBeforeDelete
 *                the Settings preferences. They are changed on the Settings
 *                screen but used elsewhere, which is exactly why they cannot
 *                live on the Settings screen.
 *   isPaletteOpen, confirmTarget, pendingDelete
 *                which overlays are currently showing.
 *
 *
 * HOW DATA FLOWS
 *
 * Every write follows the same three steps: call the API, refetch the day, then
 * re-render. Nothing edits the local `meals` array directly.
 *
 * This is slightly less efficient than updating the array by hand, and it is a
 * deliberate trade. The screen can never disagree with the database, and one
 * feature falls out of it for free: moving a meal to a different date needs no
 * special handling at all. After the refetch, its date no longer matches the
 * selected day, so it is simply not in the list that comes back.
 */
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

  // Global keyboard shortcuts. Cmd/Ctrl-K opens quick add from anywhere, and
  // Escape closes whichever overlay is open. These are attached to the window
  // once, so no individual screen needs to know the shortcuts exist.
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

  // Cancels the undo countdown if the app unmounts while it is still running.
  // Without this, the timer would eventually try to update state on a component
  // that no longer exists.
  useEffect(() => () => clearTimeout(undoTimer.current), []);

    /**
   * Reloads the selected day's meals from the server.
   *
   * This is the only place `meals` is set after the first load. Every add, edit
   * and delete below finishes by calling this rather than updating the array by
   * hand, so what is on screen always matches what is actually in Postgres.
   */
  async function refresh() {
    setMeals(await getMealsByDate(entryDate));
  }

    /**
   * Saves a new meal, then reloads the day.
   *
   * The date defaults to whichever day is currently selected. This is a design
   * decision worth explaining: there is no date field anywhere in the add form.
   * A meal is always stamped with the day you are looking at, so logging
   * yesterday's dinner means switching to yesterday first. That removes a field
   * from the form, and removes a whole category of mistake where the form and
   * the visible day disagree.
   *
   * The two callers that pass a date explicitly are the ones that genuinely mean
   * a different day: "Duplicate to today", and undo, which restores a meal to
   * the day it was deleted from.
   *
   * @param {string} name
   * @param {number} calories
   * @param {string} [date=entryDate] A date in "yyyy-MM-dd" form.
   */
  async function handleAdd(name, calories, date = entryDate) {
    try {
      await addMeal({ name, calories, date });
      await refresh();
    } catch (err) {
      console.error(err);
    }
  }

    /**
   * Saves changes to an existing meal, then reloads the day.
   *
   * `updates` stays a single object the whole way down the chain: FoodItem
   * builds it, MealList attaches the id, and api.js sends it. Keeping one shape
   * end to end matters, because this broke once when a layer in the middle split
   * the object back into separate arguments and the layers stopped agreeing on
   * what they were passing each other.
   *
   * @param {number} id Which meal to update. Taken from the URL path, not the body.
   * @param {{name: string, calories: number, date: string}} updates
   */
  async function handleUpdate(id, updates) {
    try {
      await updateMeal(id, updates);
      await refresh();
    } catch (err) {
      console.error(err);
    }
  }

    /**
   * The single entry point for deleting a meal. Every delete button in the app
   * calls this rather than hitting the API directly.
   *
   * It checks the Settings preference and picks one of two safety nets: ask
   * first with a confirmation dialog, or delete immediately and offer an undo
   * afterward. The app intentionally offers one or the other, never both.
   * Confirming and then also offering undo would be asking the same question
   * twice.
   *
   * @param {{id: number, name: string, calories: number, date: string}} meal
   */
  function requestDelete(meal) {
    if (confirmBeforeDelete) {
      setConfirmTarget(meal);
    } else {
      performDelete(meal);
    }
  }

    /**
   * Actually deletes the meal, then starts the undo countdown.
   *
   * Note that the whole meal object is stored in `pendingDelete`, not just its
   * id. The row is gone from the database the moment this finishes, so this
   * piece of state is the only remaining record of what was deleted. If the user
   * clicks undo, this is where the data to restore comes from.
   *
   * @param {{id: number, name: string, calories: number, date: string}} meal
   */
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

    /**
   * Restores the meal that was just deleted.
   *
   * Worth being precise about: this is not a rollback. The DELETE already
   * committed, so this re-adds the meal as a brand new row and it comes back
   * with a different id. The user cannot tell the difference, and the benefit is
   * that undo is just an ordinary add. Nothing has to be held in a pending state
   * or reversed on the server.
   */
  async function handleUndo() {
    const meal = pendingDelete;
    if (!meal) return;
    clearTimeout(undoTimer.current);
    setPendingDelete(null);
    // Re-posted, so it returns with a fresh id — the row is back, not the row.
    await handleAdd(meal.name, meal.calories, meal.date);
  }

    /**
   * The food search function handed to every part of the UI that searches.
   *
   * Wrapped in useCallback so React reuses the same function object between
   * renders. This is not an optimization: useFoodSearch lists this function as a
   * useEffect dependency, so creating a new one each render would look like a
   * changed dependency, re-run the search, cause a re-render, and loop.
   *
   * Errors are caught and turned into an empty list, so a failed request and a
   * genuine no-results search behave identically. In both cases the user can
   * still type the meal in manually, which is the outcome that actually matters.
   *
   * @param {string} query
   * @returns {Promise<Array<{foodName: string, calories: number}>>}
   */
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
