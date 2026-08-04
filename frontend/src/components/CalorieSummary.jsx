export default function CalorieSummary({ total }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-6 py-5 text-center shadow-sm">
      <p className="text-sm font-medium text-ink-mute">Calories Today</p>
      <p className="mt-1 text-4xl font-extrabold tabular-nums text-accent">{total}</p>
    </div>
  );
}
