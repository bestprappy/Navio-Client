"use client";

import Link from "next/link";
import { type SyntheticEvent } from "react";
import { ExternalLink, MapPinned } from "lucide-react";

import type { SharedTrip } from "./data";
import { formatCount, getInitials, getUserById } from "./data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

type CommunityTripAttachmentProps = {
  trip: SharedTrip;
};

export function CommunityTripAttachment({ trip }: CommunityTripAttachmentProps) {
  const author = getUserById(trip.authorId);

  function stopParentNavigation(event: SyntheticEvent<HTMLElement>) {
    event.stopPropagation();
  }

  const content = (
    <div className="grid min-w-0 gap-0 @min-[32rem]:grid-cols-[8rem_minmax(0,1fr)]">
      <div
        role="img"
        aria-label={trip.title}
        className="min-h-36 bg-cover bg-center @min-[32rem]:min-h-full"
        style={{ backgroundImage: `url(${trip.coverImageUrl})` }}
      />
      <div className="flex min-w-0 flex-col gap-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">
                <MapPinned aria-hidden="true" />
                {trip.href ? "Explore plan" : "Shared trip"}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {trip.durationDays} days in {trip.country}
              </span>
            </div>
            <h3 className="inline-flex max-w-full items-start gap-1 text-sm font-semibold leading-snug text-foreground">
              <span className="line-clamp-2">{trip.title}</span>
              {trip.href ? (
                <ExternalLink
                  className="mt-0.5 size-3.5 shrink-0"
                  aria-hidden="true"
                />
              ) : null}
            </h3>
            <p className="line-clamp-3 break-words text-sm leading-6 text-muted-foreground">
              {trip.summary}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {trip.tags.slice(0, 4).map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3">
          <div className="flex items-center gap-2">
            <Avatar size="sm">
              <AvatarImage src={author.avatarUrl} alt={author.name} />
              <AvatarFallback>{getInitials(author.name)}</AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">
              Created by {author.name}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {formatCount(trip.copiedCount)} copies
          </span>
        </div>
      </div>
    </div>
  );

  if (trip.href) {
    return (
      <Link
        href={trip.href}
        aria-label={`Open discussed plan: ${trip.title}`}
        className="@container block overflow-hidden rounded-xl border border-border/60 bg-muted/30 transition-colors hover:bg-muted/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        onClick={stopParentNavigation}
        onKeyDown={stopParentNavigation}
      >
        {content}
      </Link>
    );
  }

  return (
    <section
      aria-label={`Shared trip: ${trip.title}`}
      className="@container overflow-hidden rounded-xl border border-border/60 bg-muted/30"
    >
      {content}
    </section>
  );
}
