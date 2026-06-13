import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  timestamp,
  jsonb,
  unique,
  index,
  boolean,
  smallint,
} from "drizzle-orm/pg-core";
import type {
  VocabStudyContent,
  VocabPracticeContent,
  ReadingContent,
  InContextContent,
} from "../lib/content-schemas";

/**
 * Drizzle owns these application tables. Supabase-managed objects (auth.users,
 * RLS policies, the FK from profiles.id -> auth.users.id, and the
 * `handle_new_user` trigger) live in raw SQL under supabase/migrations and are
 * intentionally NOT modeled here — Drizzle doesn't represent RLS or the `auth`
 * schema, so keeping them separate avoids fighting the migration tooling.
 */

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const userRole = pgEnum("user_role", ["student", "teacher"]);

export const taskType = pgEnum("task_type", [
  "vocab_study",
  "vocab_practice",
  "reading",
  "in_context",
]);

/**
 * Only progress that has actually started is stored. "locked" / "available"
 * are DERIVED at read time from the completion of prior tasks/units — never
 * persisted, so changing the ordering never requires rewriting progress rows.
 */
export const progressStatus = pgEnum("progress_status", [
  "in_progress",
  "completed",
]);

// Union of every task's `content` shape. The JSONB column is typed per task
// type at the application layer via the Zod schemas in content-schemas.ts.
export type TaskContent =
  | VocabStudyContent
  | VocabPracticeContent
  | ReadingContent
  | InContextContent;

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

export const grades = pgTable(
  "grades",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    displayOrder: integer("display_order").notNull(),
  },
  (t) => [unique("grades_display_order_unique").on(t.displayOrder)],
);

export const profiles = pgTable("profiles", {
  // Matches auth.users.id 1:1. The FK constraint to auth.users is added in
  // supabase/migrations (Drizzle can't reference the auth schema).
  id: uuid("id").primaryKey(),
  fullName: text("full_name").notNull(),
  gradeId: uuid("grade_id").references(() => grades.id, {
    onDelete: "set null",
  }),
  role: userRole("role").notNull().default("student"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const units = pgTable(
  "units",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    gradeId: uuid("grade_id")
      .notNull()
      .references(() => grades.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    displayOrder: integer("display_order").notNull(),
  },
  (t) => [
    unique("units_grade_order_unique").on(t.gradeId, t.displayOrder),
  ],
);

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    unitId: uuid("unit_id")
      .notNull()
      .references(() => units.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    type: taskType("type").notNull(),
    displayOrder: integer("display_order").notNull(),
    // Validated against the per-type Zod schema before any write (admin editor
    // in Phase 5, task pages in Phase 4).
    content: jsonb("content").$type<TaskContent>().notNull(),
  },
  (t) => [unique("tasks_unit_order_unique").on(t.unitId, t.displayOrder)],
);

export const vocabItems = pgTable("vocab_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  unitId: uuid("unit_id")
    .notNull()
    .references(() => units.id, { onDelete: "cascade" }),
  word: text("word").notNull(),
  translationHe: text("translation_he").notNull(),
  partOfSpeech: text("part_of_speech"),
  exampleSentence: text("example_sentence"),
});

export const userProgress = pgTable(
  "user_progress",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    status: progressStatus("status").notNull().default("in_progress"),
    score: integer("score"),
    attempts: integer("attempts").notNull().default(0),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [
    // One progress row per student per task; the app upserts on this pair.
    // This unique constraint also serves lookups keyed on (user_id, task_id).
    unique("user_progress_user_task_unique").on(t.userId, t.taskId),
    // Hot path: "find this user's incomplete tasks" filters by user_id + status.
    index("user_progress_user_status_idx").on(t.userId, t.status),
  ],
);

export const inviteCodes = pgTable("invite_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  // The grade a redeeming student is assigned to (set at code creation).
  gradeId: uuid("grade_id")
    .notNull()
    .references(() => grades.id, { onDelete: "cascade" }),
  emailHint: text("email_hint"),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdBy: uuid("created_by").references(() => profiles.id, {
    onDelete: "set null",
  }),
});

// ---------------------------------------------------------------------------
// Analytics (source of truth for the teacher detail view). user_progress stays
// the lightweight summary the progression logic reads.
// ---------------------------------------------------------------------------

// One row PER ATTEMPT (not per task).
export const taskAttempts = pgTable(
  "task_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    attemptNumber: integer("attempt_number").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    timeSpentSeconds: integer("time_spent_seconds"),
    score: integer("score"), // 0–100
    passed: boolean("passed").notNull().default(false),
    redoCount: integer("redo_count").notNull().default(0),
  },
  (t) => [
    index("task_attempts_user_task_idx").on(t.userId, t.taskId),
    index("task_attempts_user_completed_idx").on(t.userId, t.completedAt),
  ],
);

// One row per (user × vocab_item) — per-word performance.
export const vocabMastery = pgTable(
  "vocab_mastery",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    vocabItemId: uuid("vocab_item_id")
      .notNull()
      .references(() => vocabItems.id, { onDelete: "cascade" }),
    timesSeen: integer("times_seen").notNull().default(0),
    timesCorrect: integer("times_correct").notNull().default(0),
    timesIncorrect: integer("times_incorrect").notNull().default(0),
    // 0 new, 1 learning, 2 reviewing, 3 familiar, 4 mastered
    masteryLevel: smallint("mastery_level").notNull().default(0),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
    lastCorrectAt: timestamp("last_correct_at", { withTimezone: true }),
  },
  (t) => [
    unique("vocab_mastery_user_item_unique").on(t.userId, t.vocabItemId),
    index("vocab_mastery_user_level_idx").on(t.userId, t.masteryLevel),
  ],
);

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type Grade = typeof grades.$inferSelect;
export type Unit = typeof units.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type VocabItem = typeof vocabItems.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type UserProgress = typeof userProgress.$inferSelect;
export type InviteCode = typeof inviteCodes.$inferSelect;
export type TaskAttempt = typeof taskAttempts.$inferSelect;
export type VocabMastery = typeof vocabMastery.$inferSelect;
