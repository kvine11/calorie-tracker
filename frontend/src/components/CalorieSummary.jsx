import { motion, AnimatePresence } from "framer-motion";

export default function CalorieSummary({ total }) {
  return (
    <div className="border-t-2 border-b-2 border-border-strong py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-mute">
        Calories Today
      </p>
      <div className="mt-1 flex items-baseline gap-2 overflow-hidden">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={total}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-5xl font-semibold tabular-nums text-accent"
          >
            {total}
          </motion.span>
        </AnimatePresence>
        <span className="text-sm font-medium text-ink-mute">cal</span>
      </div>
    </div>
  );
}
