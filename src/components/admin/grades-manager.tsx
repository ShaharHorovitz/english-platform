"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, ChevronRight, X, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormError } from "@/components/ui/form-error";
import {
  createGrade,
  updateGrade,
  deleteGrade,
  type ActionResult,
} from "@/app/admin/actions";

export type GradeRow = { id: string; name: string; displayOrder: number; units: number };

export function GradesManager({ grades }: { grades: GradeRow[] }) {
  const [error, setError] = React.useState<string | null>(null);
  const [editing, setEditing] = React.useState<string | null>(null);
  const [creating, setCreating] = React.useState(false);
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
    <div className="flex flex-col gap-4">
      <FormError message={error} />

      <div className="flex flex-col gap-2">
        {grades.map((g) =>
          editing === g.id ? (
            <GradeForm
              key={g.id}
              initial={g}
              pending={pending}
              onCancel={() => setEditing(null)}
              onSubmit={(v) =>
                run(() => updateGrade(g.id, v), () => setEditing(null))
              }
            />
          ) : (
            <Card
              key={g.id}
              className="flex items-center gap-3 p-4 shadow-soft"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-button)] bg-accent text-sm font-bold text-accent-foreground">
                {g.displayOrder}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{g.name}</p>
                <p className="text-xs text-muted-foreground">
                  {g.units} unit{g.units === 1 ? "" : "s"}
                </p>
              </div>
              <Link
                href={`/admin/grades/${g.id}`}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Units <ChevronRight className="size-4" />
              </Link>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Edit grade"
                onClick={() => {
                  setEditing(g.id);
                  setCreating(false);
                }}
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Delete grade"
                disabled={pending}
                onClick={() => {
                  if (
                    confirm(
                      `Delete "${g.name}" and all its units, tasks, and progress?`,
                    )
                  )
                    run(() => deleteGrade(g.id));
                }}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </Card>
          ),
        )}
      </div>

      {creating ? (
        <GradeForm
          pending={pending}
          onCancel={() => setCreating(false)}
          onSubmit={(v) => run(() => createGrade(v), () => setCreating(false))}
        />
      ) : (
        <Button
          variant="outline"
          className="self-start"
          onClick={() => {
            setCreating(true);
            setEditing(null);
          }}
        >
          <Plus /> New grade
        </Button>
      )}
    </div>
  );
}

function GradeForm({
  initial,
  pending,
  onSubmit,
  onCancel,
}: {
  initial?: { name: string; displayOrder: number };
  pending: boolean;
  onSubmit: (v: { name: string; displayOrder: number }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = React.useState(initial?.name ?? "");
  const [order, setOrder] = React.useState(String(initial?.displayOrder ?? ""));
  return (
    <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
      <div className="flex-1">
        <Label htmlFor="g-name">Grade name</Label>
        <Input
          id="g-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. 7th Grade"
          className="mt-1"
        />
      </div>
      <div className="w-full sm:w-28">
        <Label htmlFor="g-order">Order</Label>
        <Input
          id="g-order"
          type="number"
          value={order}
          onChange={(e) => setOrder(e.target.value)}
          placeholder="3"
          className="mt-1"
        />
      </div>
      <div className="flex gap-2">
        <Button
          onClick={() => onSubmit({ name, displayOrder: Number(order) })}
          disabled={pending || !name || order === ""}
        >
          <Check /> Save
        </Button>
        <Button variant="ghost" size="icon" aria-label="Cancel" onClick={onCancel}>
          <X />
        </Button>
      </div>
    </Card>
  );
}
