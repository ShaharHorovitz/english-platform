import Link from "next/link";
import { GraduationCap, BookOpen, Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

/**
 * Landing page (public). Short warm pitch + Sign In. No public sign-up — new
 * students join with an invite code. Fuller landing polish can come later.
 */
export default function HomePage() {
  return (
    <main className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-[var(--radius-button)] bg-primary text-primary-foreground shadow-soft-sm">
            <GraduationCap className="size-5" />
          </span>
          <span className="text-lg font-extrabold tracking-tight">
            English Platform
          </span>
        </div>
        <Link href="/login" className={buttonVariants({ size: "sm" })}>
          Sign in
        </Link>
      </header>

      <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-6 px-5 py-16 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-sm font-semibold text-accent-foreground">
          <Sparkles className="size-4" />
          Practice that actually sticks
        </span>
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Build your English, one unit at a time.
        </h1>
        <p className="max-w-prose text-lg text-muted-foreground">
          Vocabulary and reading practice made for you — clear steps, instant
          feedback, and steady progress you can see.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/login" className={buttonVariants({ size: "lg" })}>
            <BookOpen />
            Sign in to start
          </Link>
          <Link
            href="/redeem"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            I have an invite code
          </Link>
        </div>
      </section>

      <footer className="mx-auto w-full max-w-5xl px-5 py-6 text-center text-sm text-muted-foreground">
        New students join with an invite code from their teacher.
      </footer>
    </main>
  );
}
