import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/** Terracotta inline error banner (matches the sign-in sample). */
export function FormError({
  message,
  className,
}: {
  message?: string | null;
  className?: string;
}) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-2 rounded-[var(--radius-input)] border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive",
        className,
      )}
    >
      <AlertCircle className="mt-1 size-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
