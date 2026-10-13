"use client";

import Link from "next/link";

import { Skeleton } from "@/components/ui/skeleton";
import { CommunityIcon, communityHandle } from "../_components/community-identity";
import { CommunityMembershipButton } from "../_components/community-membership-button";
import type { CommunityGroup } from "../_components/data";
import { formatCount } from "../_components/data";
import { CommunityGroupDialog } from "../create/community-group-dialog";

type CommunityContextSidebarProps = {
  groups: CommunityGroup[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
};

const SHOWN = 6;

/** Right rail of the feeds: the most-joined communities, then an invitation to start one. */
export function CommunityContextSidebar({ groups, isLoading, isError, onRetry }: CommunityContextSidebarProps) {
  const popular = groups.slice(0, SHOWN);

  return (
    <aside aria-label="Communities" className="flex flex-col gap-4">
      <section className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border/70">
        <h2 className="px-4 pb-2 pt-4 text-sm font-bold text-foreground">Popular communities</h2>
        {isLoading ? (
          <div role="status" className="flex flex-col gap-3 px-4 pb-4">
            <span className="sr-only">Loading communities</span>
            {[0, 1, 2, 3].map((item) => (
              <Skeleton key={item} className="h-9 w-full rounded-full" />
            ))}
          </div>
        ) : null}
        {isError ? (
          <p className="px-4 pb-4 text-sm text-muted-foreground">
            Communities could not load.{" "}
            <button type="button" onClick={onRetry} className="font-semibold text-primary underline">
              Try again
            </button>
          </p>
        ) : null}
        {!isLoading && !isError && popular.length === 0 ? (
          <p className="px-4 pb-4 text-sm text-muted-foreground">No communities yet. Be the first to start one.</p>
        ) : null}
        <ul className="flex flex-col pb-2">
          {popular.map((group) => (
            <li key={group.id} className="flex items-center gap-3 px-4 py-2 transition-colors hover:bg-muted/60">
              <Link
                href={`/community/${group.slug}`}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <CommunityIcon name={group.name} seed={group.slug ?? group.id} src={group.avatarUrl} size="md" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-foreground">
                    {communityHandle(group.slug, group.name)}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {formatCount(group.memberCount)} {group.memberCount === 1 ? "member" : "members"}
                  </span>
                </span>
              </Link>
              {!group.joined ? <CommunityMembershipButton group={group} compact /> : null}
            </li>
          ))}
        </ul>
        {groups.length > 0 ? (
          <Link
            href="/community/discovery"
            className="block border-t border-border px-4 py-3 text-sm font-semibold text-primary hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
          >
            See all communities
          </Link>
        ) : null}
      </section>

      <section className="relative overflow-hidden rounded-2xl bg-primary/8 p-4 ring-1 ring-primary/20">
        <h2 className="text-sm font-bold text-foreground">Know a place well?</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Start a community for a country, a city, or a kind of trip, and gather the people who travel it.
        </p>
        <CommunityGroupDialog className="mt-3 w-full" />
      </section>
    </aside>
  );
}
