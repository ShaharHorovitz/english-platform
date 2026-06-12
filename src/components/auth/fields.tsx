"use client";

import * as React from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Text input with a leading icon (RTL-safe via logical properties). */
export const InputWithIcon = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { icon: React.ReactNode }
>(function InputWithIcon({ icon, className, ...props }, ref) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 start-0 my-auto ms-3.5 flex items-center text-muted-foreground [&_svg]:size-4">
        {icon}
      </span>
      <Input ref={ref} className={cn("ps-10", className)} {...props} />
    </div>
  );
});

/** Password input with a lock icon and a show/hide toggle. */
export const PasswordField = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function PasswordField({ className, ...props }, ref) {
  const [show, setShow] = React.useState(false);
  return (
    <div className="relative">
      <Lock
        aria-hidden
        className="pointer-events-none absolute inset-y-0 start-0 my-auto ms-3.5 size-4 text-muted-foreground"
      />
      <Input
        ref={ref}
        type={show ? "text" : "password"}
        className={cn("px-10", className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute inset-y-0 end-0 my-auto me-2 flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
});
