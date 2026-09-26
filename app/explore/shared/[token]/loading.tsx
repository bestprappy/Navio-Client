import { Skeleton } from "@/components/ui/skeleton";

export default function ExploreSharedPlanLoading() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4 pt-20 pb-16 sm:px-6" aria-busy="true">
      <span className="sr-only" role="status">
        Loading plan
      </span>
      <div className="space-y-3 border-b border-border pb-6">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      {[0, 1].map((day) => (
        <div key={day} className="space-y-3">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ))}
    </div>
  );
}
