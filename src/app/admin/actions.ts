"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import {
  grades,
  units,
  tasks,
  vocabItems,
  inviteCodes,
  taskType,
} from "@/db/schema";
import { getUser, getProfile } from "@/lib/auth";
import { parseTaskContent, type TaskTypeKey } from "@/lib/content-schemas";

export type ActionResult = { ok: true; id?: string } | { error: string };

/** Server-side teacher gate for every admin mutation (defense in depth). */
async function teacherGuard(): Promise<boolean> {
  const user = await getUser();
  if (!user) return false;
  const profile = await getProfile(user.id);
  return profile?.role === "teacher";
}

const TASK_TYPES = taskType.enumValues as readonly TaskTypeKey[];

// ---------------------------------------------------------------------------
// Grades
// ---------------------------------------------------------------------------
const gradeSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  displayOrder: z.coerce.number().int().min(0),
});

export async function createGrade(values: {
  name: string;
  displayOrder: number;
}): Promise<ActionResult> {
  if (!(await teacherGuard())) return { error: "Forbidden." };
  const p = gradeSchema.safeParse(values);
  if (!p.success) return { error: p.error.issues[0].message };
  try {
    const [row] = await db.insert(grades).values(p.data).returning();
    revalidatePath("/admin");
    return { ok: true, id: row.id };
  } catch {
    return { error: "Could not create grade (display order may be taken)." };
  }
}

export async function updateGrade(
  id: string,
  values: { name: string; displayOrder: number },
): Promise<ActionResult> {
  if (!(await teacherGuard())) return { error: "Forbidden." };
  const p = gradeSchema.safeParse(values);
  if (!p.success) return { error: p.error.issues[0].message };
  await db.update(grades).set(p.data).where(eq(grades.id, id));
  revalidatePath("/admin");
  revalidatePath(`/admin/grades/${id}`);
  return { ok: true };
}

export async function deleteGrade(id: string): Promise<ActionResult> {
  if (!(await teacherGuard())) return { error: "Forbidden." };
  await db.delete(grades).where(eq(grades.id, id));
  revalidatePath("/admin");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Units
// ---------------------------------------------------------------------------
const unitSchema = z.object({
  title: z.string().trim().min(1, "Title is required."),
  description: z.string().trim().optional(),
  displayOrder: z.coerce.number().int().min(0),
});

export async function createUnit(
  gradeId: string,
  values: { title: string; description?: string; displayOrder: number },
): Promise<ActionResult> {
  if (!(await teacherGuard())) return { error: "Forbidden." };
  const p = unitSchema.safeParse(values);
  if (!p.success) return { error: p.error.issues[0].message };
  try {
    const [row] = await db
      .insert(units)
      .values({ gradeId, ...p.data, description: p.data.description || null })
      .returning();
    revalidatePath(`/admin/grades/${gradeId}`);
    return { ok: true, id: row.id };
  } catch {
    return { error: "Could not create unit (display order may be taken)." };
  }
}

export async function updateUnit(
  id: string,
  gradeId: string,
  values: { title: string; description?: string; displayOrder: number },
): Promise<ActionResult> {
  if (!(await teacherGuard())) return { error: "Forbidden." };
  const p = unitSchema.safeParse(values);
  if (!p.success) return { error: p.error.issues[0].message };
  await db
    .update(units)
    .set({ ...p.data, description: p.data.description || null })
    .where(eq(units.id, id));
  revalidatePath(`/admin/grades/${gradeId}`);
  revalidatePath(`/admin/units/${id}`);
  return { ok: true };
}

export async function deleteUnit(
  id: string,
  gradeId: string,
): Promise<ActionResult> {
  if (!(await teacherGuard())) return { error: "Forbidden." };
  await db.delete(units).where(eq(units.id, id));
  revalidatePath(`/admin/grades/${gradeId}`);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Tasks (content validated against the type's Zod schema)
// ---------------------------------------------------------------------------
const taskMetaSchema = z.object({
  title: z.string().trim().min(1, "Title is required."),
  type: z.enum(TASK_TYPES as [TaskTypeKey, ...TaskTypeKey[]]),
  displayOrder: z.coerce.number().int().min(0),
});

function validateContent(
  type: TaskTypeKey,
  contentJson: string,
): { content: unknown } | { error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(contentJson);
  } catch {
    return { error: "Content is not valid JSON." };
  }
  try {
    return { content: parseTaskContent(type, parsed) };
  } catch (e) {
    const msg = e instanceof z.ZodError ? e.issues[0]?.message : "Invalid content";
    return { error: `Content doesn't match the ${type} schema: ${msg}` };
  }
}

export async function createTask(
  unitId: string,
  values: {
    title: string;
    type: TaskTypeKey;
    displayOrder: number;
    contentJson: string;
  },
): Promise<ActionResult> {
  if (!(await teacherGuard())) return { error: "Forbidden." };
  const p = taskMetaSchema.safeParse(values);
  if (!p.success) return { error: p.error.issues[0].message };
  const c = validateContent(p.data.type, values.contentJson);
  if ("error" in c) return { error: c.error };
  try {
    const [row] = await db
      .insert(tasks)
      .values({ unitId, ...p.data, content: c.content as never })
      .returning();
    revalidatePath(`/admin/units/${unitId}`);
    return { ok: true, id: row.id };
  } catch {
    return { error: "Could not create task (display order may be taken)." };
  }
}

export async function updateTask(
  id: string,
  unitId: string,
  values: {
    title: string;
    type: TaskTypeKey;
    displayOrder: number;
    contentJson: string;
  },
): Promise<ActionResult> {
  if (!(await teacherGuard())) return { error: "Forbidden." };
  const p = taskMetaSchema.safeParse(values);
  if (!p.success) return { error: p.error.issues[0].message };
  const c = validateContent(p.data.type, values.contentJson);
  if ("error" in c) return { error: c.error };
  await db
    .update(tasks)
    .set({ ...p.data, content: c.content as never })
    .where(eq(tasks.id, id));
  revalidatePath(`/admin/units/${unitId}`);
  return { ok: true };
}

export async function deleteTask(
  id: string,
  unitId: string,
): Promise<ActionResult> {
  if (!(await teacherGuard())) return { error: "Forbidden." };
  await db.delete(tasks).where(eq(tasks.id, id));
  revalidatePath(`/admin/units/${unitId}`);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Vocab bulk import (JSON array)
// ---------------------------------------------------------------------------
const vocabImportSchema = z.array(
  z.object({
    word: z.string().trim().min(1),
    translation_he: z.string().trim().min(1),
    part_of_speech: z.string().trim().optional(),
    example_sentence: z.string().trim().optional(),
  }),
);

export async function importVocab(
  unitId: string,
  json: string,
  replace: boolean,
): Promise<ActionResult> {
  if (!(await teacherGuard())) return { error: "Forbidden." };
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { error: "Not valid JSON." };
  }
  const p = vocabImportSchema.safeParse(parsed);
  if (!p.success)
    return { error: "Expected an array of { word, translation_he, ... }." };
  if (p.data.length === 0) return { error: "No items to import." };

  if (replace) await db.delete(vocabItems).where(eq(vocabItems.unitId, unitId));
  await db.insert(vocabItems).values(
    p.data.map((v) => ({
      unitId,
      word: v.word,
      translationHe: v.translation_he,
      partOfSpeech: v.part_of_speech || null,
      exampleSentence: v.example_sentence || null,
    })),
  );
  revalidatePath(`/admin/units/${unitId}`);
  return { ok: true };
}

export async function deleteVocab(
  id: string,
  unitId: string,
): Promise<ActionResult> {
  if (!(await teacherGuard())) return { error: "Forbidden." };
  await db.delete(vocabItems).where(eq(vocabItems.id, id));
  revalidatePath(`/admin/units/${unitId}`);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Invite codes
// ---------------------------------------------------------------------------
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars

function randomCode(): string {
  const pick = (n: number) =>
    Array.from(
      { length: n },
      () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)],
    ).join("");
  return `${pick(4)}-${pick(4)}`;
}

export async function createInviteCode(
  gradeId: string,
  emailHint?: string,
): Promise<ActionResult> {
  const guard = await teacherGuard();
  if (!guard) return { error: "Forbidden." };
  const user = await getUser();
  if (!gradeId) return { error: "Pick a grade." };

  // Retry a couple of times on the (unlikely) code collision.
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const [row] = await db
        .insert(inviteCodes)
        .values({
          code: randomCode(),
          gradeId,
          emailHint: emailHint?.trim() || null,
          createdBy: user?.id ?? null,
        })
        .returning();
      revalidatePath("/admin/invites");
      return { ok: true, id: row.id };
    } catch {
      // try again with a new code
    }
  }
  return { error: "Could not generate a unique code. Try again." };
}

export async function deleteInviteCode(id: string): Promise<ActionResult> {
  if (!(await teacherGuard())) return { error: "Forbidden." };
  await db
    .delete(inviteCodes)
    .where(and(eq(inviteCodes.id, id), sql`${inviteCodes.usedAt} is null`));
  revalidatePath("/admin/invites");
  return { ok: true };
}
