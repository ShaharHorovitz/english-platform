import confetti from "canvas-confetti";

/** A celebratory burst in Tidewater teal + gold. No-ops under reduced motion. */
export function celebrate(origin: { x: number; y: number } = { x: 0.5, y: 0.4 }) {
  if (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return;
  }
  const colors = ["#0b7d71", "#18b6a6", "#2db6a6", "#dda13c", "#4e9a6b"];
  confetti({
    particleCount: 64,
    spread: 72,
    startVelocity: 38,
    origin,
    colors,
    scalar: 0.9,
    ticks: 160,
    disableForReducedMotion: true,
  });
  setTimeout(() => {
    confetti({
      particleCount: 28,
      spread: 100,
      startVelocity: 26,
      origin,
      colors,
      scalar: 0.8,
      ticks: 140,
      disableForReducedMotion: true,
    });
  }, 130);
}
