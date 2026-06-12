"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireUser, getProfile } from "@/lib/auth";
import { getTaskWithUnit, getGradeProgression } from "@/lib/queries";
import { db } from "@/db";
import { userProgress } from "@/db/schema";

export type RecordResult = { ok: true } | { error: string };

/**
 * Upsert a student's progress for a task. Gated: the task must be in the
 * student's grade and currently unlocked. A completed task is never downgraded;
 * on a graded retry the higher score wins and attempts increments.
 */
export async function recordProgress(
  taskId: string,
  input: { status: "in_progress" | "completed"; score: number | null },
): Promise<RecordResult> {
  const user = await requireUser();
  const profile = await getProfile(user.id);
  if (!profile?.gradeId) return { error: "No grade assigned." };

  const res = await getTaskWithUnit(taskId);
  if (!res) return { error: "Task not found." };
  if (profile.gradeId !== res.unit.gradeId) return { error: "Forbidden." };

  const progression = await getGradeProgression(user.id, res.unit.gradeId);
  const node = progression.units
    .flatMap((u) => u.tasks)
    .find((t) => t.id === taskId);
  if (!node || node.state === "locked") return { error: "Task is locked." };

  const [existing] = await db
    .select()
    .from(userProgress)
    .where(
      and(eq(userProgress.userId, user.id), eq(userProgress.taskId, taskId)),
    )
    .limit(1);

  // Never downgrade a completed task back to in_progress.
  if (existing?.status === "completed" && input.status === "in_progress") {
    return { ok: true };
  }

  const status = input.status;
  const score =
    status === "completed"
      ? input.score == null
        ? (existing?.score ?? null) // vocab-study has no score
        : Math.max(existing?.score ?? 0, input.score) // graded: keep best
      : (existing?.score ?? null);
  const attempts =
    (existing?.attempts ?? 0) + (status === "completed" ? 1 : 0);
  const completedAt =
    status === "completed"
      ? (existing?.completedAt ?? new Date())
      : (existing?.completedAt ?? null);

  await db
    .insert(userProgress)
    .values({ userId: user.id, taskId, status, score, attempts, completedAt })
    .onConflictDoUpdate({
      target: [userProgress.userId, userProgress.taskId],
      set: { status, score, attempts, completedAt },
    });

  revalidatePath("/dashboard");
  revalidatePath(`/units/${res.unit.id}`);
  return { ok: true };
}
