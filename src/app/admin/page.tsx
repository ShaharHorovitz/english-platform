import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { requireTeacher } from "@/lib/auth";
import { signOutAction } from "@/lib/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/**
 * Placeholder admin — teacher-only. `requireTeacher` is defense-in-depth behind
 * the proxy role gate. The real admin (CRUD, JSON editor, invite codes,
 * progress) is built in Phase 5.
 */
export default async function AdminPage() {
  const { user } = await requireTeacher();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col justify-center gap-6 px-5 py-12">
      <div className="flex items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-[var(--radius-button)] bg-primary text-primary-foreground">
          <ShieldCheck className="size-5" />
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight">Admin</h1>
      </div>

      <Card className="p-6">
        <p className="text-sm text-muted-foreground">
          Teacher area — signed in as{" "}
          <span className="font-semibold text-foreground">{user.email}</span>.
          The management tools arrive in Phase 5.
        </p>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>
          Back to dashboard
        </Link>
        <form action={signOutAction}>
          <Button variant="ghost" type="submit">
            Sign out
          </Button>
        </form>
      </div>
    </main>
  );
}
