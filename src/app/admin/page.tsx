import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireTeacher } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

/**
 * Admin shell — teacher-only (`requireTeacher` is defense-in-depth behind the
 * proxy role gate). The real management tools land in Phase 5.
 */
export default async function AdminPage() {
  const { user, profile } = await requireTeacher();

  return (
    <AppShell user={{ fullName: profile.fullName, email: user.email ?? "" }}>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold tracking-tight">Admin</h1>
          <p className="text-sm text-muted-foreground">
            Manage grades, units, tasks, and invite codes.
          </p>
        </div>

        <Card className="p-6">
          <p className="text-sm text-muted-foreground">
            The management tools (CRUD, JSON content editor, invite codes,
            per-student progress) arrive in Phase 5.
          </p>
        </Card>

        <div>
          <Link
            href="/dashboard"
            className={buttonVariants({ variant: "outline" })}
          >
            <ArrowLeft />
            Back to dashboard
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
