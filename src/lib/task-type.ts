import {
  Layers,
  ListChecks,
  BookOpen,
  PencilLine,
  type LucideIcon,
} from "lucide-react";
import type { TaskTypeKey } from "@/lib/content-schemas";

/** Display metadata for each task type (icon + human label). */
export const taskTypeMeta: Record<
  TaskTypeKey,
  { label: string; icon: LucideIcon }
> = {
  vocab_study: { label: "Vocabulary Study", icon: Layers },
  vocab_practice: { label: "Vocabulary Practice", icon: ListChecks },
  reading: { label: "Reading Passage", icon: BookOpen },
  in_context: { label: "Vocabulary in Context", icon: PencilLine },
};
