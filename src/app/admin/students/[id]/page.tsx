import * as React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { requireTeacher } from "@/lib/auth";
import { getStudentAnalytics } from "@/lib/analytics";
import { db } from "@/db";
import { profiles, grades } from "@/db/schema";
import { taskTypeMeta } from "@/lib/task-type";
import { MASTERY_LABELS } from "@/lib/mastery";
import type { TaskTypeKey } from "@/lib/content-schemas";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { ActivityHeatmap } from "@/components/admin/activity-heatmap";
import { TrendChart } from "@/components/admin/trend-chart";
import { cn } from "@/lib/utils";

function fmtTime(seconds: number | null): string {
  if (!seconds) return "—";
  if (seconds < 60) return `${seconds}s`;
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}
function fmtDate(d: string | null): string {
  if (!d) return "—";
  return new Date(`${d}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <Card className="p-6 shadow-soft">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-2xl font-extrabold tracking-tight">{value}</p>
      {sub ? <p className="text-xs text-muted-foreground">{sub}</p> : null}
    </Card>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </h2>
  );
}

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, profile } = await requireTeacher();

  const [student] = await db
    .select({
      id: profiles.id,
      fullName: profiles.fullName,
      role: profiles.role,
      gradeName: grades.name,
    })
    .from(profiles)
    .leftJoin(grades, eq(grades.id, profiles.gradeId))
    .where(eq(profiles.id, id))
    .limit(1);
  if (!student || student.role !== "student") notFound();

  const [emailRow] = (await db.execute(
    sql`select email from auth.users where id = ${id}`,
  )) as unknown as { email: string }[];
  const a = await getStudentAnalytics(id);

  return (
    <AppShell user={{ fullName: profile.fullName, email: user.email ?? "" }}>
      <div className="flex flex-col gap-8">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link href="/admin" className="hover:underline">
              Admin
            </Link>{" "}
            /{" "}
            <Link href="/admin/students" className="hover:underline">
              Students
            </Link>{" "}
            / {student.fullName}
          </p>
          <h1 className="mt-1 text-3xl font-display font-semibold tracking-tight">
            {student.fullName}
          </h1>
          <p className="text-sm text-muted-foreground">
            {emailRow?.email ?? ""} · {student.gradeName ?? "No grade"}
          </p>
        </div>

        {/* Overview */}
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Stat label="Tasks done" value={String(a.overview.tasksCompleted)} />
          <Stat
            label="Success rate"
            value={`${a.overview.successRate}%`}
            sub={`${a.overview.totalAttempts} attempts`}
          />
          <Stat label="Practice time" value={fmtTime(a.overview.totalTimeSeconds)} />
          <Stat
            label="Streak"
            value={`${a.overview.streakDays} day${a.overview.streakDays === 1 ? "" : "s"}`}
          />
          <Stat label="Last active" value={fmtDate(a.overview.lastActive)} />
        </section>

        {/* Activity + trend */}
        <section className="grid gap-4 lg:grid-cols-2">
          <Card className="flex flex-col gap-4 p-6">
            <SectionTitle>Activity · last 35 days</SectionTitle>
            <ActivityHeatmap data={a.heatmap} />
          </Card>
          <Card className="flex flex-col gap-4 p-6">
            <SectionTitle>Success rate · rolling 7-day</SectionTitle>
            <TrendChart data={a.trend} />
          </Card>
        </section>

        {/* Per-unit breakdown */}
        <section className="flex flex-col gap-4">
          <SectionTitle>Per-unit breakdown</SectionTitle>
          <Card className="p-2 shadow-soft sm:p-4">
            {a.units.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">No attempts yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-3 py-2 font-semibold">Unit</th>
                      <th className="px-3 py-2 font-semibold">Attempts</th>
                      <th className="px-3 py-2 font-semibold">Pass rate</th>
                      <th className="px-3 py-2 font-semibold">Avg score</th>
                      <th className="px-3 py-2 font-semibold">Avg time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {a.units.map((u) => (
                      <tr key={u.id} className="border-b border-border/50 last:border-0">
                        <td className="px-3 py-3 font-medium">{u.title}</td>
                        <td className="px-3 py-3">{u.attempts}</td>
                        <td className="px-3 py-3">{u.passRate}%</td>
                        <td className="px-3 py-3">
                          {u.avgScore != null ? `${u.avgScore}%` : "—"}
                        </td>
                        <td className="px-3 py-3">{fmtTime(u.avgTimeSeconds)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </section>

        {/* Struggle spots */}
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <SectionTitle>Tasks with the most failed attempts</SectionTitle>
            {a.struggleTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No failed attempts — nice.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {a.struggleTasks.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between gap-3 rounded-[var(--radius-input)] border border-border bg-card p-3 shadow-soft"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{t.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {taskTypeMeta[t.type as TaskTypeKey].label} ·{" "}
                        {t.attempts} attempts
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-destructive/15 px-3 py-1 text-xs font-semibold text-destructive">
                      {t.fails} fail{t.fails === 1 ? "" : "s"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <SectionTitle>Words to review</SectionTitle>
            {a.struggleWords.length === 0 ? (
              <p className="text-sm text-muted-foreground">No word data yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {a.struggleWords.map((w, i) => {
                  const ratio =
                    w.seen > 0 ? Math.round((w.correct / w.seen) * 100) : 0;
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-3 rounded-[var(--radius-input)] border border-border bg-card p-3 shadow-soft"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {w.word}{" "}
                          <span
                            className="text-muted-foreground"
                            dir="rtl"
                            lang="he"
                          >
                            {w.translationHe}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {MASTERY_LABELS[w.masteryLevel] ?? "New"} ·{" "}
                          {w.correct}/{w.seen} correct
                        </p>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-3 py-1 text-xs font-semibold",
                          ratio < 50
                            ? "bg-destructive/15 text-destructive"
                            : ratio < 75
                              ? "bg-streak/20 text-foreground"
                              : "bg-success/15 text-success",
                        )}
                      >
                        {ratio}%
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
