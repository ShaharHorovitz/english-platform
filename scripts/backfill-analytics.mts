/**
 * DEV-ONLY backfill for analytics. Generates synthetic task_attempts and
 * vocab_mastery (and a richer user_progress spread for the test students) so
 * the /admin/students/[id] detail view has data to render during development.
 *
 * NOT for production. Run with: npm run db:backfill:analytics
 * Idempotent: wipes the test students' progress/attempts/mastery, then regenerates.
 */
import { config } from "dotenv";
config({ path: ".env.local", quiet: true });

const { db } = await import("../src/db/index.ts");
const {
  units,
  tasks,
  vocabItems,
  userProgress,
  taskAttempts,
  vocabMastery,
} = await import("../src/db/schema.ts");
const { eq, asc, inArray, sql } = await import("drizzle-orm");
const { computeMasteryLevel } = await import("../src/lib/mastery.ts");

const rint = (a: number, b: number) =>
  a + Math.floor(Math.random() * (b - a + 1));
const pick = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
const daysAgo = (d: number, hour = rint(8, 20)) => {
  const t = new Date();
  t.setDate(t.getDate() - d);
  t.setHours(hour, rint(0, 59), 0, 0);
  return t;
};

async function userId(email: string) {
  const r = await db.execute(
    sql`select id from auth.users where email = ${email}`,
  );
  return (r as unknown as { id: string }[])[0]?.id ?? null;
}

const s1 = await userId("student1@example.com");
const s2 = await userId("student2@example.com");
if (!s1) throw new Error("student1 not found");

// 5th grade units (display order 1) with tasks + vocab
const g5 = (
  await db.execute(sql`select id from grades where display_order = 1`)
)[0] as unknown as { id: string };
const unitRows = await db
  .select()
  .from(units)
  .where(eq(units.gradeId, g5.id))
  .orderBy(asc(units.displayOrder));
const unitIds = unitRows.map((u) => u.id);
const taskRows = await db
  .select()
  .from(tasks)
  .where(inArray(tasks.unitId, unitIds))
  .orderBy(asc(tasks.displayOrder));
const vocabRows = await db
  .select()
  .from(vocabItems)
  .where(inArray(vocabItems.unitId, unitIds));

const tasksByUnit = (uid: string) =>
  taskRows.filter((t) => t.unitId === uid).sort((a, b) => a.displayOrder - b.displayOrder);

// Reset the test students
for (const uid of [s1, s2].filter(Boolean) as string[]) {
  await db.delete(taskAttempts).where(eq(taskAttempts.userId, uid));
  await db.delete(vocabMastery).where(eq(vocabMastery.userId, uid));
  await db.delete(userProgress).where(eq(userProgress.userId, uid));
}

type ProgPlan = { taskId: string; type: string; status: "completed" | "in_progress" };

// Build a progression-valid plan: student1 finished unit 1, partway through unit 2.
function planFor(which: "rich" | "light"): ProgPlan[] {
  const plan: ProgPlan[] = [];
  if (which === "rich") {
    const u1 = tasksByUnit(unitIds[0]);
    u1.forEach((t) => plan.push({ taskId: t.id, type: t.type, status: "completed" }));
    const u2 = tasksByUnit(unitIds[1]);
    if (u2[0]) plan.push({ taskId: u2[0].id, type: u2[0].type, status: "completed" });
    if (u2[1]) plan.push({ taskId: u2[1].id, type: u2[1].type, status: "completed" });
    if (u2[2]) plan.push({ taskId: u2[2].id, type: u2[2].type, status: "in_progress" });
  } else {
    const u1 = tasksByUnit(unitIds[0]);
    if (u1[0]) plan.push({ taskId: u1[0].id, type: u1[0].type, status: "completed" });
    if (u1[1]) plan.push({ taskId: u1[1].id, type: u1[1].type, status: "in_progress" });
  }
  return plan;
}

async function seedUser(uid: string, which: "rich" | "light") {
  const plan = planFor(which);
  for (const p of plan) {
    const graded = p.type !== "vocab_study";
    let bestScore: number | null = null;
    let attemptN = 0;
    const baseDay = rint(6, 28); // task first attempted this many days ago

    if (p.status === "completed") {
      const fails = graded ? rint(0, 2) : 0;
      for (let f = 0; f < fails; f++) {
        attemptN++;
        const day = Math.max(1, baseDay - f);
        const time = rint(40, 320);
        const completedAt = daysAgo(day);
        const score = rint(35, 65);
        await db.insert(taskAttempts).values({
          userId: uid,
          taskId: p.taskId,
          attemptNumber: attemptN,
          startedAt: new Date(completedAt.getTime() - time * 1000),
          completedAt,
          timeSpentSeconds: time,
          score,
          passed: false,
          redoCount: f,
        });
      }
      // passing attempt
      attemptN++;
      const time = rint(40, 320);
      const completedAt = daysAgo(Math.max(1, baseDay - fails));
      bestScore = graded ? rint(75, 100) : null;
      await db.insert(taskAttempts).values({
        userId: uid,
        taskId: p.taskId,
        attemptNumber: attemptN,
        startedAt: new Date(completedAt.getTime() - time * 1000),
        completedAt,
        timeSpentSeconds: time,
        score: bestScore,
        passed: true,
        redoCount: fails,
      });
      await db.insert(userProgress).values({
        userId: uid,
        taskId: p.taskId,
        status: "completed",
        score: bestScore,
        attempts: attemptN,
        completedAt,
      });
    } else {
      // in progress: a couple of unsuccessful tries
      const tries = graded ? rint(1, 2) : 1;
      for (let i = 0; i < tries; i++) {
        attemptN++;
        const time = rint(30, 240);
        const day = Math.max(1, baseDay - i);
        const completedAt = graded ? daysAgo(day) : null;
        await db.insert(taskAttempts).values({
          userId: uid,
          taskId: p.taskId,
          attemptNumber: attemptN,
          startedAt: daysAgo(day),
          completedAt,
          timeSpentSeconds: graded ? time : null,
          score: graded ? rint(30, 65) : null,
          passed: false,
          redoCount: i,
        });
      }
      await db.insert(userProgress).values({
        userId: uid,
        taskId: p.taskId,
        status: "in_progress",
        score: null,
        attempts: attemptN,
        completedAt: null,
      });
    }
  }

  // vocab_mastery for vocab in the units this user engaged with
  const touchedUnits =
    which === "rich" ? [unitIds[0], unitIds[1]] : [unitIds[0]];
  const items = vocabRows.filter((v) => touchedUnits.includes(v.unitId));
  // make ~30% of words "struggle" words
  for (const item of items) {
    const struggle = Math.random() < 0.3;
    const seen = rint(2, 12);
    const ratio = struggle ? Math.random() * 0.35 : 0.55 + Math.random() * 0.45;
    const correct = Math.min(seen, Math.round(seen * ratio));
    const incorrect = seen - correct;
    const lastSeen = daysAgo(rint(1, 20));
    await db.insert(vocabMastery).values({
      userId: uid,
      vocabItemId: item.id,
      timesSeen: seen,
      timesCorrect: correct,
      timesIncorrect: incorrect,
      masteryLevel: computeMasteryLevel(seen, correct),
      lastSeenAt: lastSeen,
      lastCorrectAt: correct > 0 ? lastSeen : null,
    });
  }
}

await seedUser(s1, "rich");
if (s2) await seedUser(s2, "light");

const counts = await db.execute(sql`
  select
    (select count(*) from task_attempts) as attempts,
    (select count(*) from vocab_mastery) as mastery,
    (select count(*) from user_progress) as progress`);
console.log("backfill done:", JSON.stringify(counts));
process.exit(0);
