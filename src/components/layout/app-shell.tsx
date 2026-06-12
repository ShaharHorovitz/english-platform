import * as React from "react";
import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { ProfileMenu } from "./profile-menu";

/**
 * Shared app shell: sticky top nav (brand left, profile menu right) + a
 * left-aligned max-w-7xl content container. Used by /dashboard, /admin, and the
 * future /grades, /units, /tasks pages. /login and /redeem do NOT use this.
 */
export function AppShell({
  user,
  children,
}: {
  user: { fullName: string; email: string };
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-50 focus:rounded-[var(--radius-input)] focus:bg-card focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:shadow-soft-md focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 h-16 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 rounded-[var(--radius-input)] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <span className="flex size-9 items-center justify-center rounded-[var(--radius-button)] bg-primary text-primary-foreground shadow-soft-sm">
              <GraduationCap className="size-5" />
            </span>
            <span className="text-base font-extrabold tracking-tight">
              English Platform
            </span>
          </Link>

          <ProfileMenu name={user.fullName} email={user.email} />
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
        {children}
      </main>
    </div>
  );
}
