import Link from "next/link";
import { eq } from "drizzle-orm";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { requireUser, getProfile } from "@/lib/auth";
import { db } from "@/db";
import { grades } from "@/db/schema";
import { AppShell } from "@/components/layout/app-shell";
import { Greeting } from "@/components/layout/greeting";
import { Card } from "@/components/ui/card";

/**
 * Dashboard shell + summary. The real progression UI (current grade, progress
 * bar, Continue CTA, unit grid) lands in Phase 3.
 */
export default async function DashboardPage() {
  const user = await requireUser();
  const profile = await getProfile(user.id);

  let gradeName: string | null = null;
  if (profile?.gradeId) {
    const [g] = await db
      .select({ name: grades.name })
      .from(grades)
      .where(eq(grades.id, profile.gradeId))
      .limit(1);
    gradeName = g?.name ?? null;
  }

  const fullName = profile?.fullName ?? "Student";
  const firstName = fullName.split(/\s+/)[0];
  const isTeacher = profile?.role === "teacher";

  return (
    <AppShell user={{ fullName, email: user.email ?? "" }}>
      <div className="flex flex-col gap-8">
        <h1 className="text-3xl font-extrabold tracking-tight">
          <Greeting firstName={firstName} />
        </h1>

        <Card className="p-6">
          <dl className="grid grid-cols-2 gap-6 text-sm sm:max-w-md">
            <div>
              <dt className="text-muted-foreground">Role</dt>
              <dd className="mt-0.5 font-semibold capitalize">
                {profile?.role ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Grade</dt>
              <dd className="mt-0.5 font-semibold">{gradeName ?? "—"}</dd>
            </div>
          </dl>
        </Card>

        {isTeacher ? (
          <Link
            href="/admin"
            className="group flex items-center justify-between gap-4 rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
        ) : null}
      </div>
    </AppShell>
  );
}
