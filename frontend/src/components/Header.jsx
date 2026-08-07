const today = new Date().toLocaleDateString(undefined, {
  weekday: "long",
  month: "long",
  day: "numeric",
});

export default function Header() {
  return (
    <div className="border-b-2 border-border-strong pb-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-mute">
        Calorie Tracker
      </p>
      <h1 className="mt-1 font-display text-xl font-semibold text-ink">{today}</h1>
    </div>
  );
}
