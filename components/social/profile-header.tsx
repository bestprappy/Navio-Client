import type { ReactNode } from "react";
import { Footprints } from "lucide-react";

import { paceLabel, resolveInterests } from "@/lib/travel-interests";
import { cn } from "@/lib/utils";
import { InterestStamp } from "./interest-stamp";
import { PassportPhoto } from "./user-avatar";

export type ProfileHeaderData = {
  displayName: string;
  username: string | null;
  bio: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  travelInterests: readonly string[];
  travelPace: string | null;
  memberSince: string | null;
};

type ProfileHeaderProps = {
  profile: ProfileHeaderData;
  /** Follow, edit or menu buttons, aligned with the name. */
  actions?: ReactNode;
  /** Follower and following counts. */
  stats?: ReactNode;
  /** Shown instead of the bio and interests, for a blocked or unavailable profile. */
  notice?: ReactNode;
  className?: string;
};

function memberSinceLabel(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `Joined ${date.toLocaleDateString(undefined, { month: "long", year: "numeric" })}`;
}

/** Placeholder banner: a quiet dashed route across the paper, Navio's own travel mark. */
function RouteBanner() {
  return (
    <svg aria-hidden="true" viewBox="0 0 600 200" preserveAspectRatio="xMidYMid slice" className="size-full text-primary/25">
      <rect width="600" height="200" className="fill-well" />
      <path
        d="M-10 150 C 90 150, 120 60, 220 80 S 360 170, 450 110 S 560 40, 620 60"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeDasharray="2 12"
        strokeLinecap="round"
      />
      <circle cx="220" cy="80" r="6" className="fill-card" stroke="currentColor" strokeWidth="3" />
      <circle cx="450" cy="110" r="6" className="fill-card" stroke="currentColor" strokeWidth="3" />
    </svg>
  );
}

/**
 * The top of a public profile: banner, square passport photo overlapping its
 * lower edge, name and handle, bio, then interests as entry stamps. Shared by
 * the public page and the settings preview so both always look the same.
 */
export function ProfileHeader({ profile, actions, stats, notice, className }: ProfileHeaderProps) {
  const interests = resolveInterests(profile.travelInterests);
  const pace = paceLabel(profile.travelPace);
  const joined = memberSinceLabel(profile.memberSince);

  return (
    <div className={cn("overflow-hidden rounded-[var(--card-radius-lg)] border border-border bg-card shadow-xs", className)}>
      <div className="aspect-[3/1] max-h-64 w-full overflow-hidden bg-well">
        {profile.bannerUrl ? (
          // Served no-store through the authenticated proxy; the image optimiser cannot fetch it.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.bannerUrl} alt="" className="size-full object-cover" />
        ) : (
          <RouteBanner />
        )}
      </div>

      <div className="px-5 pb-6 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <PassportPhoto
            name={profile.displayName}
            src={profile.avatarUrl}
            className="-mt-12 size-24 shrink-0 shadow-sm sm:-mt-16 sm:size-32"
          />
          {actions ? <div className="flex flex-wrap items-center gap-2 pt-3">{actions}</div> : null}
        </div>

        <div className="mt-4 min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight break-words text-foreground sm:text-3xl">
            {profile.displayName}
          </h1>
          {profile.username ? <p className="mt-0.5 text-sm text-muted-foreground">@{profile.username}</p> : null}
        </div>

        {notice ?? (
          <>
            {profile.bio ? (
              <p className="mt-4 max-w-[65ch] text-[0.9375rem] leading-relaxed whitespace-pre-line text-foreground">
                {profile.bio}
              </p>
            ) : null}

            {interests.length > 0 || pace ? (
              <div className="mt-5 flex flex-col gap-3">
                {interests.length > 0 ? (
                  <ul role="list" aria-label="Travel interests" className="flex flex-wrap gap-x-2.5 gap-y-3">
                    {interests.map((interest, index) => (
                      <InterestStamp key={interest.id} interest={interest} index={index} />
                    ))}
                  </ul>
                ) : null}
                {pace ? (
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Footprints aria-hidden="true" className="size-4" />
                    Travels at a {pace.toLowerCase()} pace
                  </p>
                ) : null}
              </div>
            ) : null}
          </>
        )}

        {stats || joined ? (
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            {stats}
            {joined ? <span>{joined}</span> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
