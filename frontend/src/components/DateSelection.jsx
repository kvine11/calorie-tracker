import { useState } from "react";

// TODO: decide the prop contract with App.jsx — e.g. selectedDate (string or Date?)
// and an onDateChange callback so a click here can update App's entryDate state.
function DateSelection({ entryDate , onDateChange }) {
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
    onDateChange(date.toISOString().split("T")[0]);
  };

  return (
    <div className="flex items-center justify-between">
      <button
        onClick={handlePreviousWeek}
        className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        Previous Week
      </button>

      <div className="flex gap-2">
        {
          /* TODO: map over the week's dates and render each day (label + number),
            with a click handler and a visual style for the selected day. */
          getWeekDates().map((date) => (
            <button
              key={date.toISOString()}
              onClick={() => handleDateClick(date)}
              className={`rounded-full px-3 py-2 text-sm font-semibold transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                date.toDateString() === anchorDate.toDateString()
                  ? "bg-accent text-white"
                  : "bg-card text-ink hover:bg-gray-100"
              }`}
            >
              {date.getMonth() + 1}/{date.getDate()}
            </button>
          ))
        }
      </div>

      <button
        onClick={handleNextWeek}
        className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        Next Week
      </button>
    </div>
  );
}

export default DateSelection;
