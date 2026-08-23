export function TripDashboardSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10 sm:px-10 sm:py-14"
    >
      <span className="sr-only">Loading your trips</span>

      <div className="flex flex-col gap-3">
        <div className="h-9 w-48 animate-pulse rounded-[var(--radius-sm)] bg-muted" />
        <div className="h-4 w-64 animate-pulse rounded-[var(--radius-xs)] bg-muted" />
      </div>

      <div className="flex flex-col gap-6 rounded-[var(--radius-lg)] border border-border bg-card p-6 shadow-lg sm:p-8">
        <div className="h-6 w-24 animate-pulse rounded-4xl bg-muted" />
        <div className="h-8 w-3/5 animate-pulse rounded-[var(--radius-sm)] bg-muted" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="h-24 animate-pulse rounded-[var(--card-radius-lg)] bg-muted"
            />
          ))}
        </div>
        <div className="h-11 w-44 animate-pulse self-end rounded-full bg-muted" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="h-36 animate-pulse rounded-[var(--card-radius-lg)] bg-muted"
          />
        ))}
      </div>
    </div>
  );
}
