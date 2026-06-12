export default function Loading() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col justify-center gap-6 px-5 py-12">
      <div className="h-9 w-48 animate-pulse rounded-[var(--radius-input)] bg-muted" />
      <div className="h-40 w-full animate-pulse rounded-[var(--radius-card)] bg-muted" />
    </main>
  );
}
