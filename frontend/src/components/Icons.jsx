// The app's icon set. Every icon is drawn by hand as SVG paths rather than
// pulled from an icon library, which keeps the frontend dependency-free and
// means they all share exactly one visual style.

/**
 * The shared wrapper every icon in this file is built on: one 24x24 coordinate
 * grid, one stroke weight, one line-join style, so the icons look like a set
 * rather than a collection of unrelated drawings.
 *
 * The stroke is set to `currentColor`, meaning each icon inherits the text color
 * of whatever contains it. That is what lets a sidebar item flip its icon to the
 * background color when it becomes active, without the icon knowing anything
 * about navigation state.
 *
 * Marked aria-hidden because every icon here sits next to a real text label, so
 * announcing it to a screen reader would just repeat that label.
 *
 * @param {object} props
 * @param {number} [props.size=17] Width and height in pixels.
 * @param {React.ReactNode} props.children The paths, drawn on the 24x24 grid.
 */
function Icon({ size = 17, children }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function HomeIcon(props) {
  return (
    <Icon {...props}>
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </Icon>
  );
}

export function CalendarIcon(props) {
  return (
    <Icon {...props}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </Icon>
  );
}

export function SearchIcon(props) {
  return (
    <Icon {...props}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </Icon>
  );
}

export function PlusIcon(props) {
  return (
    <Icon {...props}>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  );
}

export function TrendIcon(props) {
  return (
    <Icon {...props}>
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </Icon>
  );
}

export function CameraIcon(props) {
  return (
    <Icon {...props}>
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </Icon>
  );
}

export function SlidersIcon(props) {
  return (
    <Icon {...props}>
      <path d="M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3" />
      <circle cx="12" cy="4" r="2" />
      <circle cx="10" cy="12" r="2" />
      <circle cx="14" cy="20" r="2" />
    </Icon>
  );
}

export function UserIcon(props) {
  return (
    <Icon {...props}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </Icon>
  );
}

export function TrashIcon(props) {
  return (
    <Icon {...props}>
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
    </Icon>
  );
}

/**
 * The logo in the sidebar: a small two-tone segmented ring.
 *
 * It is deliberately the same shape CalorieRing draws the day as, so the logo is
 * a miniature of the thing the app is actually for. It is built separately from
 * the Icon wrapper above because it needs its own coordinate grid, the -90
 * degree rotation that puts the first segment at the top, and fixed segment
 * lengths rather than inheriting its colors.
 *
 * @param {object} props
 * @param {number} [props.size=28]
 */
export function BrandMark({ size = 28 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      aria-hidden="true"
      style={{ flex: "none", transform: "rotate(-90deg)" }}
    >
      <circle cx="14" cy="14" r="11" fill="none" stroke="var(--color-neutral-300)" strokeWidth="4" />
      <circle
        cx="14"
        cy="14"
        r="11"
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="29 69"
      />
      <circle
        cx="14"
        cy="14"
        r="11"
        fill="none"
        stroke="var(--color-accent-2-500)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="17 69"
        strokeDashoffset="-32"
      />
    </svg>
  );
}
