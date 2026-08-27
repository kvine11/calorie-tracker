import { iso, shiftISO, weekOf } from "../dates.js";

const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];

// One week of day pills. Two instances exist at once when a meal is expanded:
// the page-level strip that drives which day is loaded, and the one inside a
// meal's detail view that moves that single meal to another day.
export default function DateSelection({
  entryDate,
  onDateChange,
  weekStartsOn = 0,
  showWeekNav = false,
  compact = false,
}) {
  const days = weekOf(entryDate, weekStartsOn);

  const pillLayout = compact
    ? { width: 46, flex: "none", padding: "7px 0" }
    : { flex: 1, minWidth: 44, maxWidth: 68, padding: "9px 0" };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-2)",
        flex: compact ? "none" : 1,
        minWidth: compact ? 0 : 340,
      }}
    >
      {showWeekNav && (
        <button
          type="button"
          onClick={() => onDateChange(shiftISO(entryDate, -7))}
          className="btn btn-icon btn-secondary"
          aria-label="Previous week"
          style={{ flex: "none" }}
        >
          ‹
        </button>
      )}

      <div
        data-daystrip
        style={{
          display: "flex",
          gap: compact ? 4 : 6,
          flex: 1,
          flexWrap: compact ? "wrap" : "nowrap",
          justifyContent: compact ? "flex-start" : "space-between",
        }}
      >
        {days.map((date) => {
          const dateString = iso(date);
          const isSelected = dateString === entryDate;
          return (
            <button
              type="button"
              key={dateString}
              onClick={() => onDateChange(dateString)}
              aria-label={date.toDateString()}
              aria-current={isSelected ? "date" : undefined}
              style={{
                ...pillLayout,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 1,
                border: `1px solid ${isSelected ? "var(--color-accent)" : "var(--color-divider)"}`,
                borderRadius: 999,
                cursor: "pointer",
                background: isSelected ? "var(--color-accent)" : "transparent",
                color: isSelected ? "var(--color-bg)" : "var(--color-text)",
                fontFamily: "var(--font-body)",
                transition: "background 160ms ease, border-color 160ms ease",
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  opacity: 0.7,
                }}
              >
                {dayLabels[date.getDay()]}
              </span>
              <span
                style={{
                  fontSize: compact ? 13 : 14,
                  fontWeight: 600,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {date.getDate()}
              </span>
            </button>
          );
        })}
      </div>

      {showWeekNav && (
        <button
          type="button"
          onClick={() => onDateChange(shiftISO(entryDate, 7))}
          className="btn btn-icon btn-secondary"
          aria-label="Next week"
          style={{ flex: "none" }}
        >
          ›
        </button>
      )}
    </div>
  );
}
