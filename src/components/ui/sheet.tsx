"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";

/** Bottom sheet — Radix Dialog restyled to Tidewater. Used for the mobile
 * profile menu. Respects iOS safe-area inset. */
export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;
export const SheetTitle = DialogPrimitive.Title;

export const SheetContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(function SheetContent({ className, children, ...props }, ref) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-[overlay-in_150ms_ease-out]" />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 rounded-t-[var(--radius-card)] border-t border-border bg-popover p-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-popover-foreground shadow-lifted",
          "data-[state=open]:animate-[sheet-up_220ms_var(--ease-emphasized)]",
          className,
        )}
        {...props}
      >
        <div
          aria-hidden
          className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-border"
        />
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
});
