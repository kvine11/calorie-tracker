import { motion } from "framer-motion";

export default function FoodItem({ name, calories, onDelete }) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -12, transition: { duration: 0.2 } }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-center justify-between gap-4 border-b border-border py-3 last:border-b-0"
    >
      <span className="font-medium text-ink">{name}</span>
      <div className="flex items-center gap-3">
        <span className="text-sm tabular-nums text-ink-mute">{calories} cal</span>
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Delete ${name}`}
          className="rounded-full px-1.5 py-1 text-lg leading-none text-ink-mute transition hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          ×
        </button>
      </div>
    </motion.li>
  );
}
