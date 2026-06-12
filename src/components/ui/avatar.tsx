import { cn } from "@/lib/utils";

/** Initials avatar (no image needed for the POC). Teal-tinted secondary token. */
export function Avatar({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "?";
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-9 shrink-0 select-none items-center justify-center rounded-full bg-secondary text-sm font-bold text-secondary-foreground",
        className,
      )}
    >
      {initials}
    </span>
  );
}
