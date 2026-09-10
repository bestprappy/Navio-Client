import { Skeleton } from "@/components/ui/skeleton";

export function ProfileSkeleton() {
  return (
    <main aria-label="Loading profile settings" aria-busy="true" className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-8 sm:px-8 lg:grid-cols-[15rem_minmax(0,1fr)]">
      <div className="hidden space-y-5 lg:block">
        <Skeleton className="h-6 w-40" />
        {Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-11 w-full rounded-md" />)}
      </div>
      <div className="space-y-8 rounded-[var(--card-radius-lg)] border border-border bg-card p-6 sm:p-8">
        <div className="space-y-3"><Skeleton className="h-7 w-56" /><Skeleton className="h-4 w-3/4" /></div>
        <Skeleton className="size-24 rounded-full" />
        <div className="grid gap-6 sm:grid-cols-2">
          {Array.from({ length: 7 }, (_, index) => (
            <div key={index} className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-11 w-full rounded-md" /></div>
          ))}
        </div>
        <Skeleton className="h-32 w-full rounded-[var(--card-radius-lg)]" />
      </div>
      <span className="sr-only">Loading your personal information.</span>
    </main>
  );
}
