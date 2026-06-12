import "./load-env";
import { sql } from "drizzle-orm";
import { createClient } from "@supabase/supabase-js";
import { db } from "./index";
import { grades, units, tasks, vocabItems, profiles } from "./schema";
import type { TaskContent } from "./schema";
import type { TaskTypeKey } from "../lib/content-schemas";

/**
 * Placeholder seed. Just enough to exercise every screen:
 *  - 2 grades (5th, 6th), 2 units each, all 4 task types per unit
 *  - 5 dummy vocab items per unit
 *  - 1 teacher (TEACHER_EMAIL) + 2 test students
 *
 * Content is intentionally lorem-ipsum / word1..word5 — real content gets added
 * later through the admin panel. Run with: npm run db:seed
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TEACHER_EMAIL = process.env.TEACHER_EMAIL;
const SEED_PASSWORD = process.env.SEED_TEST_PASSWORD ?? "password123";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local",
  );
}
if (!TEACHER_EMAIL) {
  throw new Error("TEACHER_EMAIL must be set in .env.local");
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// --- placeholder content builders -----------------------------------------

function contentFor(type: TaskTypeKey, unitLabel: string): TaskContent {
  switch (type) {
    case "vocab_study":
      return {
        cards: Array.from({ length: 5 }, (_, i) => ({
          word: `word${i + 1}`,
          translation: `מילה${i + 1}`,
          example: `This is a placeholder example using word${i + 1}.`,
        })),
      };
    case "vocab_practice":
      return {
        exercises: [
          {
            type: "matching",
            pairs: [
              { left: "word1", right: "מילה1" },
              { left: "word2", right: "מילה2" },
              { left: "word3", right: "מילה3" },
            ],
          },
          {
            type: "multiple_choice",
            question: `Which word means "מילה1" (${unitLabel})?`,
            options: ["word1", "word2", "word3"],
            answer: 0,
          },
          {
            type: "fill_in",
            sentence: "I learned a new ___ today.",
            blank_answer: "word1",
          },
        ],
      };
    case "reading":
      return {
        passage:
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit. " +
          "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. " +
          "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
        questions: [
          {
            question: "What is this placeholder passage about?",
            options: ["Lorem", "Ipsum", "Nothing yet"],
            answer: 2,
          },
          {
            question: "Which word appears first?",
            options: ["dolor", "Lorem", "amet"],
            answer: 1,
          },
          {
            question: "Is this real content?",
            options: ["Yes", "No, it is a placeholder"],
            answer: 1,
          },
        ],
      };
    case "in_context":
      return {
        items: Array.from({ length: 3 }, (_, i) => ({
          word: `word${i + 1}`,
          prompt: `Write a sentence using "word${i + 1}".`,
          accepted_answers: [`word${i + 1}`],
        })),
      };
  }
}

const TASK_TYPES: { type: TaskTypeKey; title: string }[] = [
  { type: "vocab_study", title: "Vocabulary Study" },
  { type: "vocab_practice", title: "Vocabulary Practice" },
  { type: "reading", title: "Reading Passage" },
  { type: "in_context", title: "Vocabulary in Context" },
];

// --- auth user helper -------------------------------------------------------

async function ensureUser(
  email: string,
  fullName: string,
  role: "student" | "teacher",
) {
  // Role lives in app_metadata so the proxy can gate /admin without a DB call.
  const created = await admin.auth.admin.createUser({
    email,
    password: SEED_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: fullName },
    app_metadata: { role },
  });
  if (created.data.user) return created.data.user.id;

  // Already exists — find them by paging, then backfill metadata.
  let id: string | undefined;
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const found = data.users.find((u) => u.email === email);
    if (found) {
      id = found.id;
      break;
    }
    if (data.users.length < 200) break;
    page += 1;
  }
  if (!id) throw new Error(`Could not create or find auth user: ${email}`);

  await admin.auth.admin.updateUserById(id, {
    app_metadata: { role },
    user_metadata: { full_name: fullName },
  });
  return id;
}

// --- main -------------------------------------------------------------------

async function seed() {
  console.log("🌱 Seeding placeholder content...");

  // Clean slate for content. Deleting grades cascades to units -> tasks ->
  // user_progress, and to invite_codes. Profiles/auth users are left intact.
  await db.delete(grades);

  const gradeRows = await db
    .insert(grades)
    .values([
      { name: "5th Grade", displayOrder: 1 },
      { name: "6th Grade", displayOrder: 2 },
    ])
    .returning();

  for (const grade of gradeRows) {
    for (let u = 1; u <= 2; u++) {
      const [unit] = await db
        .insert(units)
        .values({
          gradeId: grade.id,
          title: `${grade.name} · Unit ${u}`,
          description: `Placeholder unit ${u} for ${grade.name}.`,
          displayOrder: u,
        })
        .returning();

      // 4 ordered tasks, one per type.
      await db.insert(tasks).values(
        TASK_TYPES.map((t, i) => ({
          unitId: unit.id,
          title: t.title,
          type: t.type,
          displayOrder: i + 1,
          content: contentFor(t.type, unit.title),
        })),
      );

      // 5 dummy vocab items.
      await db.insert(vocabItems).values(
        Array.from({ length: 5 }, (_, i) => ({
          unitId: unit.id,
          word: `word${i + 1}`,
          translationHe: `מילה${i + 1}`,
          partOfSpeech: "noun",
          exampleSentence: `A placeholder sentence with word${i + 1}.`,
        })),
      );
    }
  }
  console.log(`  ✓ ${gradeRows.length} grades, 4 units, 16 tasks, 20 vocab items`);

  // --- accounts ---
  console.log("👤 Seeding accounts...");
  const fifthGrade = gradeRows.find((g) => g.displayOrder === 1)!;

  const teacherId = await ensureUser(TEACHER_EMAIL!, "Teacher", "teacher");
  const student1Id = await ensureUser(
    "student1@example.com",
    "Test Student One",
    "student",
  );
  const student2Id = await ensureUser(
    "student2@example.com",
    "Test Student Two",
    "student",
  );

  await db
    .insert(profiles)
    .values([
      { id: teacherId, fullName: "Teacher", role: "teacher", gradeId: null },
      {
        id: student1Id,
        fullName: "Test Student One",
        role: "student",
        gradeId: fifthGrade.id,
      },
      {
        id: student2Id,
        fullName: "Test Student Two",
        role: "student",
        gradeId: fifthGrade.id,
      },
    ])
    .onConflictDoUpdate({
      target: profiles.id,
      set: {
        fullName: sql`excluded.full_name`,
        role: sql`excluded.role`,
        gradeId: sql`excluded.grade_id`,
      },
    });

  console.log(`  ✓ teacher: ${TEACHER_EMAIL}`);
  console.log(`  ✓ students: student1@example.com / student2@example.com (pw: ${SEED_PASSWORD})`);
  console.log("✅ Seed complete.");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  });
