import { motion } from "framer-motion";
import { iso, shiftISO, todayISO, weekOf } from "../dates.js";
import { LAYOUT_SPRING } from "../motion.js";
import { ChevronLeftIcon, ChevronRightIcon } from "./Icons.jsx";

const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];

// One week of day pills. Two can be on screen at once — the page-level strip
// that decides which day is loaded, and the one inside an open meal that moves
// that meal to another day — so each needs its own `layoutId`, or the selected
// highlight would try to fly from one strip to the other.
export default function DateSelection({
  entryDate,
  onDateChange,
  weekStartsOn = 0,
  showWeekNav = false,
  compact = false,
  layoutId = "day-highlight",
}) {
  const days = weekOf(entryDate, weekStartsOn);
  const today = todayISO();
  const navClassName = `btn btn-icon btn-quiet${compact ? " btn-sm" : ""}`;
  const iconSize = compact ? 14 : 16;

  return (
    <div className="daystrip" data-compact={compact}>
      {showWeekNav && (
        <button
          type="button"
          className={navClassName}
          aria-label="Previous week"
          onClick={() => onDateChange(shiftISO(entryDate, -7))}
        >
          <ChevronLeftIcon size={iconSize} />
        </button>
      )}

      <div className="daystrip-days">
        {days.map((date) => {
          const dateString = iso(date);
          const isSelected = dateString === entryDate;
          return (
            <button
              type="button"
              key={dateString}
              className="day"
              data-selected={isSelected}
              data-today={dateString === today}
              aria-label={date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              aria-pressed={isSelected}
              onClick={() => onDateChange(dateString)}
            >
              {isSelected && <motion.span layoutId={layoutId} className="day-highlight" transition={LAYOUT_SPRING} />}
              <span className="day-letter">{dayLabels[date.getDay()]}</span>
              <span className="day-num">{date.getDate()}</span>
            </button>
          );
        })}
      </div>

      {showWeekNav && (
        <button
          type="button"
          className={navClassName}
          aria-label="Next week"
          onClick={() => onDateChange(shiftISO(entryDate, 7))}
        >
          <ChevronRightIcon size={iconSize} />
        </button>
      )}
    </div>
  );
}
