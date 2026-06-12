"use client";

import * as React from "react";
import { Sun, Moon, ArrowRight, Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoginCardSample } from "@/components/samples/login-card";

/**
 * Design-language preview (Phase 2, pre-approval). NOT a product route — a
 * showcase of the token system, primitives, and the sample sign-in card in
 * both light and dark mode. Remove or keep behind the teacher role later.
 */
const swatches: { name: string; className: string }[] = [
  { name: "primary", className: "bg-primary text-primary-foreground" },
  { name: "secondary", className: "bg-secondary text-secondary-foreground" },
  { name: "success", className: "bg-success text-success-foreground" },
  { name: "streak", className: "bg-streak text-streak-foreground" },
  { name: "destructive", className: "bg-destructive text-destructive-foreground" },
  { name: "accent", className: "bg-accent text-accent-foreground" },
  { name: "muted", className: "bg-muted text-muted-foreground" },
  { name: "card", className: "bg-card text-card-foreground border border-border" },
];

const typeScale: { label: string; className: string }[] = [
  { label: "Display — 48 / extrabold", className: "text-5xl font-extrabold tracking-tight" },
  { label: "H1 — 36 / bold", className: "text-4xl font-bold tracking-tight" },
  { label: "H2 — 30 / bold", className: "text-3xl font-bold" },
  { label: "H3 — 24 / semibold", className: "text-2xl font-semibold" },
  { label: "Body large — 18", className: "text-lg" },
  { label: "Body — 16", className: "text-base" },
  { label: "Small — 14 / muted", className: "text-sm text-muted-foreground" },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function DesignPreviewPage() {
  const [dark, setDark] = React.useState(false);

  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <main className="min-h-dvh bg-background px-5 py-10 sm:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-12">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              Design language
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Indigo · emerald progress · amber streaks · Plus Jakarta Sans
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setDark((d) => !d)}
            aria-pressed={dark}
          >
            {dark ? <Sun /> : <Moon />}
            {dark ? "Light" : "Dark"} mode
          </Button>
        </header>

        {/* Colors */}
        <Section title="Color tokens">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {swatches.map((s) => (
              <div
                key={s.name}
                className={`flex h-20 flex-col justify-end rounded-xl p-3 text-sm font-medium shadow-soft-sm ${s.className}`}
              >
                {s.name}
              </div>
            ))}
          </div>
        </Section>

        {/* Typography */}
        <Section title="Typography">
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6 text-card-foreground">
            {typeScale.map((t) => (
              <div key={t.label} className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">{t.label}</span>
                <span className={t.className}>The quick brown fox · מילה</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Buttons */}
        <Section title="Buttons">
          <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
            <div className="flex flex-wrap items-center gap-3">
              <Button>Continue</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="success">
                <Check /> Completed
              </Button>
              <Button variant="destructive">Delete</Button>
              <Button variant="link">Link</Button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">
                Large <ArrowRight />
              </Button>
              <Button size="icon" aria-label="Add">
                <Plus />
              </Button>
              <Button disabled>Disabled</Button>
            </div>
          </div>
        </Section>

        {/* Inputs */}
        <Section title="Inputs">
          <div className="grid gap-4 rounded-2xl border border-border bg-card p-6 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="p-name">Name</Label>
              <Input id="p-name" placeholder="Ada Lovelace" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="p-err">With error</Label>
              <Input id="p-err" aria-invalid defaultValue="not-an-email" />
              <span className="text-xs text-destructive">
                Enter a valid email address.
              </span>
            </div>
          </div>
        </Section>

        {/* Login card sample */}
        <Section title="Sample · Sign-in card">
          <div className="grid place-items-center gap-8 rounded-2xl border border-border bg-muted/40 p-8 sm:grid-cols-2">
            <LoginCardSample />
            <LoginCardSample error="Incorrect email or password." />
          </div>
        </Section>
      </div>
    </main>
  );
}
