import { Ban, CircleCheck, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";

import { userStatusLabel, type UserStatus } from "./admin-api";

const STATUS_STYLE: Record<UserStatus, { className: string; Icon: typeof Ban }> = {
  active: { className: "text-success", Icon: CircleCheck },
  suspended: { className: "text-destructive", Icon: Ban },
  deleted: { className: "text-muted-foreground", Icon: Trash2 },
};

type UserStatusLabelProps = {
  status: UserStatus;
  className?: string;
};

/** Account status as an icon plus a word, so it never depends on color alone. */
export function UserStatusLabel({ status, className }: UserStatusLabelProps) {
  const { className: tone, Icon } = STATUS_STYLE[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm font-medium", tone, className)}>
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      {userStatusLabel(status)}
    </span>
  );
}
