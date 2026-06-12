import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { requireTeacher } from "@/lib/auth";
import { db } from "@/db";
import { grades, inviteCodes } from "@/db/schema";
import { AppShell } from "@/components/layout/app-shell";
import { InvitesManager } from "@/components/admin/invites-manager";

export default async function AdminInvitesPage() {
  const { user, profile } = await requireTeacher();

  const gradeRows = await db
    .select({ id: grades.id, name: grades.name })
    .from(grades)
    .orderBy(asc(grades.displayOrder));

  const codeRows = await db
    .select({
      id: inviteCodes.id,
      code: inviteCodes.code,
      gradeName: grades.name,
      emailHint: inviteCodes.emailHint,
      usedAt: inviteCodes.usedAt,
    })
    .from(inviteCodes)
    .leftJoin(grades, eq(grades.id, inviteCodes.gradeId))
    .orderBy(asc(inviteCodes.code));

  return (
    <AppShell user={{ fullName: profile.fullName, email: user.email ?? "" }}>
      <div className="flex flex-col gap-8">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link href="/admin" className="hover:underline">
              Admin
            </Link>{" "}
            / Invite codes
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">
            Invite codes
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Each code assigns its grade when a student redeems it at /redeem.
          </p>
        </div>

        <InvitesManager
          grades={gradeRows}
          codes={codeRows.map((c) => ({
            id: c.id,
            code: c.code,
            gradeName: c.gradeName,
            emailHint: c.emailHint,
            used: c.usedAt !== null,
          }))}
        />
      </div>
    </AppShell>
  );
}
