import Link from "next/link";
import {
  GraduationCap,
  BookOpen,
  Sparkles,
  FileText,
  TrendingUp,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const benefits = [
  {
    icon: BookOpen,
    title: "Vocabulary",
    body: "Flashcards and practice that make new words actually stick.",
  },
  {
    icon: FileText,
    title: "Reading",
    body: "Short passages with comprehension questions you can check.",
  },
  {
    icon: TrendingUp,
    title: "Progress",
    body: "Unlock units step by step and watch how far you've come.",
  },
];

/**
 * Landing (public). Warm pitch + Sign In. No public sign-up — new students join
 * with an invite code. The single teal moment is the hero CTA.
 */
export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-[var(--radius-button)] bg-foreground text-background shadow-soft">
            <GraduationCap className="size-5" />
          </span>
          <span className="text-lg font-extrabold tracking-tight">
            English Platform
          </span>
        </div>
        <Link
          href="/login"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Sign in
        </Link>
      </header>

      <main className="flex flex-1 flex-col">
        {/* Hero */}
        <section className="mx-auto w-full max-w-3xl px-6 pt-16 pb-16 text-center sm:pt-24">
          <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm font-semibold text-muted-foreground">
            <Sparkles className="size-4" />
            Practice that actually sticks
          </span>
          <h1 className="mt-6 text-balance font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
            Build your English, one unit at a time.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-pretty text-lg text-muted-foreground">
            Vocabulary and reading practice made for you — clear steps, instant
            feedback, and steady progress you can see.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
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

        {/* Benefits */}
        <section className="mx-auto w-full max-w-5xl px-6 pb-24">
          <div className="grid gap-4 sm:grid-cols-3">
            {benefits.map(({ icon: Icon, title, body }) => (
              <Card key={title} className="p-6">
                <span className="flex size-11 items-center justify-center rounded-[var(--radius-button)] bg-muted text-foreground">
                  <Icon className="size-5" />
                </span>
                <h2 className="mt-4 font-display text-xl font-semibold tracking-tight">
                  {title}
                </h2>
                <p className="mt-2 text-pretty text-sm text-muted-foreground">
                  {body}
                </p>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <footer className="mx-auto w-full max-w-6xl px-6 py-6 text-center text-sm text-muted-foreground">
        New students join with an invite code from their teacher.
      </footer>
    </div>
  );
}
