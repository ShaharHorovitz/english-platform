/**
 * Design tokens — the single source of truth for the visual system.
 *
 * Direction: **Tidewater** — teal accent, warm greige neutrals, restrained and
 * sophisticated (Brilliant.org × Linear), for English students aged 10–16.
 * NOT childish, NOT corporate, NOT clinical blue-gray.
 *
 *  - ONE signature accent: teal (hue ~173°), never drifting to cyan or green.
 *  - Warm neutrals (greige), muted supporting colors: sage success, terracotta
 *    error — no screaming emerald/red.
 *  - ONE button radius (10px) everywhere. Primary CTA = teal gradient + an
 *    asymmetric, accent-tinted shadow (the visual signature).
 *  - Full light + dark mode, all text/UI pairs verified WCAG AA.
 *  - RTL-ready (consumers use logical properties).
 *
 * Typography: Plus Jakarta Sans (UI/Latin) + Noto Sans Hebrew (Hebrew fallback).
 *
 * MIRRORED as CSS variables in `src/app/globals.css` (@theme), which is what
 * Tailwind v4 reads. Keep the two in sync.
 */

// ---------------------------------------------------------------------------
// Brand + supporting primitives
// ---------------------------------------------------------------------------
export const palette = {
  teal: {
    light: "#0B7D71", // primary (links/focus/icons) — AA on white (5.0:1)
    gradFromLight: "#0F9082",
    gradToLight: "#0A7164",
    dark: "#2DB6A6", // primary on dark surfaces (hue 173°)
    gradFromDark: "#36C6B4",
    gradToDark: "#18A293",
  },
  sage: { light: "#4E9A6B", dark: "#66B07E" }, // success / progress
  terracotta: { light: "#C15E4A", dark: "#D67257" }, // destructive
  gold: { light: "#DDA13C", dark: "#E6B65A" }, // streak / achievement
  greige: {
    bgLight: "#F6F6F3",
    mutedLight: "#ECEBE5",
    borderLight: "#E3E2DA",
    textLight: "#1E2A28",
    textMutedLight: "#646F6B",
  },
  white: "#ffffff",
} as const;

// ---------------------------------------------------------------------------
// Semantic color roles (light + dark). Component code references these.
// ---------------------------------------------------------------------------
export const semanticColors = {
  light: {
    background: "#f6f6f3",
    foreground: "#1e2a28",
    card: "#ffffff",
    cardForeground: "#1e2a28",
    popover: "#ffffff",
    popoverForeground: "#1e2a28",
    primary: "#0b7d71",
    primaryForeground: "#ffffff",
    // gradient CTA signature
    primaryFrom: "#0f9082",
    primaryTo: "#0a7164",
    ctaShadow: "0 12px 26px -10px rgb(11 125 113 / 0.42), -6px 8px 18px -12px rgb(11 125 113 / 0.28)",
    secondary: "#eaf3f0",
    secondaryForeground: "#0b6b61",
    success: "#4e9a6b",
    successForeground: "#ffffff",
    streak: "#dda13c",
    streakForeground: "#1c1300",
    muted: "#ecebe5",
    mutedForeground: "#646f6b",
    accent: "#eaf3f0", // subtle teal-tinted hover/selected fill
    accentForeground: "#0b6b61",
    border: "#e3e2da",
    input: "#e3e2da",
    ring: "#0b7d71",
    destructive: "#c15e4a",
    destructiveForeground: "#ffffff",
    locked: "#9aa4a0",
  },
  dark: {
    background: "#11201e",
    foreground: "#eaf1ef",
    card: "#182c29",
    cardForeground: "#eaf1ef",
    popover: "#182c29",
    popoverForeground: "#eaf1ef",
    primary: "#2db6a6",
    primaryForeground: "#0b1a18", // dark text on bright teal (AA, crisp)
    primaryFrom: "#36c6b4",
    primaryTo: "#18a293",
    ctaShadow: "0 14px 30px -12px rgb(45 182 166 / 0.4), -6px 8px 20px -14px rgb(45 182 166 / 0.3)",
    secondary: "#21413b",
    secondaryForeground: "#cdede6",
    success: "#66b07e",
    successForeground: "#07210f",
    streak: "#e6b65a",
    streakForeground: "#1c1300",
    muted: "#1e3531",
    mutedForeground: "#93a39e",
    accent: "#21413b",
    accentForeground: "#cdede6",
    border: "rgba(255,255,255,0.09)",
    input: "rgba(255,255,255,0.14)",
    ring: "#2db6a6",
    destructive: "#d67257",
    destructiveForeground: "#2a0f0a",
    locked: "#5a6661",
  },
} as const;

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------
export const typography = {
  fontFamily: {
    sans: "var(--font-plus-jakarta), var(--font-noto-hebrew), ui-sans-serif, system-ui, sans-serif",
    hebrew: "var(--font-noto-hebrew), var(--font-plus-jakarta), sans-serif",
    mono: "var(--font-geist-mono), ui-monospace, monospace",
  },
  // [size, lineHeight]
  fontSize: {
    xs: ["0.8125rem", "1.125rem"],
    sm: ["0.875rem", "1.25rem"],
    base: ["1rem", "1.6"],
    lg: ["1.125rem", "1.7"], // reading passages
    xl: ["1.25rem", "1.6"],
    "2xl": ["1.5rem", "1.3"],
    "3xl": ["1.875rem", "1.2"],
    "4xl": ["2.25rem", "1.15"],
    "5xl": ["3rem", "1.05"],
  },
  fontWeight: {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    extrabold: "800",
  },
  letterSpacing: { tight: "-0.02em", normal: "0", wide: "0.02em" },
} as const;

// ---------------------------------------------------------------------------
// Spacing, radii, shadows, motion, breakpoints
// ---------------------------------------------------------------------------
export const spacing = {
  pageInline: "1.25rem",
  pageInlineLg: "2rem",
  sectionGap: "2.5rem",
  cardPadding: "1.5rem",
  fieldGap: "1rem",
} as const;

/** ONE button radius everywhere (10px). Inputs match it; cards a touch softer. */
export const radii = {
  button: "10px",
  input: "10px",
  card: "16px",
  chip: "9999px",
  sm: "0.5rem",
  md: "0.75rem",
  lg: "1rem",
} as const;

export const shadows = {
  sm: "0 1px 2px 0 rgb(30 42 40 / 0.06)",
  md: "0 4px 12px -2px rgb(30 42 40 / 0.10)",
  lg: "0 14px 34px -10px rgb(30 42 40 / 0.16)",
} as const;

export const motion = {
  duration: { fast: "150ms", base: "200ms", slow: "300ms", slower: "500ms" },
  easing: {
    standard: "cubic-bezier(0.4, 0, 0.2, 1)",
    emphasized: "cubic-bezier(0.2, 0, 0, 1)",
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
