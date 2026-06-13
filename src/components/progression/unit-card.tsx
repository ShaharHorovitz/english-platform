"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { Lock, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "./progress-bar";
import type { UnitNode } from "@/lib/progression";
import { cn } from "@/lib/utils";

/** Unit tile. Mounts with a staggered scale-in; lifts on hover; the current
 * (next-to-do) unit gets a soft accent glow. Locked units are greyed and inert. */
export function UnitCard({
  unit,
  index,
  current = false,
}: {
  unit: UnitNode;
  index: number;
  current?: boolean;
}) {
  const reduce = useReducedMotion();
  const locked = unit.state === "locked";
  const completed = unit.state === "completed";

  const inner = (
    <Card
      className={cn(
        "flex h-full flex-col gap-4 p-5 transition-shadow duration-[var(--duration-base)] ease-[var(--ease-out)]",
        locked ? "opacity-60" : "group-hover:bg-accent group-hover:shadow-medium",
        current && !locked && "ring-2 ring-primary/35",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Unit {index + 1}
          </p>
          <h3 className="mt-1 font-bold tracking-tight">{unit.title}</h3>
        </div>
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full",
            completed
              ? "bg-success text-success-foreground"
              : locked
                ? "bg-muted text-locked"
                : "bg-muted text-foreground",
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

      <div className="mt-auto flex flex-col gap-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            {unit.completedCount}/{unit.totalCount} tasks
          </span>
          <span>
            {locked ? "Locked" : completed ? "Complete" : `${unit.percent}%`}
          </span>
        </div>
        <ProgressBar value={unit.percent} />
      </div>
    </Card>
  );

  const motionProps = reduce
    ? {}
    : {
        initial: { opacity: 0, scale: 0.97, y: 6 },
        animate: { opacity: 1, scale: 1, y: 0 },
        transition: {
          duration: 0.35,
          ease: [0.16, 1, 0.3, 1] as const,
          delay: index * 0.06,
        },
        whileHover: locked ? undefined : { y: -2 },
      };

  if (locked) {
    return (
      <motion.div aria-disabled className="cursor-not-allowed" {...motionProps}>
        {inner}
      </motion.div>
    );
  }
  return (
    <motion.div {...motionProps}>
      <Link
        href={`/units/${unit.id}`}
        className="group block rounded-[var(--radius-card)] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {inner}
      </Link>
    </motion.div>
  );
}
