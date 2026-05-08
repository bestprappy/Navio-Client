import type { UserProfile } from "./data";

type UserBadgeProps = {
  user: UserProfile;
};

export function UserBadge({ user }: UserBadgeProps) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-8 w-8 rounded-full bg-cover bg-center"
        style={{ backgroundImage: `url(${user.avatarUrl})` }}
        aria-label={user.name}
      />
      <div>
        <p className="text-sm font-medium text-foreground">{user.name}</p>
        <p className="text-xs text-muted-foreground">Plan creator</p>
      </div>
    </div>
  );
}
