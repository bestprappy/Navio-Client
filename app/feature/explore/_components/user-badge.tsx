import type { UserProfile } from "./data";

type UserBadgeProps = {
  user: UserProfile;
  variant?: "default" | "compact";
};

export function UserBadge({ user, variant = "default" }: UserBadgeProps) {
  const isCompact = variant === "compact";

  return (
    <div className="flex items-center gap-2">
      <div
        className={`${isCompact ? "h-7 w-7" : "h-8 w-8"} rounded-full bg-cover bg-center`}
        style={{ backgroundImage: `url(${user.avatarUrl})` }}
        aria-label={user.name}
      />
      <div>
        <p
          className={`${isCompact ? "text-xs" : "text-sm"} font-medium text-foreground`}
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
