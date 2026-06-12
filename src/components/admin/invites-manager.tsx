"use client";

import * as React from "react";
import { KeyRound, Trash2, Copy, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormError } from "@/components/ui/form-error";
import {
  createInviteCode,
  deleteInviteCode,
  type ActionResult,
} from "@/app/admin/actions";
import { cn } from "@/lib/utils";

export type CodeRow = {
  id: string;
  code: string;
  gradeName: string | null;
  emailHint: string | null;
  used: boolean;
};
export type GradeOption = { id: string; name: string };

export function InvitesManager({
  grades,
  codes,
}: {
  grades: GradeOption[];
  codes: CodeRow[];
}) {
  const [error, setError] = React.useState<string | null>(null);
  const [gradeId, setGradeId] = React.useState(grades[0]?.id ?? "");
  const [hint, setHint] = React.useState("");
  const [copied, setCopied] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const run = (fn: () => Promise<ActionResult>, after?: () => void) => {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if ("error" in res) setError(res.error);
      else after?.();
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <FormError message={error} />

      <Card className="flex flex-col gap-3 p-5">
        <p className="font-semibold">Generate an invite code</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Label htmlFor="i-grade">Grade</Label>
            <select
              id="i-grade"
              value={gradeId}
              onChange={(e) => setGradeId(e.target.value)}
              className="mt-1 h-11 w-full rounded-[var(--radius-input)] border border-input bg-card px-3 text-base text-foreground shadow-soft-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring"
            >
              {grades.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <Label htmlFor="i-hint">Email hint (optional)</Label>
            <Input
              id="i-hint"
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              placeholder="student@example.com"
              className="mt-1"
            />
          </div>
          <Button
            onClick={() =>
              run(() => createInviteCode(gradeId, hint), () => setHint(""))
            }
            disabled={pending || !gradeId}
          >
            <KeyRound /> Generate
          </Button>
        </div>
      </Card>

      <div className="flex flex-col gap-2">
        {codes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No invite codes yet.</p>
        ) : (
          codes.map((c) => (
            <Card key={c.id} className="flex items-center gap-3 p-4 shadow-soft-sm">
              <code className="rounded-[var(--radius-input)] bg-muted px-2.5 py-1 font-mono font-bold tracking-wider">
                {c.code}
              </code>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(c.code);
                  setCopied(c.id);
                  setTimeout(() => setCopied(null), 1500);
                }}
                aria-label="Copy code"
                className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent"
              >
                {copied === c.id ? (
                  <Check className="size-4 text-success" />
                ) : (
                  <Copy className="size-4" />
                )}
              </button>
              <div className="min-w-0 flex-1 text-sm">
                <span className="font-medium">{c.gradeName ?? "—"}</span>
                {c.emailHint ? (
                  <span className="text-muted-foreground"> · {c.emailHint}</span>
                ) : null}
              </div>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                  c.used
                    ? "bg-muted text-muted-foreground"
                    : "bg-success/15 text-success",
                )}
              >
                {c.used ? "Used" : "Active"}
              </span>
              {!c.used ? (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Delete code"
                  disabled={pending}
                  onClick={() => run(() => deleteInviteCode(c.id))}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              ) : null}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
