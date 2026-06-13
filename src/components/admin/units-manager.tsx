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
  createUnit,
  updateUnit,
  deleteUnit,
  type ActionResult,
} from "@/app/admin/actions";

export type UnitRow = {
  id: string;
  title: string;
  description: string | null;
  displayOrder: number;
  tasks: number;
};

type Values = { title: string; description?: string; displayOrder: number };

export function UnitsManager({
  gradeId,
  units,
}: {
  gradeId: string;
  units: UnitRow[];
}) {
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
        {units.map((u) =>
          editing === u.id ? (
            <UnitForm
              key={u.id}
              initial={u}
              pending={pending}
              onCancel={() => setEditing(null)}
              onSubmit={(v) =>
                run(() => updateUnit(u.id, gradeId, v), () => setEditing(null))
              }
            />
          ) : (
            <Card key={u.id} className="flex items-center gap-3 p-4 shadow-soft-sm">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-button)] bg-accent text-sm font-bold text-accent-foreground">
                {u.displayOrder}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{u.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {u.tasks} task{u.tasks === 1 ? "" : "s"}
                  {u.description ? ` · ${u.description}` : ""}
                </p>
              </div>
              <Link
                href={`/admin/units/${u.id}`}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Tasks &amp; vocab <ChevronRight className="size-4" />
              </Link>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Edit unit"
                onClick={() => {
                  setEditing(u.id);
                  setCreating(false);
                }}
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Delete unit"
                disabled={pending}
                onClick={() => {
                  if (confirm(`Delete "${u.title}" and its tasks/vocab?`))
                    run(() => deleteUnit(u.id, gradeId));
                }}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </Card>
          ),
        )}
      </div>

      {creating ? (
        <UnitForm
          pending={pending}
          onCancel={() => setCreating(false)}
          onSubmit={(v) =>
            run(() => createUnit(gradeId, v), () => setCreating(false))
          }
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
          <Plus /> New unit
        </Button>
      )}
    </div>
  );
}

function UnitForm({
  initial,
  pending,
  onSubmit,
  onCancel,
}: {
  initial?: UnitRow;
  pending: boolean;
  onSubmit: (v: Values) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = React.useState(initial?.title ?? "");
  const [description, setDescription] = React.useState(
    initial?.description ?? "",
  );
  const [order, setOrder] = React.useState(String(initial?.displayOrder ?? ""));
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <Label htmlFor="u-title">Title</Label>
          <Input
            id="u-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Unit title"
            className="mt-1"
          />
        </div>
        <div className="w-full sm:w-28">
          <Label htmlFor="u-order">Order</Label>
          <Input
            id="u-order"
            type="number"
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            className="mt-1"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="u-desc">Description (optional)</Label>
        <Input
          id="u-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Short description"
          className="mt-1"
        />
      </div>
      <div className="flex gap-2">
        <Button
          onClick={() =>
            onSubmit({ title, description, displayOrder: Number(order) })
          }
          disabled={pending || !title || order === ""}
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
