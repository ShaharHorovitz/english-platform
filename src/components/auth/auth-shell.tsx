import * as React from "react";
import { GraduationCap } from "lucide-react";
import { Card } from "@/components/ui/card";

/** Centered branded card used by /login and /redeem. */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-6 py-12">
      <Card className="w-full max-w-sm p-8 shadow-lifted">
        <div className="mb-8 flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-[var(--radius-button)] bg-foreground text-background shadow-soft">
            <GraduationCap className="size-5" />
          </span>
          <span className="text-lg font-extrabold tracking-tight">
            English Platform
          </span>
        </div>

        <h1 className="font-display text-3xl font-semibold tracking-tight">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        ) : null}

        <div className="mt-6">{children}</div>

        {footer ? (
          <div className="mt-6 text-center text-sm text-muted-foreground">
            {footer}
          </div>
        ) : null}
      </Card>
    </main>
  );
}
