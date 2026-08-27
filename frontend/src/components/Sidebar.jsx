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

// Items whose backend doesn't exist yet stay visible but inert — the roadmap
// is part of the interface rather than something hidden until it ships.
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
