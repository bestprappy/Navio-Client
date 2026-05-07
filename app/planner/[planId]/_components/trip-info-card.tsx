import { UserPlus } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const AVATAR_PLACEHOLDER =
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRH6gP2cXHCBfE3Q4snVK7RZuquprmqEBFHkg&s";

import { TripDates } from "./trip-dates";

type TripMember = {
  id: string;
  name: string;
  avatarUrl?: string;
};

type TripInfoCardProps = {
  destinationName: string;
  from?: string;
  to?: string;
  members?: TripMember[];
};

export function TripInfoCard({
  destinationName,
  from,
  to,
  members = [],
}: TripInfoCardProps) {
  return (
    <div className="relative z-10 -mt-20 mx-16 flex flex-col gap-6 rounded-sm  bg-card p-6 shadow-2xs">
      <h1 className="truncate text-4xl flex  font-extrabold leading-tight text-foreground">
        Trip to {destinationName}
      </h1>
      <div className="flex  items-start justify-between gap-4">
        {/* Title + dates */}
        <div className="min-w-0 flex-1 flex-col ">
          <div className="flex w-full justify-between">
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
                className="flex ml-3 size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
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
