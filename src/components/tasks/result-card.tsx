"use client";

import Link from "next/link";
import { PartyPopper, XCircle, RotateCcw, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { PASS_THRESHOLD, isPassing } from "@/lib/progression";
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
  return (
    <Card className="mx-auto flex w-full max-w-md flex-col items-center gap-4 p-8 text-center">
      <span
        className={cn(
          "flex size-14 items-center justify-center rounded-full",
          passed
            ? "bg-success text-success-foreground"
            : "bg-destructive/15 text-destructive",
        )}
      >
        {passed ? (
          <PartyPopper className="size-7" />
        ) : (
          <XCircle className="size-7" />
        )}
      </span>
      <div>
        <p className="text-4xl font-extrabold tracking-tight">{score}%</p>
        <p className="mt-1 text-muted-foreground text-pretty">
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
