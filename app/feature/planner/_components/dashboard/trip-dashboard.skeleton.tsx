import { Skeleton } from "@/components/ui/skeleton";

export function TripDashboardSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite" className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-8 lg:px-10 lg:py-10">
      <span className="sr-only">Loading your dashboard</span>
      <div className="space-y-3"><Skeleton className="h-4 w-48" /><Skeleton className="h-9 w-3/4" /><Skeleton className="h-4 w-1/2" /></div>
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-56 rounded-xl" />)}</div>
      </div>
      <div className="space-y-4">
        <div className="space-y-4"><Skeleton className="h-7 w-2/3" />{Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-36 rounded-xl" />)}</div>
        
      </div>
    </div>
  );
}

