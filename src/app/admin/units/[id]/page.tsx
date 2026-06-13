import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { requireTeacher } from "@/lib/auth";
import { getUnit, getGrade } from "@/lib/queries";
import { db } from "@/db";
import { tasks, vocabItems } from "@/db/schema";
import { AppShell } from "@/components/layout/app-shell";
import { TasksManager } from "@/components/admin/tasks-manager";
import { VocabManager } from "@/components/admin/vocab-manager";

export default async function AdminUnitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, profile } = await requireTeacher();

  const unit = await getUnit(id);
  if (!unit) notFound();
  const grade = await getGrade(unit.gradeId);

  const taskRows = await db
    .select()
    .from(tasks)
    .where(eq(tasks.unitId, id))
    .orderBy(asc(tasks.displayOrder));
  const vocabRows = await db
    .select()
    .from(vocabItems)
    .where(eq(vocabItems.unitId, id))
    .orderBy(asc(vocabItems.word));

  return (
    <AppShell user={{ fullName: profile.fullName, email: user.email ?? "" }}>
      <div className="flex flex-col gap-8">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link href="/admin" className="hover:underline">
              Admin
            </Link>{" "}
            /{" "}
            <Link
              href={`/admin/grades/${unit.gradeId}`}
              className="hover:underline"
            >
              {grade?.name}
            </Link>{" "}
            / {unit.title}
          </p>
          <h1 className="mt-1 text-3xl font-display font-semibold tracking-tight">
            {unit.title}
          </h1>
        </div>

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Tasks
          </h2>
          <TasksManager
            unitId={id}
            tasks={taskRows.map((t) => ({
              id: t.id,
              title: t.title,
              type: t.type,
              displayOrder: t.displayOrder,
              content: t.content,
            }))}
          />
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Vocabulary
          </h2>
          <VocabManager
            unitId={id}
            vocab={vocabRows.map((v) => ({
              id: v.id,
              word: v.word,
              translationHe: v.translationHe,
              partOfSpeech: v.partOfSpeech,
              exampleSentence: v.exampleSentence,
            }))}
          />
        </section>
      </div>
    </AppShell>
  );
}
