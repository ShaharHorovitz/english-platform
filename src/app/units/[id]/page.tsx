import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser, getProfile } from "@/lib/auth";
import { getUnit, getGrade, getGradeProgression } from "@/lib/queries";
import { AppShell } from "@/components/layout/app-shell";
import { ProgressBar } from "@/components/progression/progress-bar";
import { TaskRow } from "@/components/progression/task-row";

export default async function UnitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const profile = await getProfile(user.id);
  const isTeacher = profile?.role === "teacher";

  const unit = await getUnit(id);
  if (!unit) notFound();
  if (!isTeacher && profile?.gradeId !== unit.gradeId) notFound();

  const progression = await getGradeProgression(user.id, unit.gradeId);
  const node = progression.units.find((u) => u.id === id);
  if (!node) notFound();
  // Locked units aren't navigable for students (they reach here only by URL).
  if (node.state === "locked" && !isTeacher) redirect("/dashboard");

  const grade = await getGrade(unit.gradeId);

  return (
    <AppShell
      user={{ fullName: profile?.fullName ?? "Student", email: user.email ?? "" }}
    >
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">
            <Link href="/dashboard" className="hover:underline">
              Dashboard
            </Link>{" "}
            /{" "}
            <Link href={`/grades/${unit.gradeId}`} className="hover:underline">
              {grade?.name}
            </Link>{" "}
            / {node.title}
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight">
            {node.title}
          </h1>
          {node.description ? (
            <p className="max-w-prose text-muted-foreground">
              {node.description}
            </p>
          ) : null}
          <div className="mt-2 max-w-md">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {node.completedCount}/{node.totalCount} tasks
              </span>
              <span>{node.percent}%</span>
            </div>
            <ProgressBar value={node.percent} className="mt-1" />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {node.tasks.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
