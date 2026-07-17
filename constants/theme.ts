export const colors = {
  primary: "var(--color-primary)",
  primaryHover: "var(--color-primary-hover)",
  secondary: "var(--color-secondary)",
  accent: "var(--color-accent)",
  background: "var(--color-bg)",
  surface: "var(--color-surface)",
  surfaceElevated: "var(--color-surface-elevated)",
  text: "var(--color-text)",
  textMuted: "var(--color-text-muted)",
  border: "var(--color-border)",
  success: "var(--color-success)",
  warning: "var(--color-warning)",
  danger: "var(--color-danger)",
} as const;

export const spacing = {
  xs: "0.375rem",
  sm: "0.5rem",
  md: "0.75rem",
  lg: "1rem",
  xl: "1.25rem",
  "2xl": "1.5rem",
  "3xl": "2rem",
  "4xl": "2.5rem",
  "5xl": "3rem",
  "6xl": "4rem",
} as const;

export const borderRadius = {
  sm: "0.5rem",
  md: "0.75rem",
  lg: "1rem",
  xl: "1.25rem",
  "2xl": "1.5rem",
  "3xl": "2rem",
  full: "9999px",
} as const;

export const shadows = {
  sm: "0 1px 3px rgba(15, 23, 42, 0.08)",
  md: "0 16px 40px -24px rgba(15, 23, 42, 0.28)",
  lg: "0 24px 70px -28px rgba(37, 99, 235, 0.28)",
  xl: "0 35px 120px -40px rgba(15, 23, 42, 0.26)",
} as const;

export const transitions = {
  fast: "150ms ease",
  base: "200ms ease",
  slow: "300ms ease",
} as const;

export const typography = {
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  heading: "font-semibold tracking-[-0.02em] text-slate-950",
  body: "text-base leading-7 text-slate-600",
  label: "text-sm font-medium text-slate-700",
} as const;
