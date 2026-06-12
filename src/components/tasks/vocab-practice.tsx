"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResultCard } from "./result-card";
import { recordProgress } from "@/app/tasks/[id]/actions";
import { isPassing } from "@/lib/progression";
import type { VocabPracticeContent } from "@/lib/content-schemas";
import { cn } from "@/lib/utils";

type Answers = Record<string, string | number>;

/** Mixed practice: matching + multiple choice + fill-in. Completion = ≥ 70%.
 * Each matching pair counts as one item, alongside each MC/fill-in. */
export function VocabPractice({
  taskId,
  content,
  unitHref,
  alreadyCompleted,
}: {
  taskId: string;
  content: VocabPracticeContent;
  unitHref: string;
  alreadyCompleted: boolean;
}) {
  const exercises = content.exercises;
  const [answers, setAnswers] = React.useState<Answers>({});
  const [score, setScore] = React.useState<number | null>(null);
  const [pending, startTransition] = React.useTransition();
  const started = React.useRef(false);

  const ensureStarted = () => {
    if (!started.current && !alreadyCompleted) {
      started.current = true;
      void recordProgress(taskId, { status: "in_progress", score: null });
    }
  };
  const set = (key: string, value: string | number) => {
    ensureStarted();
    setAnswers((a) => ({ ...a, [key]: value }));
  };

  // Flatten to gradable items for answered-check + scoring.
  const items = React.useMemo(() => {
    const out: { key: string; correct: (a: Answers) => boolean }[] = [];
    exercises.forEach((ex, ei) => {
      if (ex.type === "matching") {
        ex.pairs.forEach((p, pi) => {
          const key = `${ei}:${pi}`;
          out.push({ key, correct: (a) => a[key] === p.right });
        });
      } else if (ex.type === "multiple_choice") {
        const key = `${ei}`;
        out.push({ key, correct: (a) => a[key] === ex.answer });
      } else {
        const key = `${ei}`;
        out.push({
          key,
          correct: (a) =>
            String(a[key] ?? "")
              .trim()
              .toLowerCase() === ex.blank_answer.toLowerCase(),
        });
      }
    });
    return out;
  }, [exercises]);

  const allAnswered = items.every((it) => {
    const v = answers[it.key];
    return v !== undefined && String(v).length > 0;
  });

  const submit = () => {
    const correct = items.reduce((n, it) => n + (it.correct(answers) ? 1 : 0), 0);
    const pct = Math.round((correct / items.length) * 100);
    startTransition(async () => {
      await recordProgress(
        taskId,
        isPassing(pct)
          ? { status: "completed", score: pct }
          : { status: "in_progress", score: null },
      );
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
      {exercises.map((ex, ei) => (
        <Card key={ei} className="p-5">
          {ex.type === "matching" ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold text-muted-foreground">
                Match each word to its translation
              </p>
              {ex.pairs.map((pair, pi) => {
                const rights = [...ex.pairs.map((p) => p.right)].sort();
                const key = `${ei}:${pi}`;
                return (
                  <div key={pi} className="flex items-center gap-3">
                    <span className="w-32 shrink-0 font-medium">
                      {pair.left}
                    </span>
                    <select
                      value={(answers[key] as string) ?? ""}
                      onChange={(e) => set(key, e.target.value)}
                      className="h-11 flex-1 rounded-[var(--radius-input)] border border-input bg-card px-3 text-base text-foreground shadow-soft-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="" disabled>
                        Choose…
                      </option>
                      {rights.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          ) : ex.type === "multiple_choice" ? (
            <div className="flex flex-col gap-3">
              <p className="font-semibold">{ex.question}</p>
              <div className="flex flex-col gap-2">
                {ex.options.map((opt, oi) => (
                  <label
                    key={oi}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-[var(--radius-input)] border border-border p-3 text-sm transition-colors hover:bg-accent",
                      answers[`${ei}`] === oi && "border-primary bg-accent",
                    )}
                  >
                    <input
                      type="radio"
                      name={`ex${ei}`}
                      checked={answers[`${ei}`] === oi}
                      onChange={() => set(`${ei}`, oi)}
                      className="size-4 accent-[var(--primary)]"
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold text-muted-foreground">
                Fill in the blank
              </p>
              <p className="text-lg">
                {ex.sentence.split(/_+/)[0]}
                <input
                  value={(answers[`${ei}`] as string) ?? ""}
                  onChange={(e) => set(`${ei}`, e.target.value)}
                  aria-label="Fill in the blank"
                  className="mx-1 inline-block w-40 rounded-[var(--radius-input)] border border-input bg-card px-2 py-1 text-base text-foreground shadow-soft-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring"
                />
                {ex.sentence.split(/_+/)[1] ?? ""}
              </p>
            </div>
          )}
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
