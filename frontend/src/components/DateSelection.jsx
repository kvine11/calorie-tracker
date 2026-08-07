import { useState } from "react";
import { motion } from "framer-motion";

const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];

// TODO: decide the prop contract with App.jsx — e.g. selectedDate (string or Date?)
// and an onDateChange callback so a click here can update App's entryDate state.
function DateSelection({ entryDate, onDateChange }) {
  // TODO: local state for whichever date anchors the visible week.
  const year = entryDate.split("-")[0];
  const month = entryDate.split("-")[1];
  const day = entryDate.split("-")[2];
  const [anchorDate, setAnchorDate] = useState(new Date(year, month - 1, day));

  // TODO: given an anchor date, return the 7 dates (Sun-Sat) of its week.
  function getWeekDates() {
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(anchorDate);
      const firstDayOfWeek = date.getDate() - date.getDay(); // Get the first day of the week (Sunday)
      date.setDate(firstDayOfWeek + i);
      weekDates.push(date);
    }

    return weekDates;
  }

  // TODO: move the visible week back by 7 days.
  const handlePreviousWeek = () => {
    const previousWeekDate = new Date(anchorDate);
    previousWeekDate.setDate(previousWeekDate.getDate() - 7);
    setAnchorDate(previousWeekDate);
    handleDateClick(previousWeekDate);
  };

  // TODO: move the visible week forward by 7 days.
  const handleNextWeek = () => {
    const nextWeekDate = new Date(anchorDate);
    nextWeekDate.setDate(nextWeekDate.getDate() + 7);
    setAnchorDate(nextWeekDate);
    handleDateClick(nextWeekDate);
  };

  // TODO: handle a click on a specific day — update local + (eventually) App state.
  const handleDateClick = (date) => {
    setAnchorDate(date);
    const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    onDateChange(formattedDate);
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={handlePreviousWeek}
        aria-label="Previous week"
        className="rounded-full p-2 text-ink-mute transition hover:bg-border/60 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
      >
        
      </button>

      <div className="flex flex-1 justify-between">
        {getWeekDates().map((date) => {
          const isSelected = date.toDateString() === anchorDate.toDateString();
          return (
            <button
              key={date.toISOString()}
              onClick={() => handleDateClick(date)}
              aria-label={date.toDateString()}
              aria-current={isSelected ? "date" : undefined}
              className="relative flex h-14 w-11 flex-col items-center justify-center gap-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              {isSelected && (
                <motion.div
                  layoutId="day-highlight"
                  transition={{ type: "spring", stiffness: 500, damping: 34 }}
                  className="absolute inset-0 rounded-full bg-ink"
                />
              )}
              <span
                className={`relative z-10 text-[10px] font-bold uppercase tracking-wide ${
                  isSelected ? "text-bg" : "text-ink-mute"
                }`}
              >
                {dayLabels[date.getDay()]}
              </span>
              <span
                className={`relative z-10 text-xs font-bold tabular-nums ${
                  isSelected ? "text-bg" : "text-ink"
                }`}
              >
                {date.getMonth() + 1}/{date.getDate()}
              </span>
            </button>
          );
        })}
      </div>

      <button
        onClick={handleNextWeek}
        aria-label="Next week"
        className="rounded-full p-2 text-ink-mute transition hover:bg-border/60 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
      >
        ›
      </button>
    </div>
  );
}

export default DateSelection;
