import { CalendarCheck, CircleCheck, Plane } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import type { TripStatus } from "./trip-dashboard.utils";

type TripStatusBadgeProps = {
  status: TripStatus;
  className?: string;
};

const STATUS_PRESET: Record<
  TripStatus,
  { label: string; icon: typeof Plane; className: string }
> = {
  ongoing: {
    label: "On trip",
    icon: Plane,
    className: "bg-success/15 text-success",
  },
  upcoming: {
    label: "Upcoming",
    icon: CalendarCheck,
    className: "bg-primary/15 text-primary",
  },
  past: {
    label: "Completed",
    icon: CircleCheck,
    className: "bg-muted text-muted-foreground",
  },
};

export function TripStatusBadge({ status, className }: TripStatusBadgeProps) {
  const preset = STATUS_PRESET[status];
  const Icon = preset.icon;

  return (
    <Badge
      variant="ghost"
      className={cn(
        "h-6 gap-1.5 px-2.5 font-semibold",
        preset.className,
        className,
      )}
    >
      <Icon aria-hidden="true" />
      {preset.label}
    </Badge>
  );
}
