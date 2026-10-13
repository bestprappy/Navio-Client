"use client";

import Link from "next/link";

import { CommunityBanner, CommunityIcon, communityHandle } from "../_components/community-identity";
import { CommunityMembershipButton } from "../_components/community-membership-button";
import type { CommunityGroup } from "../_components/data";
import { formatCount } from "../_components/data";

/** Explore card: a banner strip, the icon, and enough description to decide whether to join. */
export function CommunityDiscoveryGroupCard({ group }: { group: CommunityGroup }) {
  const seed = group.slug ?? group.id;
  const href = `/community/${group.slug}`;

  return (
    <article className="group/card relative flex flex-col overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border/70 transition-shadow hover:shadow-md">
      <CommunityBanner seed={seed} src={group.bannerUrl} alt="" className="h-16" />
      <div className="flex flex-1 flex-col gap-2 px-4 pb-4">
        <div className="flex items-end justify-between gap-3">
          <CommunityIcon
            name={group.name}
            seed={seed}
            src={group.avatarUrl}
            size="lg"
            className="-mt-5 size-12 text-lg ring-4 ring-card"
          />
          <CommunityMembershipButton group={group} compact className="relative z-10" />
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-base font-extrabold text-foreground">
            <Link
              href={href}
              className="rounded-md after:absolute after:inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {communityHandle(group.slug, group.name)}
            </Link>
          </h3>
          <p className="truncate text-xs text-muted-foreground">
            {group.name !== group.slug ? `${group.name} · ` : ""}
            {formatCount(group.memberCount)} {group.memberCount === 1 ? "member" : "members"}
          </p>
        </div>
        <p className="line-clamp-2 text-sm leading-5 text-muted-foreground">{group.description}</p>
        {group.tags.length ? (
          <ul className="mt-auto flex flex-wrap gap-1.5 pt-1">
            {group.tags.slice(0, 3).map((tag) => (
              <li key={tag} className="rounded-full bg-secondary px-2 py-0.5 text-[0.6875rem] font-semibold text-secondary-foreground">
                {tag}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </article>
  );
}
