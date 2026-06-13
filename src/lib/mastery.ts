/**
 * Mastery level from per-word performance. Simple ratio formula for now — a
 * recency-weighted spaced-repetition algorithm can replace this later without
 * touching callers. Levels: 0 new · 1 learning · 2 reviewing · 3 familiar · 4 mastered.
 */
export const MASTERY_LABELS = [
  "New",
  "Learning",
  "Reviewing",
  "Familiar",
  "Mastered",
] as const;

export function computeMasteryLevel(
  timesSeen: number,
  timesCorrect: number,
): number {
  if (timesSeen <= 0) return 0;
  if (timesSeen < 2) return 1; // not enough signal yet
  const ratio = timesCorrect / timesSeen;
  if (ratio < 0.4) return 1;
  if (ratio < 0.6) return 2;
  if (ratio < 0.85) return 3;
  return 4;
}
