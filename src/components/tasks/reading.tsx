"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResultCard } from "./result-card";
import { recordProgress, submitTaskAttempt } from "@/app/tasks/[id]/actions";
import { isPassing } from "@/lib/progression";
import type { ReadingContent } from "@/lib/content-schemas";
import { cn } from "@/lib/utils";

/** Reading passage + comprehension questions. Completion = score ≥ 70%. */
export function Reading({
  taskId,
  content,
  unitHref,
  alreadyCompleted,
}: {
  taskId: string;
  content: ReadingContent;
  unitHref: string;
  alreadyCompleted: boolean;
}) {
  const { passage, questions } = content;
  const [answers, setAnswers] = React.useState<Record<number, number>>({});
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

  const select = (q: number, opt: number) => {
    ensureStarted();
    setAnswers((a) => ({ ...a, [q]: opt }));
  };

  const allAnswered = questions.every((_, i) => answers[i] !== undefined);

  const submit = () => {
    const correct = questions.reduce(
      (n, q, i) => n + (answers[i] === q.answer ? 1 : 0),
      0,
    );
    const pct = Math.round((correct / questions.length) * 100);
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
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="h-fit p-6 lg:sticky lg:top-24">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Passage
        </h2>
        <div className="mt-3 space-y-4 text-lg leading-relaxed text-pretty">
          {passage.split(/\n\n+/).map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      </Card>

      <div className="flex flex-col gap-4">
        {questions.map((q, qi) => (
          <Card key={qi} className="p-5">
            <p className="font-semibold">
              {qi + 1}. {q.question}
            </p>
            <div className="mt-3 flex flex-col gap-2">
              {q.options.map((opt, oi) => (
                <label
                  key={oi}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-[var(--radius-input)] border border-border p-3 text-sm transition-colors hover:bg-accent",
                    answers[qi] === oi && "border-primary bg-accent",
                  )}
                >
                  <input
                    type="radio"
                    name={`q${qi}`}
                    checked={answers[qi] === oi}
                    onChange={() => select(qi, oi)}
                    className="size-4 accent-[var(--primary)]"
                  />
                  {opt}
                </label>
              ))}
            </div>
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
    </div>
  );
}
