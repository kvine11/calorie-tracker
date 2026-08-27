const rowStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "var(--space-4)",
};

const hintStyle = {
  fontSize: 13,
  color: "color-mix(in srgb, var(--color-text) 55%, transparent)",
};

function Segmented({ name, options, value, onChange }) {
  return (
    <div className="seg">
      {options.map((option) => (
        <label key={String(option.value)} className="seg-opt">
          <input
            type="radio"
            name={name}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
          />
          {option.label}
        </label>
      ))}
    </div>
  );
}

export default function SettingsView({
  weekStartsOn,
  onWeekStartsOnChange,
  confirmBeforeDelete,
  onConfirmBeforeDeleteChange,
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)", maxWidth: 620 }}>
      <header>
        <div
          style={{
            fontSize: 11,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--color-accent)",
          }}
        >
          Settings
        </div>
        <h1 style={{ margin: "6px 0 0", fontSize: 38 }}>Preferences</h1>
      </header>

      <div className="card elev-sm" style={{ gap: "var(--space-4)", padding: "var(--space-6)" }}>
        <div style={rowStyle}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>Week starts on</div>
            <div style={hintStyle}>Controls the day strip on Today</div>
          </div>
          <Segmented
            name="weekstart"
            value={weekStartsOn}
            onChange={onWeekStartsOnChange}
            options={[
              { value: 0, label: "Sunday" },
              { value: 1, label: "Monday" },
            ]}
          />
        </div>

        <div style={{ height: 1, background: "var(--color-divider)" }} />

        <div style={rowStyle}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>Confirm before deleting</div>
            <div style={hintStyle}>
              {confirmBeforeDelete
                ? "On — every delete asks first"
                : "Off — deletes can be undone from the toast instead"}
            </div>
          </div>
          <Segmented
            name="confirmdel"
            value={confirmBeforeDelete}
            onChange={onConfirmBeforeDeleteChange}
            options={[
              { value: true, label: "On" },
              { value: false, label: "Off" },
            ]}
          />
        </div>
      </div>

      {/* Everything the roadmap still owes the interface, stated plainly. */}
      <div
        className="card"
        style={{ gap: "var(--space-3)", padding: "var(--space-6)", background: "var(--color-accent-2-100)" }}
      >
        <div className="card-title">In progress</div>
        <p className="card-body" style={{ opacity: 1 }}>
          Not wired up yet — these appear greyed in the sidebar until the backend supports them.
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span className="tag tag-neutral">Food scan</span>
          <span className="tag tag-neutral">Trends &amp; charts</span>
          <span className="tag tag-neutral">Macros</span>
          <span className="tag tag-neutral">Weight tracking</span>
        </div>
      </div>
    </div>
  );
}
