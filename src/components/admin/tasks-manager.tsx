"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, X, Check, Eye, FileJson } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormError } from "@/components/ui/form-error";
import { taskTypeMeta } from "@/lib/task-type";
import {
  taskContentSchemas,
  type TaskTypeKey,
} from "@/lib/content-schemas";
import {
  createTask,
  updateTask,
  deleteTask,
  type ActionResult,
} from "@/app/admin/actions";
import { cn } from "@/lib/utils";

export type TaskRow = {
  id: string;
  title: string;
  type: TaskTypeKey;
  displayOrder: number;
  content: unknown;
};

const TYPE_ORDER: TaskTypeKey[] = [
  "vocab_study",
  "vocab_practice",
  "reading",
  "in_context",
];

const TEMPLATES: Record<TaskTypeKey, unknown> = {
  vocab_study: {
    cards: [
      { word: "word1", translation: "מילה1", example: "An example with word1." },
    ],
  },
  vocab_practice: {
    exercises: [
      {
        type: "multiple_choice",
        question: "Which word means מילה1?",
        options: ["word1", "word2", "word3"],
        answer: 0,
      },
      { type: "fill_in", sentence: "I ___ home.", blank_answer: "go" },
      {
        type: "matching",
        pairs: [
          { left: "word1", right: "מילה1" },
          { left: "word2", right: "מילה2" },
        ],
      },
    ],
  },
  reading: {
    passage: "Your reading passage goes here.",
    questions: [
      { question: "What is the passage about?", options: ["A", "B"], answer: 0 },
    ],
  },
  in_context: {
    items: [
      {
        word: "word1",
        prompt: "Write a sentence using word1.",
        accepted_answers: ["word1"],
      },
    ],
  },
};

const pretty = (v: unknown) => JSON.stringify(v, null, 2);

export function TasksManager({
  unitId,
  tasks,
}: {
  unitId: string;
  tasks: TaskRow[];
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
        {tasks.map((t) =>
          editing === t.id ? (
            <TaskForm
              key={t.id}
              initial={t}
              pending={pending}
              onCancel={() => setEditing(null)}
              onSubmit={(v) =>
                run(() => updateTask(t.id, unitId, v), () => setEditing(null))
              }
            />
          ) : (
            <Card key={t.id} className="flex items-center gap-3 p-4 shadow-soft">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-button)] bg-accent text-sm font-bold text-accent-foreground">
                {t.displayOrder}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{t.title}</p>
                <p className="text-xs text-muted-foreground">
                  {taskTypeMeta[t.type].label}
                </p>
              </div>
              <Link
                href={`/tasks/${t.id}`}
                className={buttonVariants({ variant: "ghost", size: "icon" })}
                aria-label="Preview task"
              >
                <Eye className="size-4" />
              </Link>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Edit task"
                onClick={() => {
                  setEditing(t.id);
                  setCreating(false);
                }}
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Delete task"
                disabled={pending}
                onClick={() => {
                  if (confirm(`Delete "${t.title}"?`))
                    run(() => deleteTask(t.id, unitId));
                }}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </Card>
          ),
        )}
      </div>

      {creating ? (
        <TaskForm
          pending={pending}
          onCancel={() => setCreating(false)}
          onSubmit={(v) =>
            run(() => createTask(unitId, v), () => setCreating(false))
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
          <Plus /> New task
        </Button>
      )}
    </div>
  );
}

function TaskForm({
  initial,
  pending,
  onSubmit,
  onCancel,
}: {
  initial?: TaskRow;
  pending: boolean;
  onSubmit: (v: {
    title: string;
    type: TaskTypeKey;
    displayOrder: number;
    contentJson: string;
  }) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = React.useState(initial?.title ?? "");
  const [type, setType] = React.useState<TaskTypeKey>(
    initial?.type ?? "vocab_study",
  );
  const [order, setOrder] = React.useState(String(initial?.displayOrder ?? ""));
  const [contentJson, setContentJson] = React.useState(
    pretty(initial?.content ?? TEMPLATES["vocab_study"]),
  );

  // Live client-side validation (the server re-validates on save).
  const validation = React.useMemo(() => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(contentJson);
    } catch {
      return { ok: false, message: "Not valid JSON" };
    }
    const res = taskContentSchemas[type].safeParse(parsed);
    return res.success
      ? { ok: true, message: "Matches schema" }
      : { ok: false, message: res.error.issues[0]?.message ?? "Invalid" };
  }, [contentJson, type]);

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <Label htmlFor="t-title">Title</Label>
          <Input
            id="t-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
            className="mt-1"
          />
        </div>
        <div className="w-full sm:w-56">
          <Label htmlFor="t-type">Type</Label>
          <select
            id="t-type"
            value={type}
            onChange={(e) => setType(e.target.value as TaskTypeKey)}
            className="mt-1 h-11 w-full rounded-[var(--radius-input)] border border-input bg-card px-3 text-base text-foreground shadow-soft outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring"
          >
            {TYPE_ORDER.map((k) => (
              <option key={k} value={k}>
                {taskTypeMeta[k].label}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full sm:w-24">
          <Label htmlFor="t-order">Order</Label>
          <Input
            id="t-order"
            type="number"
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor="t-content">Content (JSON)</Label>
          <button
            type="button"
            onClick={() => setContentJson(pretty(TEMPLATES[type]))}
            className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline"
          >
            <FileJson className="size-3.5" />
            Insert {taskTypeMeta[type].label} template
          </button>
        </div>
        <textarea
          id="t-content"
          value={contentJson}
          onChange={(e) => setContentJson(e.target.value)}
          spellCheck={false}
          rows={12}
          className="mt-1 w-full rounded-[var(--radius-input)] border border-input bg-card p-3 font-mono text-sm text-foreground shadow-soft outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring"
        />
        <p
          className={cn(
            "mt-2 text-xs font-medium",
            validation.ok ? "text-success" : "text-destructive",
          )}
        >
          {validation.ok ? "✓ " : "✗ "}
          {validation.message}
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={() =>
            onSubmit({ title, type, displayOrder: Number(order), contentJson })
          }
          disabled={pending || !title || order === "" || !validation.ok}
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
