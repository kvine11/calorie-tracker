const today = new Date().toLocaleDateString(undefined, {
  weekday: "long",
  month: "long",
  day: "numeric",
});

export default function Header() {
  return (
    <div>
      <h1 className="text-xl font-bold text-ink">Calorie Tracker</h1>
      <p className="text-sm text-ink-mute">{today}</p>
    </div>
  );
}
