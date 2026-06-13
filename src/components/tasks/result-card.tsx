"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { PartyPopper, XCircle, RotateCcw, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { PASS_THRESHOLD, isPassing } from "@/lib/progression";
import { celebrate } from "@/lib/confetti";
import { cn } from "@/lib/utils";

export function ResultCard({
  score,
  unitHref,
  onRetry,
  pending,
}: {
  score: number;
  unitHref: string;
  onRetry: () => void;
  pending?: boolean;
}) {
  const passed = isPassing(score);
  const reduce = useReducedMotion();

  React.useEffect(() => {
    if (passed) celebrate({ x: 0.5, y: 0.35 });
  }, [passed]);

  return (
    <Card className="mx-auto flex w-full max-w-md flex-col items-center gap-4 p-8 text-center">
      <motion.span
        className={cn(
          "flex size-14 items-center justify-center rounded-full",
          passed
            ? "bg-success text-success-foreground"
            : "bg-destructive/15 text-destructive",
        )}
        initial={reduce ? false : { scale: 0.4, opacity: 0 }}
        animate={
          reduce ? undefined : { scale: passed ? [0.4, 1.18, 1] : 1, opacity: 1 }
        }
        transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
      >
        {passed ? (
          <PartyPopper className="size-7" />
        ) : (
          <XCircle className="size-7" />
        )}
      </motion.span>
      <div>
        <p className="text-4xl font-extrabold tracking-tight">{score}%</p>
        <p className="mt-1 text-pretty text-muted-foreground">
          {passed
            ? "Nice work — you passed!"
            : `You need ${PASS_THRESHOLD}% to pass. Give it another go.`}
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button
          variant={passed ? "outline" : "default"}
          onClick={onRetry}
          disabled={pending}
        >
          <RotateCcw />
          Try again
        </Button>
        {passed ? (
          <Link href={unitHref} className={buttonVariants()}>
            Back to unit
            <ArrowRight />
          </Link>
        ) : null}
      </div>
    </Card>
  );
}
