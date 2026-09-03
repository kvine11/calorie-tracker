/**
 * The "Delete this meal?" confirmation.
 *
 * Only shown when "Confirm before deleting" is turned on in Settings. With it
 * off, the delete happens immediately and the undo toast is the safety net
 * instead. The app gives you one or the other, never both, since confirming
 * first and then also offering undo would be asking the same question twice.
 *
 * App renders this from its `confirmTarget` state, so it appears above whichever
 * screen is showing. Clicking the backdrop or pressing Escape cancels, and the
 * Delete button is autofocused so Enter confirms.
 *
 * The meal's name and calories are shown in the prompt so there is no ambiguity
 * about which row is about to be deleted.
 *
 * @param {object} props
 * @param {{name: string, calories: number}} props.meal
 * @param {() => void} props.onConfirm Runs the actual delete.
 * @param {() => void} props.onCancel
 */
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
