import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUser, getProfile } from "@/lib/auth";
import { getTaskWithUnit, getGradeProgression } from "@/lib/queries";
import { taskTypeMeta } from "@/lib/task-type";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

/**
 * Task page — Phase 3 stub. Auth + grade + unlock gated (a student can't open a
 * locked task by URL). Phase 4 replaces the placeholder card with the real
 * task UI for each type, reading from tasks.content.
 */
export default async function TaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const profile = await getProfile(user.id);
  const isTeacher = profile?.role === "teacher";

  const res = await getTaskWithUnit(id);
  if (!res) notFound();
  const { task, unit } = res;
  if (!isTeacher && profile?.gradeId !== unit.gradeId) notFound();

  const progression = await getGradeProgression(user.id, unit.gradeId);
  const node = progression.units
    .flatMap((u) => u.tasks)
    .find((t) => t.id === id);
  if (!node) notFound();
  if (node.state === "locked" && !isTeacher) redirect(`/units/${unit.id}`);

  const meta = taskTypeMeta[task.type];
  const Icon = meta.icon;

  return (
    <AppShell
      user={{ fullName: profile?.fullName ?? "Student", email: user.email ?? "" }}
    >
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <Link
          href={`/units/${unit.id}`}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          <ArrowLeft />
          Back to {unit.title}
        </Link>

        <Card className="flex flex-col items-center gap-4 p-10 text-center">
          <span className="flex size-14 items-center justify-center rounded-[var(--radius-card)] bg-accent text-accent-foreground">
            <Icon className="size-7" />
          </span>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              {meta.label}
            </h1>
            <p className="mx-auto mt-2 max-w-sm text-muted-foreground text-pretty">
              This task type is built in Phase 4 — progression, locking, and
              navigation already work around it.
            </p>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
