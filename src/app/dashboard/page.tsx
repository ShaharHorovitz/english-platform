import Link from "next/link";
import { eq } from "drizzle-orm";
import { ShieldCheck } from "lucide-react";
import { requireUser, getProfile } from "@/lib/auth";
import { signOutAction } from "@/lib/actions";
import { db } from "@/db";
import { grades } from "@/db/schema";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/**
 * Placeholder dashboard — proves auth + session. The real dashboard (current
 * grade, progress bar, Continue CTA, unit grid) is built in Phase 3.
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

  const isTeacher = profile?.role === "teacher";

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col justify-center gap-6 px-5 py-12">
      <div>
        <p className="text-sm font-medium text-muted-foreground">
          Signed in as {user.email}
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">
          Hi {profile?.fullName ?? "there"} 👋
        </h1>
      </div>

      <Card className="p-6">
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-muted-foreground">Role</dt>
            <dd className="font-semibold capitalize">{profile?.role ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Grade</dt>
            <dd className="font-semibold">{gradeName ?? "—"}</dd>
          </div>
        </dl>
        <p className="mt-4 text-sm text-muted-foreground">
          Placeholder dashboard — the real one arrives in Phase 3.
        </p>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        {isTeacher ? (
          <Link href="/admin" className={buttonVariants()}>
            <ShieldCheck />
            Go to admin
          </Link>
        ) : null}
        <form action={signOutAction}>
          <Button variant="outline" type="submit">
            Sign out
          </Button>
        </form>
      </div>
    </main>
  );
}
