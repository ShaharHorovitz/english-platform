import Link from "next/link";
import { eq } from "drizzle-orm";
import { ShieldCheck, ArrowRight, PartyPopper } from "lucide-react";
import { requireUser, getProfile } from "@/lib/auth";
import { getGradeProgression } from "@/lib/queries";
import { db } from "@/db";
import { grades } from "@/db/schema";
import { AppShell } from "@/components/layout/app-shell";
import { Greeting } from "@/components/layout/greeting";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { ProgressBar } from "@/components/progression/progress-bar";
import { UnitGrid } from "@/components/progression/unit-grid";

export default async function DashboardPage() {
  const user = await requireUser();
  const profile = await getProfile(user.id);
  const fullName = profile?.fullName ?? "Student";
  const firstName = fullName.split(/\s+/)[0];
  const shellUser = { fullName, email: user.email ?? "" };

  // Teachers have no progression — show the admin entry instead.
  if (profile?.role === "teacher") {
    return (
      <AppShell user={shellUser}>
        <div className="flex flex-col gap-8">
          <h1 className="text-3xl font-extrabold tracking-tight">
            <Greeting firstName={firstName} />
          </h1>
          <Link
            href="/admin"
            className="group flex max-w-xl items-center justify-between gap-4 rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-[var(--radius-button)] bg-primary text-primary-foreground">
                <ShieldCheck className="size-5" />
              </span>
              <span>
                <span className="block font-semibold">Manage content</span>
                <span className="block text-sm text-muted-foreground">
                  Grades, units, tasks, invite codes
                </span>
              </span>
            </span>
            <ArrowRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </AppShell>
    );
  }

  // Student without an assigned grade (shouldn't happen via redeem, but guard).
  if (!profile?.gradeId) {
    return (
      <AppShell user={shellUser}>
        <div className="flex flex-col gap-6">
          <h1 className="text-3xl font-extrabold tracking-tight">
            <Greeting firstName={firstName} />
          </h1>
          <Card className="max-w-xl p-6 text-sm text-muted-foreground">
            You haven&rsquo;t been assigned to a grade yet. Please ask your
            teacher for an invite code.
          </Card>
        </div>
      </AppShell>
    );
  }

  const [grade] = await db
    .select({ name: grades.name })
    .from(grades)
    .where(eq(grades.id, profile.gradeId))
    .limit(1);
  const progression = await getGradeProgression(user.id, profile.gradeId);
  const { overall, nextTask, units } = progression;
  const allDone = nextTask === null && overall.total > 0;

  return (
    <AppShell user={shellUser}>
      <div className="flex flex-col gap-8">
        <h1 className="text-3xl font-extrabold tracking-tight">
          <Greeting firstName={firstName} />
        </h1>

        {/* Progress hero */}
        <Card className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">
              {grade?.name ?? "Your grade"}
            </p>
            <p className="mt-1 text-2xl font-bold tracking-tight">
              {overall.percent}% complete
            </p>
            <div className="mt-3 max-w-md">
              <ProgressBar value={overall.percent} />
              <p className="mt-1.5 text-xs text-muted-foreground">
                {overall.completed} of {overall.total} tasks done
              </p>
            </div>
          </div>

          {allDone ? (
            <span className="inline-flex items-center gap-2 rounded-[var(--radius-button)] bg-success px-4 py-2.5 text-sm font-semibold text-success-foreground">
              <PartyPopper className="size-4" />
              All caught up!
            </span>
          ) : nextTask ? (
            <Link
              href={`/units/${nextTask.unitId}`}
              className={buttonVariants({ size: "lg" })}
            >
              {overall.completed > 0 ? "Continue" : "Start learning"}
              <ArrowRight />
            </Link>
          ) : null}
        </Card>

        {/* Units */}
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Units
          </h2>
          <UnitGrid units={units} />
        </section>
      </div>
    </AppShell>
  );
}
