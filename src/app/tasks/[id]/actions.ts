"use server";

import { and, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireUser, getProfile } from "@/lib/auth";
import { getTaskWithUnit, getGradeProgression } from "@/lib/queries";
import { db } from "@/db";
import {
  userProgress,
  taskAttempts,
  vocabMastery,
  vocabItems,
} from "@/db/schema";
import { computeMasteryLevel } from "@/lib/mastery";

export type RecordResult = { ok: true } | { error: string };

export type WordResult = { word: string; correct: boolean };

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

/**
 * Records ONE completed attempt and writes all three analytics-relevant tables:
 *  - task_attempts: the per-attempt record (score, passed, time, redo_count)
 *  - user_progress: the progression summary (unchanged semantics)
 *  - vocab_mastery: per-word seen/correct/incorrect (vocab_study + vocab_practice)
 * Gated like recordProgress (own grade + task unlocked).
 */
export async function submitTaskAttempt(
  taskId: string,
  input: {
    score: number | null;
    passed: boolean;
    timeSpentSeconds: number | null;
    wordResults?: WordResult[];
  },
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

  const now = new Date();

  // 1) task_attempts — attempt number & redo_count from prior attempts.
  const [{ prior }] = await db
    .select({ prior: sql<number>`count(*)::int` })
    .from(taskAttempts)
    .where(
      and(eq(taskAttempts.userId, user.id), eq(taskAttempts.taskId, taskId)),
    );
  await db.insert(taskAttempts).values({
    userId: user.id,
    taskId,
    attemptNumber: prior + 1,
    startedAt: input.timeSpentSeconds
      ? new Date(now.getTime() - input.timeSpentSeconds * 1000)
      : now,
    completedAt: now,
    timeSpentSeconds: input.timeSpentSeconds ?? null,
    score: input.score,
    passed: input.passed,
    redoCount: prior,
  });

  // 2) user_progress — same rules as recordProgress (never un-complete).
  const [existing] = await db
    .select()
    .from(userProgress)
    .where(
      and(eq(userProgress.userId, user.id), eq(userProgress.taskId, taskId)),
    )
    .limit(1);
  if (!(existing?.status === "completed" && !input.passed)) {
    const status = input.passed ? "completed" : "in_progress";
    const score = input.passed
      ? input.score == null
        ? (existing?.score ?? null)
        : Math.max(existing?.score ?? 0, input.score)
      : (existing?.score ?? null);
    const completedAt = input.passed ? (existing?.completedAt ?? now) : (existing?.completedAt ?? null);
    await db
      .insert(userProgress)
      .values({
        userId: user.id,
        taskId,
        status,
        score,
        attempts: prior + 1,
        completedAt,
      })
      .onConflictDoUpdate({
        target: [userProgress.userId, userProgress.taskId],
        set: { status, score, attempts: prior + 1, completedAt },
      });
  }

  // 3) vocab_mastery — per word shown (matched to vocab_items in this unit).
  if (input.wordResults?.length) {
    const words = [...new Set(input.wordResults.map((w) => w.word))];
    const items = await db
      .select()
      .from(vocabItems)
      .where(
        and(eq(vocabItems.unitId, res.unit.id), inArray(vocabItems.word, words)),
      );
    const byWord = new Map(items.map((i) => [i.word, i.id]));
    for (const wr of input.wordResults) {
      const itemId = byWord.get(wr.word);
      if (!itemId) continue;
      const [m] = await db
        .select()
        .from(vocabMastery)
        .where(
          and(
            eq(vocabMastery.userId, user.id),
            eq(vocabMastery.vocabItemId, itemId),
          ),
        )
        .limit(1);
      const timesSeen = (m?.timesSeen ?? 0) + 1;
      const timesCorrect = (m?.timesCorrect ?? 0) + (wr.correct ? 1 : 0);
      const timesIncorrect = (m?.timesIncorrect ?? 0) + (wr.correct ? 0 : 1);
      const lastCorrectAt = wr.correct ? now : (m?.lastCorrectAt ?? null);
      const set = {
        timesSeen,
        timesCorrect,
        timesIncorrect,
        masteryLevel: computeMasteryLevel(timesSeen, timesCorrect),
        lastSeenAt: now,
        lastCorrectAt,
      };
      await db
        .insert(vocabMastery)
        .values({ userId: user.id, vocabItemId: itemId, ...set })
        .onConflictDoUpdate({
          target: [vocabMastery.userId, vocabMastery.vocabItemId],
          set,
        });
    }
  }

  revalidatePath("/dashboard");
  revalidatePath(`/units/${res.unit.id}`);
  revalidatePath(`/admin/students/${user.id}`);
  return { ok: true };
}
