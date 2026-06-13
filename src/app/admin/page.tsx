import Link from "next/link";
import { asc, eq, count } from "drizzle-orm";
import { KeyRound, Users } from "lucide-react";
import { requireTeacher } from "@/lib/auth";
import { db } from "@/db";
import { grades, units } from "@/db/schema";
import { AppShell } from "@/components/layout/app-shell";
import { buttonVariants } from "@/components/ui/button";
import { GradesManager } from "@/components/admin/grades-manager";

export default async function AdminPage() {
  const { user, profile } = await requireTeacher();

  const gradeRows = await db
    .select({
      id: grades.id,
      name: grades.name,
      displayOrder: grades.displayOrder,
      units: count(units.id),
    })
    .from(grades)
    .leftJoin(units, eq(units.gradeId, grades.id))
    .groupBy(grades.id)
    .orderBy(asc(grades.displayOrder));

  return (
    <AppShell user={{ fullName: profile.fullName, email: user.email ?? "" }}>
      <div className="flex flex-col gap-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Admin</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage content, invite codes, and student progress.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/invites"
              className={buttonVariants({ variant: "outline" })}
            >
              <KeyRound className="size-4" />
              Invite codes
            </Link>
            <Link
              href="/admin/students"
              className={buttonVariants({ variant: "outline" })}
            >
              <Users className="size-4" />
              Students
            </Link>
          </div>
        </div>

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Grades
          </h2>
          <GradesManager
            grades={gradeRows.map((g) => ({ ...g, units: Number(g.units) }))}
          />
        </section>
      </div>
    </AppShell>
  );
}
