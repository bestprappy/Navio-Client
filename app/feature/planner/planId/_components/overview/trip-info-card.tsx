"use client";

import { useRequireAuth } from "@/hooks/use-require-auth";
import { isPersistedTripId } from "@/app/feature/planner/_components/planner-api";
import { TripActionsMenu } from "@/app/feature/planner/_components/trip-actions-menu";
import { useTripMetadata } from "@/app/feature/planner/_components/use-trip-metadata";

import { TripDates } from "./trip-dates";
import { TripNameEditor } from "./trip-name-editor";

type TripInfoCardProps = {
  planId?: string;
  destinationName: string;
  from?: string;
  to?: string;
};

export function TripInfoCard({
  planId,
  destinationName,
  from,
  to,
}: TripInfoCardProps) {
  const { isAuthenticated } = useRequireAuth();
  const metadata = useTripMetadata(planId);
  // Guest plans live only in this browser; there is no saved trip to delete.
  const canManageTrip = isAuthenticated && isPersistedTripId(planId) && Boolean(metadata.data);

  return (
    <div className="relative z-10 mx-4 -mt-12 flex min-w-0 flex-col gap-4 rounded-xl border border-border/60 bg-card p-4 shadow-sm @lg/planner:mx-6 @lg/planner:p-6">
      <div className="flex min-w-0 items-start gap-1">
        <div className="min-w-0 flex-1">
          <TripNameEditor planId={planId} destinationName={destinationName} />
        </div>
        {canManageTrip && planId && (
          <TripActionsMenu
            tripId={planId}
            tripTitle={metadata.data?.title ?? destinationName}
            redirectTo="/dashboard"
          />
        )}
      </div>
      <div className="flex min-w-0 items-start justify-between gap-4">
        {/* Title + dates */}
        <div className="min-w-0 flex-1 flex-col ">
          <div className="flex w-full flex-wrap items-center justify-between gap-3">
            <TripDates initialFrom={from} initialTo={to} />
          </div>
        </div>
      </div>
    </div>
  );
}
