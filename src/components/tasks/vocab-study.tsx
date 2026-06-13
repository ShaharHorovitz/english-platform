"use client";

import * as React from "react";
import Link from "next/link";
import { Check, X, PartyPopper, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { ProgressBar } from "@/components/progression/progress-bar";
import { recordProgress, submitTaskAttempt } from "@/app/tasks/[id]/actions";
import type { VocabStudyContent } from "@/lib/content-schemas";
import { cn } from "@/lib/utils";

/** Flashcards. Completion = every card viewed at least once (no score). */
export function VocabStudy({
  taskId,
  content,
  unitHref,
  alreadyCompleted,
}: {
  taskId: string;
  content: VocabStudyContent;
  unitHref: string;
  alreadyCompleted: boolean;
}) {
  const cards = content.cards;
  const [index, setIndex] = React.useState(0);
  const [flipped, setFlipped] = React.useState(false);
  const [knew, setKnew] = React.useState(0);
  const [done, setDone] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const started = React.useRef(false);
  const startRef = React.useRef(0);
  const resultsRef = React.useRef<{ word: string; correct: boolean }[]>([]);

  const ensureStarted = () => {
    if (!started.current) {
      started.current = true;
      startRef.current = Date.now();
      if (!alreadyCompleted)
        void recordProgress(taskId, { status: "in_progress", score: null });
    }
  };

  const advance = async (known: boolean) => {
    ensureStarted();
    if (known) setKnew((k) => k + 1);
    resultsRef.current.push({ word: cards[index].word, correct: known });
    if (index + 1 >= cards.length) {
      // Await the write (attempt + progress + mastery) BEFORE the done screen
      // exposes "Back to unit", so the unit page reflects the unlock immediately.
      setSaving(true);
      const timeSpentSeconds = Math.max(
        1,
        Math.round((Date.now() - startRef.current) / 1000),
      );
      await submitTaskAttempt(taskId, {
        score: null,
        passed: true,
        timeSpentSeconds,
        wordResults: resultsRef.current,
      });
      setSaving(false);
      setDone(true);
    } else {
      setIndex((i) => i + 1);
      setFlipped(false);
    }
  };

  if (done) {
    return (
      <Card className="mx-auto flex w-full max-w-md flex-col items-center gap-4 p-8 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-success text-success-foreground">
          <PartyPopper className="size-7" />
        </span>
        <div>
          <p className="text-2xl font-extrabold tracking-tight">All done!</p>
          <p className="mt-1 text-muted-foreground">
            You reviewed {cards.length} cards and knew {knew} of them.
          </p>
        </div>
        <Link href={unitHref} className={buttonVariants()}>
          Back to unit
          <ArrowRight />
        </Link>
      </Card>
    );
  }

  const card = cards[index];
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-5">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Card {index + 1} of {cards.length}
        </span>
        <span>Tap the card to flip</span>
      </div>
      <ProgressBar value={(index / cards.length) * 100} />

      <button
        type="button"
        onClick={() => {
          ensureStarted();
          setFlipped((f) => !f);
        }}
        aria-label="Flip card"
        className="relative h-60 w-full rounded-[var(--radius-card)] outline-none [perspective:1200px] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <div
          className={cn(
            "relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d]",
            flipped && "[transform:rotateY(180deg)]",
          )}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-[var(--radius-card)] border border-border bg-card shadow-soft-md [backface-visibility:hidden]">
            <span className="text-4xl font-extrabold tracking-tight">
              {card.word}
            </span>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-[var(--radius-card)] border border-border bg-accent p-6 text-center text-accent-foreground [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <span lang="he" dir="rtl" className="text-3xl font-bold">
              {card.translation}
            </span>
            {card.example ? (
              <span className="text-sm text-muted-foreground">
                {card.example}
              </span>
            ) : null}
          </div>
        </div>
      </button>

      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => advance(false)}
          disabled={saving}
        >
          <X />
          Didn&rsquo;t know it
        </Button>
        <Button
          className="flex-1"
          onClick={() => advance(true)}
          disabled={saving}
        >
          <Check />
          I knew it
        </Button>
      </div>
    </div>
  );
}
