"use client";

import { Check, Copy, MapPinned } from "lucide-react";

import type { SharedTrip } from "./data";
import { formatCount, getInitials, getUserById } from "./data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type CommunityTripAttachmentProps = {
  trip: SharedTrip;
  copied: boolean;
  onCopy: (tripId: string) => void;
};

export function CommunityTripAttachment({
  trip,
  copied,
  onCopy,
}: CommunityTripAttachmentProps) {
  const author = getUserById(trip.authorId);

  return (
    <section
      aria-label={`Shared trip: ${trip.title}`}
      className="overflow-hidden rounded-xl border border-border bg-muted/30"
    >
      <div className="grid gap-0 sm:grid-cols-[10rem_1fr]">
        <div
          role="img"
          aria-label={trip.title}
          className="min-h-36 bg-cover bg-center sm:min-h-full"
          style={{ backgroundImage: `url(${trip.coverImageUrl})` }}
        />
        <div className="flex flex-col gap-3 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">
                  <MapPinned aria-hidden="true" />
                  Shared trip
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {trip.durationDays} days in {trip.country}
                </span>
              </div>
              <h3 className="text-sm font-semibold leading-snug text-foreground">
                {trip.title}
              </h3>
              <p className="text-sm leading-6 text-muted-foreground">
                {trip.summary}
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant={copied ? "secondary" : "default"}
              disabled={copied}
              onClick={() => onCopy(trip.id)}
              aria-label={
                copied
                  ? `${trip.title} already copied`
                  : `Copy ${trip.title} to your trips`
              }
            >
              {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
              {copied ? "Copied" : "Copy trip"}
            </Button>
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
    </section>
  );
}
