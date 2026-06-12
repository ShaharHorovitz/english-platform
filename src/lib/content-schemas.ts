import { z } from "zod";

/**
 * Zod schemas for each task type's `content` JSONB column.
 *
 * Single source of truth, reused by:
 *  - the task pages that render content (Phase 4)
 *  - the admin JSON editor that validates before saving (Phase 5)
 *
 * Every task page reads its content from `tasks.content`, so any content you
 * add later through the admin panel works without code changes as long as it
 * validates against the matching schema here.
 */

// ---------------------------------------------------------------------------
// vocab_study — flashcards. Completion = viewed every card at least once.
// ---------------------------------------------------------------------------
export const vocabStudyContentSchema = z.object({
  cards: z
    .array(
      z.object({
        word: z.string().min(1),
        translation: z.string().min(1),
        example: z.string().optional(),
      }),
    )
    .min(1),
});

// ---------------------------------------------------------------------------
// vocab_practice — mixed exercises. Completion = score >= 70%.
// ---------------------------------------------------------------------------
const matchingExercise = z.object({
  type: z.literal("matching"),
  pairs: z
    .array(z.object({ left: z.string().min(1), right: z.string().min(1) }))
    .min(2),
});

const multipleChoiceExercise = z.object({
  type: z.literal("multiple_choice"),
  question: z.string().min(1),
  options: z.array(z.string().min(1)).min(2),
  answer: z.number().int().nonnegative(), // index into `options`
});

const fillInExercise = z.object({
  type: z.literal("fill_in"),
  sentence: z.string().min(1), // contains a blank marker, e.g. "I ___ home"
  blank_answer: z.string().min(1),
});

export const vocabPracticeContentSchema = z.object({
  exercises: z
    .array(
      z.discriminatedUnion("type", [
        matchingExercise,
        multipleChoiceExercise,
        fillInExercise,
      ]),
    )
    .min(1),
});

// ---------------------------------------------------------------------------
// reading — passage + comprehension questions. Completion = score >= 70%.
// ---------------------------------------------------------------------------
export const readingContentSchema = z.object({
  passage: z.string().min(1),
  questions: z
    .array(
      z.object({
        question: z.string().min(1),
        options: z.array(z.string().min(1)).min(2),
        answer: z.number().int().nonnegative(), // index into `options`
      }),
    )
    .min(1),
});

// ---------------------------------------------------------------------------
// in_context — use each word in a sentence. Completion = score >= 70%.
// Graded by checking the answer contains one of `accepted_answers`.
// ---------------------------------------------------------------------------
export const inContextContentSchema = z.object({
  items: z
    .array(
      z.object({
        word: z.string().min(1),
        prompt: z.string().min(1),
        accepted_answers: z.array(z.string().min(1)).min(1),
      }),
    )
    .min(1),
});

// ---------------------------------------------------------------------------
// Lookup + types
// ---------------------------------------------------------------------------
export const taskContentSchemas = {
  vocab_study: vocabStudyContentSchema,
  vocab_practice: vocabPracticeContentSchema,
  reading: readingContentSchema,
  in_context: inContextContentSchema,
} as const;

export type TaskTypeKey = keyof typeof taskContentSchemas;

export type VocabStudyContent = z.infer<typeof vocabStudyContentSchema>;
export type VocabPracticeContent = z.infer<typeof vocabPracticeContentSchema>;
export type ReadingContent = z.infer<typeof readingContentSchema>;
export type InContextContent = z.infer<typeof inContextContentSchema>;

/** Validate a content blob for a given task type. Throws on invalid input. */
export function parseTaskContent(type: TaskTypeKey, content: unknown) {
  return taskContentSchemas[type].parse(content);
}
