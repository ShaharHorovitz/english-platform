/** Skeleton matching the app shell, for route loading.tsx fallbacks. */
export function ShellSkeleton() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 h-16 border-b border-border bg-background/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="h-9 w-40 animate-pulse rounded-[var(--radius-input)] bg-muted" />
          <div className="size-9 animate-pulse rounded-full bg-muted" />
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
        <div className="flex flex-col gap-8">
          <div className="h-9 w-56 animate-pulse rounded-[var(--radius-input)] bg-muted" />
          <div className="h-28 w-full max-w-md animate-pulse rounded-[var(--radius-card)] bg-muted" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-40 animate-pulse rounded-[var(--radius-card)] bg-muted"
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
