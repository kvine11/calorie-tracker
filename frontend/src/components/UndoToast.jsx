// A delete is immediate; the toast is the safety net. Undo re-posts the meal,
// so it comes back with a new id — the row is restored, not the row's history.
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
