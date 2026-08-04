export default function FoodItem({ name, calories, onDelete }) {
  return (
    <li className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
      <span className="font-semibold text-ink">{name}</span>
      <div className="flex items-center gap-3">
        <span className="font-bold tabular-nums text-ink-mute">{calories} cal</span>
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Delete ${name}`}
          className="rounded-full px-2 py-1 text-xl leading-none text-ink-mute transition hover:bg-red-50 hover:text-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          ×
        </button>
      </div>
    </li>
  );
}
