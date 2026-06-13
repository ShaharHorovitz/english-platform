"use client";

import * as React from "react";
import { Trash2, Upload } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import {
  importVocab,
  deleteVocab,
  type ActionResult,
} from "@/app/admin/actions";

export type VocabRow = {
  id: string;
  word: string;
  translationHe: string;
  partOfSpeech: string | null;
  exampleSentence: string | null;
};

const SAMPLE = JSON.stringify(
  [
    {
      word: "word1",
      translation_he: "מילה1",
      part_of_speech: "noun",
      example_sentence: "A sentence with word1.",
    },
  ],
  null,
  2,
);

export function VocabManager({
  unitId,
  vocab,
}: {
  unitId: string;
  vocab: VocabRow[];
}) {
  const [error, setError] = React.useState<string | null>(null);
  const [json, setJson] = React.useState("");
  const [replace, setReplace] = React.useState(false);
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

      {vocab.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {vocab.map((v) => (
            <span
              key={v.id}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card py-1 pe-1 ps-3 text-sm shadow-soft"
            >
              <span className="font-medium">{v.word}</span>
              <span className="text-muted-foreground" dir="rtl" lang="he">
                {v.translationHe}
              </span>
              <button
                type="button"
                onClick={() => run(() => deleteVocab(v.id, unitId))}
                disabled={pending}
                aria-label={`Delete ${v.word}`}
                className="flex size-6 items-center justify-center rounded-full hover:bg-accent"
              >
                <Trash2 className="size-3.5 text-destructive" />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No vocab items yet.</p>
      )}

      <Card className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Bulk import (JSON array)</p>
          <button
            type="button"
            onClick={() => setJson(SAMPLE)}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Insert example
          </button>
        </div>
        <textarea
          value={json}
          onChange={(e) => setJson(e.target.value)}
          rows={6}
          spellCheck={false}
          placeholder={SAMPLE}
          className="w-full rounded-[var(--radius-input)] border border-input bg-card p-3 font-mono text-sm text-foreground shadow-soft outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring"
        />
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={replace}
              onChange={(e) => setReplace(e.target.checked)}
              className="size-4 accent-[var(--primary)]"
            />
            Replace existing items
          </label>
          <Button
            onClick={() => run(() => importVocab(unitId, json, replace))}
            disabled={pending || !json.trim()}
          >
            <Upload /> Import
          </Button>
        </div>
      </Card>
    </div>
  );
}
