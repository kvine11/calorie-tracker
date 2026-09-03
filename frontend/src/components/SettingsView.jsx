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

/**
 * A radio button group styled to look like a segmented control.
 *
 * These are real <input type="radio"> elements underneath the styling, so
 * keyboard arrow-key navigation and screen reader grouping work with no extra
 * code. Building the same look out of plain divs and click handlers would mean
 * reimplementing both by hand.
 *
 * @param {object} props
 * @param {string} props.name The shared radio group name.
 * @param {Array<{value: *, label: string}>} props.options
 * @param {*} props.value Compared with ===, so options can be numbers or booleans.
 * @param {(value: *) => void} props.onChange
 */
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

/**
 * The preferences screen, plus an honest list of what is not built yet.
 *
 * Both settings are stored in App rather than here, because both are used
 * somewhere else. weekStartsOn is read by every date picker in the app, and
 * confirmBeforeDelete decides which delete path runs. A preference that is
 * changed in one place and used in another has to live above both of them.
 *
 * Neither is persisted. They are ordinary React state, so they reset on page
 * reload. localStorage is the obvious next step, and storing them per user is
 * something an accounts layer would eventually take over.
 *
 * @param {object} props
 * @param {number} props.weekStartsOn 0 for Sunday, 1 for Monday.
 * @param {(value: number) => void} props.onWeekStartsOnChange
 * @param {boolean} props.confirmBeforeDelete
 * @param {(value: boolean) => void} props.onConfirmBeforeDeleteChange
 */
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
