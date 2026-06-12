"use client";

import * as React from "react";
import Link from "next/link";
import { GraduationCap, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * SAMPLE sign-in card for design approval. Presentational only — the real
 * /login (with react-hook-form + zod + a server action) is built after the
 * design language is approved. Demonstrates the token system: brand, fields
 * with leading icons, password show/hide, an error region, primary CTA, and
 * the /redeem link. RTL-safe (logical properties), dark-mode ready.
 */
export function LoginCardSample({
  error,
  className,
}: {
  error?: string;
  className?: string;
}) {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <div
      className={cn(
        "w-full max-w-sm rounded-2xl border border-border bg-card p-7 text-card-foreground shadow-soft-lg",
        className,
      )}
    >
      {/* Brand */}
      <div className="mb-6 flex items-center gap-2.5">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft-sm">
          <GraduationCap className="size-5" />
        </span>
        <span className="text-lg font-extrabold tracking-tight">
          English Platform
        </span>
      </div>

      <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Sign in to keep practicing.
      </p>

      <form
        className="mt-6 flex flex-col gap-4"
        onSubmit={(e) => e.preventDefault()}
      >
        {/* Error region */}
        {error ? (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail
              aria-hidden
              className="pointer-events-none absolute inset-y-0 start-0 my-auto ms-3.5 size-4 text-muted-foreground"
            />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className="ps-10"
            />
          </div>
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock
              aria-hidden
              className="pointer-events-none absolute inset-y-0 start-0 my-auto ms-3.5 size-4 text-muted-foreground"
            />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              className="px-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute inset-y-0 end-0 my-auto me-2 flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
        </div>

        <Button type="submit" className="mt-1 w-full">
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Have an invite code?{" "}
        <Link
          href="/redeem"
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          Redeem it
        </Link>
      </p>
    </div>
  );
}
