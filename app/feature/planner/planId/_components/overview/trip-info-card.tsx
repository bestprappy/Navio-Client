"use client";

import { UserPlus } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { isPersistedTripId } from "@/app/feature/planner/_components/planner-api";
import { TripActionsMenu } from "@/app/feature/planner/_components/trip-actions-menu";
import { useTripMetadata } from "@/app/feature/planner/_components/use-trip-metadata";

const AVATAR_PLACEHOLDER =
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRH6gP2cXHCBfE3Q4snVK7RZuquprmqEBFHkg&s";

import { TripDates } from "./trip-dates";
import { TripNameEditor } from "./trip-name-editor";

type TripMember = {
  id: string;
  name: string;
  avatarUrl?: string;
};

type TripInfoCardProps = {
  planId?: string;
  destinationName: string;
  from?: string;
  to?: string;
  members?: TripMember[];
};

export function TripInfoCard({
  planId,
  destinationName,
  from,
  to,
  members = [],
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
            {/* Members */}
            <div className="flex shrink-0 items-center gap-1.5 pt-0.5">
              {members.map((member) => (
                <Avatar
                  key={member.id}
                  className="size-7 ring-2 ring-background"
                >
                  <AvatarImage
                    src={member.avatarUrl ?? AVATAR_PLACEHOLDER}
                    alt={member.name}
                  />
                  <AvatarFallback className="text-xs font-bold">
                    {member.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
              <button
                type="button"
                className="ml-1 flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                aria-label="Add trip member"
              >
                <UserPlus className="size-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
