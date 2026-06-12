import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq, count } from "drizzle-orm";
import { requireTeacher } from "@/lib/auth";
import { getGrade } from "@/lib/queries";
import { db } from "@/db";
import { units, tasks } from "@/db/schema";
import { AppShell } from "@/components/layout/app-shell";
import { UnitsManager } from "@/components/admin/units-manager";

export default async function AdminGradePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, profile } = await requireTeacher();

  const grade = await getGrade(id);
  if (!grade) notFound();

  const unitRows = await db
    .select({
      id: units.id,
      title: units.title,
      description: units.description,
      displayOrder: units.displayOrder,
      tasks: count(tasks.id),
    })
    .from(units)
    .leftJoin(tasks, eq(tasks.unitId, units.id))
    .where(eq(units.gradeId, id))
    .groupBy(units.id)
    .orderBy(asc(units.displayOrder));

  return (
    <AppShell user={{ fullName: profile.fullName, email: user.email ?? "" }}>
      <div className="flex flex-col gap-8">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link href="/admin" className="hover:underline">
              Admin
            </Link>{" "}
            / {grade.name}
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">
            {grade.name}
          </h1>
        </div>

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Units
          </h2>
          <UnitsManager
            gradeId={id}
            units={unitRows.map((u) => ({ ...u, tasks: Number(u.tasks) }))}
          />
        </section>
      </div>
    </AppShell>
  );
}
