// Line icons — one stroke weight, one join style, so they read as a set.
// `size` is the only thing callers usually change.

function Icon({ size = 17, children }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
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

export function TrashIcon(props) {
  return (
    <Icon {...props}>
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
    </Icon>
  );
}

export function ChevronLeftIcon(props) {
  return (
    <Icon {...props}>
      <path d="m15 18-6-6 6-6" />
    </Icon>
  );
}

export function ChevronRightIcon(props) {
  return (
    <Icon {...props}>
      <path d="m9 18 6-6-6-6" />
    </Icon>
  );
}

// The mark: the same segmented ring the day's calories are drawn as, in two
// steps of the one accent.
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
        stroke="var(--color-accent-800)"
        strokeWidth="4"
        strokeDasharray="29 69"
      />
      <circle
        cx="14"
        cy="14"
        r="11"
        fill="none"
        stroke="var(--color-accent-400)"
        strokeWidth="4"
        strokeDasharray="19 69"
        strokeDashoffset="-32"
      />
    </svg>
  );
}
