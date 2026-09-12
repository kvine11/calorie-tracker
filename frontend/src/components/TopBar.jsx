import { motion } from "framer-motion";
import { BrandMark, PlusIcon } from "./Icons.jsx";
import { LAYOUT_SPRING } from "../motion.js";

const TABS = [
  { id: "today", label: "Today" },
  { id: "history", label: "History" },
];

const SHORTCUT = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.userAgent) ? "⌘K" : "Ctrl K";

export default function TopBar({ view, onNavigate, onQuickAdd }) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="brand">
          <BrandMark size={22} />
          <span className="brand-name">Calorie Tracker</span>
        </div>

        <nav className="tabs" aria-label="Views">
          {TABS.map((tab) => {
            const isActive = view === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className="tab"
                data-active={isActive}
                aria-current={isActive ? "page" : undefined}
                onClick={() => onNavigate(tab.id)}
              >
                {/* One element shared by both tabs, so it slides between them. */}
                {isActive && <motion.span layoutId="tab-indicator" className="tab-indicator" transition={LAYOUT_SPRING} />}
                <span className="tab-label">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <button type="button" className="btn btn-secondary btn-sm quick-add" onClick={onQuickAdd}>
          <PlusIcon size={13} />
          <span className="quick-add-label">Quick add</span>
          <kbd>{SHORTCUT}</kbd>
        </button>
      </div>
    </header>
  );
}
