import { cn } from "@/lib/utils";

/** Token-styled progress bar with the teal CTA gradient fill. */
export function ProgressBar({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        "h-2 w-full overflow-hidden rounded-full bg-muted",
        className,
      )}
    >
      <div
        className="h-full rounded-full bg-[linear-gradient(90deg,var(--primary-from),var(--primary-to))] transition-[width] duration-500 ease-[var(--ease-emphasized)]"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
