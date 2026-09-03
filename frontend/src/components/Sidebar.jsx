import {
  BrandMark,
  CalendarIcon,
  CameraIcon,
  HomeIcon,
  PlusIcon,
  SearchIcon,
  SlidersIcon,
  TrendIcon,
  UserIcon,
} from "./Icons.jsx";

const navButtonStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  width: "100%",
  textAlign: "left",
  border: 0,
  cursor: "pointer",
  padding: "9px 12px",
  borderRadius: 999,
  fontFamily: "var(--font-body)",
  fontSize: 14,
};

const soonStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "9px 12px",
  fontSize: 14,
  color: "color-mix(in srgb, var(--color-text) 38%, transparent)",
  cursor: "not-allowed",
};

/**
 * One clickable navigation row.
 *
 * The active row is filled with the accent color. It also sets
 * aria-current="page", which is how a screen reader announces "you are here" —
 * color on its own communicates nothing to someone who is not looking at the
 * screen.
 *
 * @param {object} props
 * @param {JSX.Element} props.icon
 * @param {string} props.label
 * @param {boolean} props.active Whether this is the screen currently showing.
 * @param {() => void} props.onClick
 */
function NavItem({ icon, label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="nav-item"
      data-active={active}
      aria-current={active ? "page" : undefined}
      style={{
        ...navButtonStyle,
        background: active ? "var(--color-accent)" : "transparent",
        color: active ? "var(--color-bg)" : "var(--color-text)",
      }}
    >
      {icon}
      {label}
    </button>
  );
}

/**
 * A navigation row for a feature that is not built yet: visible, greyed out,
 * labeled "soon", and not clickable.
 *
 * Showing unfinished features rather than hiding them is deliberate. It tells
 * anyone looking at the app where it is heading. Trends is the charts version
 * and Food scan is the photo-recognition version, both planned.
 *
 * @param {object} props
 * @param {JSX.Element} props.icon
 * @param {string} props.label
 */
function SoonItem({ icon, label }) {
  return (
    <div style={soonStyle}>
      {icon}
      {label}
      <span className="tag tag-neutral" style={{ marginLeft: "auto", fontSize: 10, padding: "2px 8px" }}>
        soon
      </span>
    </div>
  );
}

/**
 * The left navigation rail, always visible. This is the app's only navigation.
 *
 * It holds four working destinations, then the not-yet-built features greyed
 * out, with Settings pinned to the bottom.
 *
 * "Quick add" is different from the other three: it is not a screen. It opens
 * the same overlay that Cmd/Ctrl-K opens. It has a sidebar button because a
 * keyboard shortcut is invisible to anyone who does not already know about it.
 *
 * KNOWN LIMITATION, worth raising before someone else spots it: this sidebar is
 * desktop-only. It is a fixed 238px wide (190px on smaller screens) and never
 * collapses, so on a phone it would take up half the screen. The plan is to
 * replace it with a bottom tab bar below about 700px, since the four items map
 * onto tabs directly, rather than building and maintaining a separate mobile
 * layout.
 *
 * @param {object} props
 * @param {"today"|"history"|"search"|"settings"} props.view The current screen.
 * @param {(view: string) => void} props.onNavigate Switches screens.
 * @param {() => void} props.onQuickAdd Opens the quick-add overlay.
 */
export default function Sidebar({ view, onNavigate, onQuickAdd }) {
  return (
    <aside
      data-sidebar
      style={{
        width: 238,
        flex: "none",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-6)",
        padding: "var(--space-6) var(--space-4)",
        position: "sticky",
        top: 0,
        height: "100vh",
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, paddingLeft: 6 }}>
        <BrandMark />
        <div style={{ fontFamily: "var(--font-heading)", fontSize: 18, lineHeight: 1.1 }}>
          Calorie Tracker
        </div>
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <NavItem
          icon={<HomeIcon />}
          label="Today"
          active={view === "today"}
          onClick={() => onNavigate("today")}
        />
        <NavItem
          icon={<CalendarIcon />}
          label="History"
          active={view === "history"}
          onClick={() => onNavigate("history")}
        />
        <NavItem
          icon={<SearchIcon />}
          label="Search foods"
          active={view === "search"}
          onClick={() => onNavigate("search")}
        />
        <NavItem icon={<PlusIcon />} label="Quick add" active={false} onClick={onQuickAdd} />

        <div style={{ height: 1, background: "var(--color-divider)", margin: "var(--space-3) 12px" }} />

        <SoonItem icon={<TrendIcon />} label="Trends" />
        <SoonItem icon={<CameraIcon />} label="Food scan" />
      </nav>

      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
        <NavItem
          icon={<SlidersIcon />}
          label="Settings"
          active={view === "settings"}
          onClick={() => onNavigate("settings")}
        />
        <SoonItem icon={<UserIcon />} label="Profile" />
      </div>
    </aside>
  );
}
