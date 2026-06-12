import { eq, inArray, asc } from "drizzle-orm";
import { db } from "@/db";
import { units, tasks, userProgress, grades } from "@/db/schema";
import {
  buildProgression,
  type Progression,
  type ProgressMap,
} from "@/lib/progression";

/**
 * Fetch a grade's ordered units + tasks and a student's progress, then derive
 * the full locking/progression state. RLS already restricts students to their
 * own grade's data, so callers must still guard that the gradeId is theirs.
 */
export async function getGradeProgression(
  userId: string,
  gradeId: string,
): Promise<Progression> {
  const unitRows = await db
    .select()
    .from(units)
    .where(eq(units.gradeId, gradeId))
    .orderBy(asc(units.displayOrder));

  const unitIds = unitRows.map((u) => u.id);
  const taskRows = unitIds.length
    ? await db
        .select()
        .from(tasks)
        .where(inArray(tasks.unitId, unitIds))
        .orderBy(asc(tasks.displayOrder))
    : [];

  const progressRows = await db
    .select()
    .from(userProgress)
    .where(eq(userProgress.userId, userId));

  const taskIdSet = new Set(taskRows.map((t) => t.id));
  const progress: ProgressMap = {};
  for (const row of progressRows) {
    if (taskIdSet.has(row.taskId)) {
      progress[row.taskId] = { status: row.status, score: row.score };
    }
  }

  return buildProgression(
    unitRows.map((u) => ({
      id: u.id,
      title: u.title,
      description: u.description,
      displayOrder: u.displayOrder,
      tasks: taskRows
        .filter((t) => t.unitId === u.id)
        .map((t) => ({
          id: t.id,
          title: t.title,
          type: t.type,
          displayOrder: t.displayOrder,
        })),
    })),
    progress,
  );
}

export async function getGrade(gradeId: string) {
  const [grade] = await db
    .select()
    .from(grades)
    .where(eq(grades.id, gradeId))
    .limit(1);
  return grade ?? null;
}

/** A unit plus the gradeId it belongs to (for computing its progression). */
export async function getUnit(unitId: string) {
  const [unit] = await db
    .select()
    .from(units)
    .where(eq(units.id, unitId))
    .limit(1);
  return unit ?? null;
}

/** A task plus its unit (for the task page's gate + context). */
export async function getTaskWithUnit(taskId: string) {
  const [task] = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, taskId))
    .limit(1);
  if (!task) return null;
  const unit = await getUnit(task.unitId);
  return unit ? { task, unit } : null;
}
