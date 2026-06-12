import Link from "next/link";
import { asc, eq, sql } from "drizzle-orm";
import { requireTeacher } from "@/lib/auth";
import { db } from "@/db";
import { profiles, grades } from "@/db/schema";
import { getGradeProgression } from "@/lib/queries";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/progression/progress-bar";

export default async function AdminStudentsPage() {
  const { user, profile } = await requireTeacher();

  const studentRows = await db
    .select({
      id: profiles.id,
      fullName: profiles.fullName,
      gradeId: profiles.gradeId,
      gradeName: grades.name,
    })
    .from(profiles)
    .leftJoin(grades, eq(grades.id, profiles.gradeId))
    .where(eq(profiles.role, "student"))
    .orderBy(asc(profiles.fullName));

  const emailRows = await db.execute(sql`select id, email from auth.users`);
  const emailMap = new Map(
    (emailRows as unknown as { id: string; email: string }[]).map((e) => [
      e.id,
      e.email,
    ]),
  );

  const students = await Promise.all(
    studentRows.map(async (s) => {
      let percent = 0;
      let completed = 0;
      let total = 0;
      if (s.gradeId) {
        const p = await getGradeProgression(s.id, s.gradeId);
        percent = p.overall.percent;
        completed = p.overall.completed;
        total = p.overall.total;
      }
      return { ...s, email: emailMap.get(s.id) ?? "", percent, completed, total };
    }),
  );

  return (
    <AppShell user={{ fullName: profile.fullName, email: user.email ?? "" }}>
      <div className="flex flex-col gap-8">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link href="/admin" className="hover:underline">
              Admin
            </Link>{" "}
            / Students
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">
            Students
          </h1>
        </div>

        <div className="flex flex-col gap-2">
          {students.length === 0 ? (
            <p className="text-sm text-muted-foreground">No students yet.</p>
          ) : (
            students.map((s) => (
              <Card
                key={s.id}
                className="flex flex-col gap-3 p-4 shadow-soft-sm sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{s.fullName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {s.email} · {s.gradeName ?? "No grade"}
                  </p>
                </div>
                <div className="w-full sm:w-64">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      {s.completed}/{s.total} tasks
                    </span>
                    <span>{s.percent}%</span>
                  </div>
                  <ProgressBar value={s.percent} className="mt-1" />
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
