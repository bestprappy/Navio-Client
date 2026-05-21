import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type UserBadgeUser = {
  name: string;
  avatarUrl?: string;
};

type UserBadgeProps = {
  user: UserBadgeUser;
  variant?: "default" | "compact";
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function UserBadge({ user, variant = "default" }: UserBadgeProps) {
  const isCompact = variant === "compact";

  return (
    <div className="flex items-center gap-2">
      <Avatar className={isCompact ? "size-7" : "size-8"}>
        <AvatarImage src={user.avatarUrl} alt={user.name} />
        <AvatarFallback className={isCompact ? "text-[10px]" : "text-xs"}>
          {getInitials(user.name)}
        </AvatarFallback>
      </Avatar>
      <div>
        <p
          className={cn(
            "font-medium text-foreground",
            isCompact ? "text-xs" : "text-sm",
          )}
        >
          {user.name}
        </p>
        {!isCompact ? (
          <p className="text-xs text-muted-foreground">Plan creator</p>
        ) : null}
      </div>
    </div>
  );
}
