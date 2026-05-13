import type { UserProfile } from "./data";

type UserBadgeProps = {
  user: UserProfile;
  variant?: "default" | "compact";
};

export function UserBadge({ user, variant = "default" }: UserBadgeProps) {
  const isCompact = variant === "compact";

  return (
    <div className="flex min-w-0 items-center gap-2">
      <div
        className="h-8 w-8 rounded-full bg-cover bg-center"
        style={{ backgroundImage: `url(${user.avatarUrl})` }}
        aria-label={user.name}
      />
      <div className={isCompact ? "min-w-0" : ""}>
        <p
          className={
            isCompact
              ? "max-w-[110px] truncate text-sm font-medium text-foreground"
              : "text-sm font-medium text-foreground"
          }
        >
          {user.name}
        </p>
        <p className="text-xs text-muted-foreground">Plan creator</p>
      </div>
    </div>
  );
}
