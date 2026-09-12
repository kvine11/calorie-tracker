import { motion } from "framer-motion";
import { EASE_OUT } from "../motion.js";

// The app's one toast slot. A delete happens immediately and this is its safety
// net; a write that failed surfaces here too, rather than dying in the console.
// The hairline along the bottom runs down with the time left.
export default function Toast({ toast, onUndo, onDismiss }) {
  const isUndo = toast.kind === "undo";

  return (
    <motion.div
      className="toast"
      data-kind={toast.kind}
      role={isUndo ? "status" : "alert"}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2, ease: EASE_OUT }}
    >
      <span className="toast-text">
        {isUndo ? (
          <>
            Deleted <strong>{toast.meal.name}</strong>
          </>
        ) : (
          toast.message
        )}
      </span>

      {isUndo ? (
        <button type="button" className="btn btn-primary btn-sm" onClick={onUndo}>
          Undo
        </button>
      ) : (
        <button type="button" className="btn btn-quiet btn-sm" onClick={onDismiss}>
          Dismiss
        </button>
      )}

      <motion.span
        className="toast-timer"
        aria-hidden="true"
        initial={{ width: "100%" }}
        animate={{ width: "0%" }}
        transition={{ duration: toast.duration / 1000, ease: "linear" }}
      />
    </motion.div>
  );
}
