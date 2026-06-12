import type { TaskTypeKey } from "@/lib/content-schemas";

/**
 * Progression + locking logic (pure, no DB). The single source of truth for:
 *  - which units/tasks are locked, available, in-progress, or completed
 *  - the "next incomplete task" the Continue button jumps to
 *
 * Rules (from the project spec):
 *  - A task unlocks only when the previous task in its unit is completed.
 *  - A unit unlocks only when the previous unit in the grade is completed.
 *  - The first unit, and the first task of an unlocked unit, are always open.
 *  - Lock state is DERIVED here at read time, never stored.
 *
 * Completion itself (vocab-study viewed-all, others ≥70%) is decided when
 * progress is written by the task pages; this module only reads the status.
 */

/** Graded tasks (practice/reading/in-context) need this score to complete. */
export const PASS_THRESHOLD = 70;

export const isPassing = (score: number) => score >= PASS_THRESHOLD;

export type ItemState = "locked" | "available" | "in_progress" | "completed";

export interface ProgressionTaskInput {
  id: string;
  title: string;
  type: TaskTypeKey;
  displayOrder: number;
}

export interface ProgressionUnitInput {
  id: string;
  title: string;
  description: string | null;
  displayOrder: number;
  tasks: ProgressionTaskInput[];
}

export interface ProgressRecord {
  status: "in_progress" | "completed";
  score: number | null;
}

/** taskId -> progress row */
export type ProgressMap = Record<string, ProgressRecord>;

export interface TaskNode extends ProgressionTaskInput {
  unitId: string;
  state: ItemState;
  score: number | null;
}

export interface UnitNode {
  id: string;
  title: string;
  description: string | null;
  displayOrder: number;
  state: ItemState;
  tasks: TaskNode[];
  completedCount: number;
  totalCount: number;
  /** 0–100 */
  percent: number;
}

export interface Progression {
  units: UnitNode[];
  /** The next task to do (Continue target), or null if everything is done. */
  nextTask: { unitId: string; taskId: string } | null;
  overall: { completed: number; total: number; percent: number };
}

const pct = (done: number, total: number) =>
  total === 0 ? 0 : Math.round((done / total) * 100);

/**
 * Build the derived progression for one grade's ordered units/tasks given a
 * student's progress. Units and their tasks are sorted by displayOrder here, so
 * callers don't have to pre-sort.
 */
export function buildProgression(
  units: ProgressionUnitInput[],
  progress: ProgressMap,
): Progression {
  const orderedUnits = [...units].sort(
    (a, b) => a.displayOrder - b.displayOrder,
  );

  const resultUnits: UnitNode[] = [];
  let nextTask: { unitId: string; taskId: string } | null = null;
  let prevUnitCompleted = true; // first unit is always unlocked
  let overallDone = 0;
  let overallTotal = 0;

  for (const unit of orderedUnits) {
    const orderedTasks = [...unit.tasks].sort(
      (a, b) => a.displayOrder - b.displayOrder,
    );
    const unitUnlocked = prevUnitCompleted;

    const taskNodes: TaskNode[] = [];
    let prevTaskCompleted = true; // first task of an unlocked unit is open
    let completedCount = 0;

    for (const task of orderedTasks) {
      const record = progress[task.id];
      const isCompleted = record?.status === "completed";
      const taskUnlocked = unitUnlocked && prevTaskCompleted;

      let state: ItemState;
      if (isCompleted) {
        state = "completed";
      } else if (taskUnlocked) {
        state = record?.status === "in_progress" ? "in_progress" : "available";
      } else {
        state = "locked";
      }

      // First open, not-completed task across the whole grade = Continue target.
      if (
        nextTask === null &&
        (state === "available" || state === "in_progress")
      ) {
        nextTask = { unitId: unit.id, taskId: task.id };
      }

      if (isCompleted) completedCount += 1;
      taskNodes.push({
        ...task,
        unitId: unit.id,
        state,
        score: record?.score ?? null,
      });
      prevTaskCompleted = isCompleted;
    }

    const totalCount = taskNodes.length;
    const unitCompleted = totalCount > 0 && completedCount === totalCount;

    let unitState: ItemState;
    if (!unitUnlocked) unitState = "locked";
    else if (unitCompleted) unitState = "completed";
    else if (completedCount > 0) unitState = "in_progress";
    else unitState = "available";

    resultUnits.push({
      id: unit.id,
      title: unit.title,
      description: unit.description,
      displayOrder: unit.displayOrder,
      state: unitState,
      tasks: taskNodes,
      completedCount,
      totalCount,
      percent: pct(completedCount, totalCount),
    });

    overallDone += completedCount;
    overallTotal += totalCount;
    prevUnitCompleted = unitCompleted;
  }

  return {
    units: resultUnits,
    nextTask,
    overall: {
      completed: overallDone,
      total: overallTotal,
      percent: pct(overallDone, overallTotal),
    },
  };
}
