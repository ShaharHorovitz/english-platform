import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser, getProfile } from "@/lib/auth";
import { getGrade, getGradeProgression } from "@/lib/queries";
import { AppShell } from "@/components/layout/app-shell";
import { ProgressBar } from "@/components/progression/progress-bar";
import { UnitGrid } from "@/components/progression/unit-grid";

export default async function GradePage({
  params,
}: {
  params: Promise<{ grade: string }>;
}) {
  const { grade: gradeId } = await params;
  const user = await requireUser();
  const profile = await getProfile(user.id);
  const isTeacher = profile?.role === "teacher";

  // Students may only view their own grade (RLS-equivalent guard at the route).
  if (!isTeacher && profile?.gradeId !== gradeId) notFound();

  const grade = await getGrade(gradeId);
  if (!grade) notFound();

  const progression = await getGradeProgression(user.id, gradeId);

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
            / {grade.name}
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight">
            {grade.name}
          </h1>
          <div className="mt-2 max-w-md">
            <ProgressBar value={progression.overall.percent} />
            <p className="mt-1.5 text-xs text-muted-foreground">
              {progression.overall.completed} of {progression.overall.total}{" "}
              tasks done
            </p>
          </div>
        </div>

        <UnitGrid units={progression.units} />
      </div>
    </AppShell>
  );
}
