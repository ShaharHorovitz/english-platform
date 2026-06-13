import Link from "next/link";
import { Lock, Check, ArrowRight } from "lucide-react";
import { taskTypeMeta } from "@/lib/task-type";
import type { TaskNode } from "@/lib/progression";
import { cn } from "@/lib/utils";

function statusLine(task: TaskNode): string {
  switch (task.state) {
    case "completed":
      return task.score != null ? `Completed · ${task.score}%` : "Completed";
    case "in_progress":
      return "In progress";
    case "locked":
      return "Locked";
    default:
      return "Ready to start";
  }
}

/** A task row inside a unit. Locked tasks are visible but greyed and not links. */
export function TaskRow({ task }: { task: TaskNode }) {
  const meta = taskTypeMeta[task.type];
  const Icon = meta.icon;
  const locked = task.state === "locked";
  const completed = task.state === "completed";

  const row = (
    <div
      className={cn(
        "flex items-center gap-4 rounded-[var(--radius-card)] border border-border bg-card p-4 shadow-soft transition-colors",
        locked ? "opacity-60" : "group-hover:bg-accent",
      )}
    >
      <span
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-button)]",
          completed
            ? "bg-success text-success-foreground"
            : locked
              ? "bg-muted text-locked"
              : "bg-accent text-accent-foreground",
        )}
      >
        {completed ? (
          <Check className="size-5" />
        ) : locked ? (
          <Lock className="size-5" />
        ) : (
          <Icon className="size-5" />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p className="font-semibold">{meta.label}</p>
        <p className="text-sm text-muted-foreground">{statusLine(task)}</p>
      </div>

      {!locked ? (
        <ArrowRight className="size-5 shrink-0 text-muted-foreground" />
      ) : null}
    </div>
  );

  if (locked) return row;
  return (
    <Link
      href={`/tasks/${task.id}`}
      className="group block rounded-[var(--radius-card)] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {row}
    </Link>
  );
}
