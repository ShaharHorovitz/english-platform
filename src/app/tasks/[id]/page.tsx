import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUser, getProfile } from "@/lib/auth";
import { getTaskWithUnit, getGradeProgression } from "@/lib/queries";
import { taskTypeMeta } from "@/lib/task-type";
import {
  parseTaskContent,
  type VocabStudyContent,
  type VocabPracticeContent,
  type ReadingContent,
  type InContextContent,
} from "@/lib/content-schemas";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { VocabStudy } from "@/components/tasks/vocab-study";
import { VocabPractice } from "@/components/tasks/vocab-practice";
import { Reading } from "@/components/tasks/reading";
import { InContext } from "@/components/tasks/in-context";
import { cn } from "@/lib/utils";

/**
 * Task page — dispatches to the right interactive UI by task.type, reading the
 * validated `content` JSONB. Auth + grade + unlock gated; a completed task can
 * be redone. (Single route by design — the task id already implies its type.)
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
  const unitHref = `/units/${unit.id}`;
  const alreadyCompleted = node.state === "completed";
  const shellUser = {
    fullName: profile?.fullName ?? "Student",
    email: user.email ?? "",
  };

  // Validate content against the type's schema. Cast per branch is sound because
  // parseTaskContent used the schema for exactly this task.type.
  let parsed:
    | VocabStudyContent
    | VocabPracticeContent
    | ReadingContent
    | InContextContent
    | null = null;
  try {
    parsed = parseTaskContent(task.type, task.content);
  } catch {
    parsed = null;
  }

  return (
    <AppShell user={shellUser}>
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="flex flex-col gap-3">
          <Link
            href={unitHref}
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "self-start")}
          >
            <ArrowLeft />
            Back to {unit.title}
          </Link>
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-[var(--radius-button)] bg-accent text-accent-foreground">
              <Icon className="size-5" />
            </span>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">
                {meta.label}
              </h1>
              {alreadyCompleted ? (
                <p className="text-sm font-medium text-success">
                  Completed{node.score != null ? ` · ${node.score}%` : ""} — you
                  can redo it.
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {!parsed ? (
          <Card className="p-6 text-sm text-muted-foreground">
            This task&rsquo;s content isn&rsquo;t set up correctly yet.
          </Card>
        ) : task.type === "vocab_study" ? (
          <VocabStudy
            taskId={id}
            content={parsed as VocabStudyContent}
            unitHref={unitHref}
            alreadyCompleted={alreadyCompleted}
          />
        ) : task.type === "vocab_practice" ? (
          <VocabPractice
            taskId={id}
            content={parsed as VocabPracticeContent}
            unitHref={unitHref}
            alreadyCompleted={alreadyCompleted}
          />
        ) : task.type === "reading" ? (
          <Reading
            taskId={id}
            content={parsed as ReadingContent}
            unitHref={unitHref}
            alreadyCompleted={alreadyCompleted}
          />
        ) : (
          <InContext
            taskId={id}
            content={parsed as InContextContent}
            unitHref={unitHref}
            alreadyCompleted={alreadyCompleted}
          />
        )}
      </div>
    </AppShell>
  );
}
