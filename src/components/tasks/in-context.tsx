"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResultCard } from "./result-card";
import { recordProgress, submitTaskAttempt } from "@/app/tasks/[id]/actions";
import { isPassing } from "@/lib/progression";
import type { InContextContent } from "@/lib/content-schemas";

/** Use each word in a sentence. Graded by keyword match. Completion = ≥ 70%. */
export function InContext({
  taskId,
  content,
  unitHref,
  alreadyCompleted,
}: {
  taskId: string;
  content: InContextContent;
  unitHref: string;
  alreadyCompleted: boolean;
}) {
  const items = content.items;
  const [answers, setAnswers] = React.useState<Record<number, string>>({});
  const [score, setScore] = React.useState<number | null>(null);
  const [pending, startTransition] = React.useTransition();
  const started = React.useRef(false);
  const startRef = React.useRef(0);
  React.useEffect(() => {
    startRef.current = Date.now();
  }, []);

  const ensureStarted = () => {
    if (!started.current) {
      started.current = true;
      if (!alreadyCompleted)
        void recordProgress(taskId, { status: "in_progress", score: null });
    }
  };

  const setAns = (i: number, v: string) => {
    ensureStarted();
    setAnswers((a) => ({ ...a, [i]: v }));
  };

  const allAnswered = items.every((_, i) => (answers[i] ?? "").trim().length > 0);

  const submit = () => {
    const correct = items.reduce((n, item, i) => {
      const ans = (answers[i] ?? "").toLowerCase();
      const ok = item.accepted_answers.some((a) => ans.includes(a.toLowerCase()));
      return n + (ok ? 1 : 0);
    }, 0);
    const pct = Math.round((correct / items.length) * 100);
    const timeSpentSeconds = Math.max(
      1,
      Math.round((Date.now() - startRef.current) / 1000),
    );
    startTransition(async () => {
      await submitTaskAttempt(taskId, {
        score: pct,
        passed: isPassing(pct),
        timeSpentSeconds,
      });
      setScore(pct); // show result only after the write + revalidate land
    });
  };

  const retry = () => {
    setScore(null);
    setAnswers({});
  };

  if (score !== null) {
    return (
      <ResultCard
        score={score}
        unitHref={unitHref}
        onRetry={retry}
        pending={pending}
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      {items.map((item, i) => (
        <Card key={i} className="p-6">
          <span className="inline-flex rounded-full bg-accent px-3 py-1 text-sm font-semibold text-accent-foreground">
            {item.word}
          </span>
          <p className="mt-2 text-sm text-muted-foreground">{item.prompt}</p>
          <textarea
            value={answers[i] ?? ""}
            onChange={(e) => setAns(i, e.target.value)}
            rows={2}
            placeholder="Write your sentence…"
            className="mt-3 w-full rounded-[var(--radius-input)] border border-input bg-card p-3 text-base text-foreground shadow-soft outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring"
          />
        </Card>
      ))}
      <Button
        onClick={submit}
        disabled={!allAnswered || pending}
        className="self-start"
      >
        Check answers
      </Button>
    </div>
  );
}
