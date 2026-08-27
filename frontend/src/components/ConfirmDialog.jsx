// Only shown when "Confirm before deleting" is on in Settings — otherwise the
// undo toast is the safety net.
export default function ConfirmDialog({ meal, onConfirm, onCancel }) {
  return (
    <div className="dialog-backdrop" style={{ zIndex: 90 }} onClick={onCancel}>
      <div className="dialog" onClick={(event) => event.stopPropagation()}>
        <div className="dialog-title">Delete this meal?</div>
        <p className="dialog-body" style={{ margin: 0 }}>
          “{meal.name}” ({meal.calories} cal) will be removed from this day.
        </p>
        <div className="dialog-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={onConfirm} autoFocus>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
