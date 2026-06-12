import Link from "next/link";
import { Lock, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "./progress-bar";
import type { UnitNode } from "@/lib/progression";
import { cn } from "@/lib/utils";

/** A unit tile for the dashboard / grade unit grid. Locked units are visible
 * but greyed with a lock, and are not links. */
export function UnitCard({ unit, index }: { unit: UnitNode; index: number }) {
  const locked = unit.state === "locked";
  const completed = unit.state === "completed";

  const inner = (
    <Card
      className={cn(
        "flex h-full flex-col gap-4 p-5 transition-colors",
        locked ? "opacity-60" : "group-hover:bg-accent",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Unit {index + 1}
          </p>
          <h3 className="mt-0.5 font-bold tracking-tight">{unit.title}</h3>
        </div>
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full",
            completed
              ? "bg-success text-success-foreground"
              : locked
                ? "bg-muted text-locked"
                : "bg-accent text-accent-foreground",
          )}
        >
          {completed ? (
            <Check className="size-4" />
          ) : locked ? (
            <Lock className="size-4" />
          ) : (
            <span className="text-xs font-bold">{unit.percent}%</span>
          )}
        </span>
      </div>

      {unit.description ? (
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {unit.description}
        </p>
      ) : null}

      <div className="mt-auto flex flex-col gap-1.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            {unit.completedCount}/{unit.totalCount} tasks
          </span>
          <span>{locked ? "Locked" : completed ? "Complete" : `${unit.percent}%`}</span>
        </div>
        <ProgressBar value={unit.percent} />
      </div>
    </Card>
  );

  if (locked) {
    return (
      <div aria-disabled className="cursor-not-allowed">
        {inner}
      </div>
    );
  }
  return (
    <Link
      href={`/units/${unit.id}`}
      className="group rounded-[var(--radius-card)] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {inner}
    </Link>
  );
}
