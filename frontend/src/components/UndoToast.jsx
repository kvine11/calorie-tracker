/**
 * The "Deleted X — Undo" toast, shown for six seconds after a delete when the
 * confirmation dialog is turned off.
 *
 * Undo re-adds the meal rather than restoring the deleted row. By the time this
 * appears, the DELETE has already reached Postgres, so what comes back is an
 * identical meal with a new id. The user cannot tell the difference, and it
 * keeps the code simple: undo is just an ordinary add, with nothing held back on
 * the server and nothing to reverse.
 *
 * That is also why the whole meal object lives in App's `pendingDelete` state
 * while the toast is up. Once the row is deleted, that state is the only copy of
 * it left anywhere.
 *
 * @param {object} props
 * @param {{name: string, calories: number, date: string}} props.meal
 * @param {() => void} props.onUndo Re-adds the meal on its original date.
 */
export default function UndoToast({ meal, onUndo }) {
  return (
    <div
      style={{
        position: "fixed",
        left: "50%",
        bottom: 32,
        transform: "translateX(-50%)",
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        gap: "var(--space-4)",
        padding: "12px 14px 12px 20px",
        borderRadius: 999,
        background: "var(--color-neutral-900)",
        color: "var(--color-neutral-100)",
        boxShadow: "var(--shadow-lg)",
        animation: "riseIn 200ms ease both",
      }}
    >
      <span style={{ fontSize: 14 }}>Deleted “{meal.name}”</span>
      <button
        type="button"
        onClick={onUndo}
        className="btn"
        style={{
          background: "var(--color-accent)",
          color: "var(--color-bg)",
          fontSize: 13,
          padding: "6px 16px",
        }}
      >
        Undo
      </button>
    </div>
  );
}
