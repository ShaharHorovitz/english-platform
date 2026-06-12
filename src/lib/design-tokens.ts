/**
 * Design tokens — the single source of truth for the visual system.
 *
 * Direction (ages 10–16, "Duolingo restraint + Khan clarity, slightly playful"):
 *  - Friendly **indigo** primary, **emerald** progress-green for completion,
 *    **amber** for streaks/achievements, on a cool slate neutral.
 *  - NOT childish (no Comic Sans / cartoon), NOT corporate. Large readable type,
 *    generous spacing, soft rounded corners, subtle motion.
 *  - Full light + dark mode; RTL-ready (consumers use logical properties).
 *
 * Palette base: ui-ux-pro-max "Language Learning App" system (WCAG-checked).
 * Typography: Plus Jakarta Sans (UI/Latin) + Noto Sans Hebrew (Hebrew fallback).
 *
 * These values are MIRRORED as CSS variables in `src/app/globals.css` (@theme),
 * which is what Tailwind v4 reads. Keep the two in sync — this file is the
 * documented reference and the source for any JS/TS that needs token values.
 */

// ---------------------------------------------------------------------------
// Primitive scales
// ---------------------------------------------------------------------------
export const palette = {
  // Brand indigo
  indigo: {
    50: "#eef2ff",
    100: "#e0e7ff",
    200: "#c7d2fe",
    300: "#a5b4fc",
    400: "#818cf8",
    500: "#6366f1",
    600: "#4f46e5", // primary (light)
    700: "#4338ca",
    800: "#3730a3",
    900: "#312e81", // foreground / deep indigo text
    950: "#1e1b4b",
  },
  // Progress / success green
  emerald: {
    400: "#34d399",
    500: "#22c55e",
    600: "#16a34a", // accent (light) — WCAG-adjusted
    700: "#15803d",
  },
  // Streak / achievement amber
  amber: {
    400: "#fbbf24",
    500: "#f59e0b",
    600: "#d97706",
  },
  // Error rose/red
  red: {
    400: "#f87171",
    500: "#ef4444",
    600: "#dc2626",
  },
  // Cool slate neutrals
  slate: {
    50: "#f8fafc",
    100: "#f1f5f9",
    200: "#e2e8f0",
    300: "#cbd5e1",
    400: "#94a3b8",
    500: "#64748b",
    600: "#475569",
    700: "#334155",
    800: "#1e293b",
    900: "#0f172a",
    950: "#020617",
  },
  white: "#ffffff",
  black: "#000000",
} as const;

// ---------------------------------------------------------------------------
// Semantic color roles (light + dark). Component code references these.
// ---------------------------------------------------------------------------
export const semanticColors = {
  light: {
    background: "#f5f7ff", // soft indigo-tinted app shell
    foreground: palette.indigo[900], // deep indigo text (friendlier than black)
    card: palette.white,
    cardForeground: palette.indigo[900],
    popover: palette.white,
    popoverForeground: palette.indigo[900],
    primary: palette.indigo[600],
    primaryForeground: palette.white,
    secondary: palette.indigo[400],
    secondaryForeground: palette.indigo[950],
    success: palette.emerald[600], // task completion / progress
    successForeground: palette.white,
    streak: palette.amber[500], // achievements / streaks
    streakForeground: palette.slate[900],
    muted: "#eaeefb",
    mutedForeground: palette.slate[500],
    accent: palette.indigo[50], // subtle hover/selected fill
    accentForeground: palette.indigo[700],
    border: palette.indigo[200],
    input: palette.indigo[200],
    ring: palette.indigo[600],
    destructive: palette.red[600],
    destructiveForeground: palette.white,
    // task-type accents (study/practice/reading/in-context)
    locked: palette.slate[400],
  },
  dark: {
    background: palette.slate[900], // night
    foreground: palette.slate[100],
    card: palette.slate[800],
    cardForeground: palette.slate[100],
    popover: palette.slate[800],
    popoverForeground: palette.slate[100],
    primary: palette.indigo[500], // lift indigo for contrast on dark
    primaryForeground: palette.white,
    secondary: palette.indigo[400],
    secondaryForeground: palette.slate[900],
    success: palette.emerald[500],
    successForeground: palette.slate[950],
    streak: palette.amber[400],
    streakForeground: palette.slate[950],
    muted: "#1b2540",
    mutedForeground: palette.slate[400],
    accent: "#222d4d",
    accentForeground: palette.indigo[200],
    border: "rgba(255,255,255,0.10)",
    input: "rgba(255,255,255,0.14)",
    ring: palette.indigo[400],
    destructive: palette.red[400],
    destructiveForeground: palette.slate[950],
    locked: palette.slate[600],
  },
} as const;

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------
export const typography = {
  fontFamily: {
    // Latin/UI primary, Hebrew fallback handles he-IL glyphs by unicode coverage
    sans: "var(--font-sans), 'Noto Sans Hebrew', ui-sans-serif, system-ui, sans-serif",
    hebrew: "'Noto Sans Hebrew', var(--font-sans), sans-serif",
    mono: "var(--font-mono), ui-monospace, monospace",
  },
  // [size, lineHeight]
  fontSize: {
    xs: ["0.8125rem", "1.125rem"], // 13/18
    sm: ["0.875rem", "1.25rem"], // 14/20
    base: ["1rem", "1.6"], // 16, generous leading for readability
    lg: ["1.125rem", "1.7"], // 18 — comfortable for passages
    xl: ["1.25rem", "1.6"], // 20
    "2xl": ["1.5rem", "1.3"], // 24
    "3xl": ["1.875rem", "1.2"], // 30
    "4xl": ["2.25rem", "1.15"], // 36
    "5xl": ["3rem", "1.05"], // 48
  },
  fontWeight: {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    extrabold: "800", // hero / screen titles
  },
  letterSpacing: {
    tight: "-0.02em",
    normal: "0",
    wide: "0.02em",
  },
} as const;

// ---------------------------------------------------------------------------
// Spacing, radii, shadows, motion, breakpoints
// ---------------------------------------------------------------------------
export const spacing = {
  // Semantic layout spacing (in addition to Tailwind's default 4px scale)
  pageInline: "1.25rem", // 20px mobile gutters
  pageInlineLg: "2rem",
  sectionGap: "2.5rem",
  cardPadding: "1.5rem",
  fieldGap: "1rem",
} as const;

export const radii = {
  sm: "0.5rem",
  md: "0.75rem",
  lg: "1rem", // default card radius — soft, friendly
  xl: "1.25rem",
  "2xl": "1.5rem",
  pill: "9999px",
} as const;

export const shadows = {
  // Soft, slightly indigo-tinted elevation
  sm: "0 1px 2px 0 rgb(49 46 129 / 0.06)",
  md: "0 4px 12px -2px rgb(49 46 129 / 0.10)",
  lg: "0 12px 32px -8px rgb(49 46 129 / 0.18)",
  // Focus ring glow
  focus: "0 0 0 3px rgb(79 70 229 / 0.35)",
} as const;

export const motion = {
  duration: {
    fast: "150ms",
    base: "200ms",
    slow: "300ms",
    slower: "500ms",
  },
  easing: {
    standard: "cubic-bezier(0.4, 0, 0.2, 1)",
    emphasized: "cubic-bezier(0.2, 0, 0, 1)",
    // playful overshoot for completion micro-animations
    spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  },
} as const;

export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
} as const;

export const tokens = {
  palette,
  semanticColors,
  typography,
  spacing,
  radii,
  shadows,
  motion,
  breakpoints,
} as const;

export type SemanticColorRole = keyof typeof semanticColors.light;
export default tokens;
