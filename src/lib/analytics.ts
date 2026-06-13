import { sql } from "drizzle-orm";
import { db } from "@/db";

/** Per-student analytics aggregates for /admin/students/[id]. Day buckets use
 * UTC to match Postgres to_char on timestamptz. */

export interface StudentAnalytics {
  overview: {
    tasksCompleted: number;
    totalAttempts: number;
    successRate: number; // 0–100
    totalTimeSeconds: number;
    streakDays: number;
    lastActive: string | null;
  };
  units: {
    id: string;
    title: string;
    attempts: number;
    passRate: number;
    avgScore: number | null;
    avgTimeSeconds: number | null;
  }[];
  struggleTasks: {
    id: string;
    title: string;
    type: string;
    fails: number;
    attempts: number;
  }[];
  struggleWords: {
    word: string;
    translationHe: string;
    correct: number;
    incorrect: number;
    seen: number;
    masteryLevel: number;
  }[];
  heatmap: { date: string; count: number }[]; // last 35 days
  trend: { date: string; rate: number }[]; // rolling 7-day success rate
}

const utcDay = (d: Date) => d.toISOString().slice(0, 10);
const minusDays = (key: string, k: number) => {
  const d = new Date(`${key}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - k);
  return utcDay(d);
};
function lastNDays(n: number): string[] {
  const today = utcDay(new Date());
  return Array.from({ length: n }, (_, i) => minusDays(today, n - 1 - i));
}

export async function getStudentAnalytics(
  userId: string,
): Promise<StudentAnalytics> {
  const [ov] = (await db.execute(sql`
    select
      count(*)::int as total_attempts,
      count(*) filter (where passed)::int as passed_attempts,
      coalesce(sum(time_spent_seconds), 0)::int as total_time,
      to_char(max(completed_at), 'YYYY-MM-DD') as last_active
    from task_attempts where user_id = ${userId}
  `)) as unknown as {
    total_attempts: number;
    passed_attempts: number;
    total_time: number;
    last_active: string | null;
  }[];

  const [tc] = (await db.execute(sql`
    select count(*)::int as n from user_progress
    where user_id = ${userId} and status = 'completed'
  `)) as unknown as { n: number }[];

  const unitRows = (await db.execute(sql`
    select u.id, u.title,
      count(ta.id)::int as attempts,
      count(*) filter (where ta.passed)::int as passed,
      round(avg(ta.score))::int as avg_score,
      round(avg(ta.time_spent_seconds))::int as avg_time
    from task_attempts ta
    join tasks t on t.id = ta.task_id
    join units u on u.id = t.unit_id
    where ta.user_id = ${userId}
    group by u.id, u.title, u.display_order
    order by u.display_order
  `)) as unknown as {
    id: string;
    title: string;
    attempts: number;
    passed: number;
    avg_score: number | null;
    avg_time: number | null;
  }[];

  const struggleTasks = (await db.execute(sql`
    select t.id, t.title, t.type,
      count(*) filter (where not ta.passed)::int as fails,
      count(*)::int as attempts
    from task_attempts ta join tasks t on t.id = ta.task_id
    where ta.user_id = ${userId}
    group by t.id, t.title, t.type
    having count(*) filter (where not ta.passed) > 0
    order by fails desc, attempts desc
    limit 8
  `)) as unknown as {
    id: string;
    title: string;
    type: string;
    fails: number;
    attempts: number;
  }[];

  const struggleWords = (await db.execute(sql`
    select v.word, v.translation_he,
      vm.times_correct, vm.times_incorrect, vm.times_seen, vm.mastery_level
    from vocab_mastery vm join vocab_items v on v.id = vm.vocab_item_id
    where vm.user_id = ${userId} and vm.times_seen > 0
    order by (vm.times_correct::float / nullif(vm.times_seen, 0)) asc,
             vm.times_incorrect desc
    limit 12
  `)) as unknown as {
    word: string;
    translation_he: string;
    times_correct: number;
    times_incorrect: number;
    times_seen: number;
    mastery_level: number;
  }[];

  const daily = (await db.execute(sql`
    select to_char(completed_at, 'YYYY-MM-DD') as day,
      count(*)::int as attempts,
      count(*) filter (where passed)::int as passed
    from task_attempts
    where user_id = ${userId} and completed_at >= (now() - interval '45 days')
    group by day
  `)) as unknown as { day: string; attempts: number; passed: number }[];

  const byDay = new Map(daily.map((d) => [d.day, d]));

  // streak: consecutive active days ending today or yesterday
  const active = new Set(daily.filter((d) => d.attempts > 0).map((d) => d.day));
  let streakDays = 0;
  let cursor = utcDay(new Date());
  if (!active.has(cursor)) cursor = minusDays(cursor, 1); // allow "yesterday"
  while (active.has(cursor)) {
    streakDays += 1;
    cursor = minusDays(cursor, 1);
  }

  const heatmap = lastNDays(35).map((date) => ({
    date,
    count: byDay.get(date)?.attempts ?? 0,
  }));

  const trend: { date: string; rate: number }[] = [];
  for (const date of lastNDays(21)) {
    let a = 0;
    let p = 0;
    for (let k = 0; k < 7; k++) {
      const v = byDay.get(minusDays(date, k));
      if (v) {
        a += v.attempts;
        p += v.passed;
      }
    }
    if (a > 0) trend.push({ date, rate: Math.round((p / a) * 100) });
  }

  const totalAttempts = ov?.total_attempts ?? 0;
  return {
    overview: {
      tasksCompleted: tc?.n ?? 0,
      totalAttempts,
      successRate:
        totalAttempts > 0
          ? Math.round(((ov?.passed_attempts ?? 0) / totalAttempts) * 100)
          : 0,
      totalTimeSeconds: ov?.total_time ?? 0,
      streakDays,
      lastActive: ov?.last_active ?? null,
    },
    units: unitRows.map((u) => ({
      id: u.id,
      title: u.title,
      attempts: u.attempts,
      passRate: u.attempts > 0 ? Math.round((u.passed / u.attempts) * 100) : 0,
      avgScore: u.avg_score,
      avgTimeSeconds: u.avg_time,
    })),
    struggleTasks,
    struggleWords: struggleWords.map((w) => ({
      word: w.word,
      translationHe: w.translation_he,
      correct: w.times_correct,
      incorrect: w.times_incorrect,
      seen: w.times_seen,
      masteryLevel: w.mastery_level,
    })),
    heatmap,
    trend,
  };
}
