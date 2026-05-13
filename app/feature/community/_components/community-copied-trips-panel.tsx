"use client";

import { CheckCircle2, Copy, MapPinned, X } from "lucide-react";
import { useAtom, useAtomValue } from "jotai";

import { copiedTripIdsAtom, copiedTripsAtom } from "./community-atoms";
import { formatCount } from "./data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function CommunityCopiedTripsPanel() {
  const copiedTrips = useAtomValue(copiedTripsAtom);
  const [copiedTripIds, setCopiedTripIds] = useAtom(copiedTripIdsAtom);

  function removeCopiedTrip(tripId: string) {
    setCopiedTripIds((previous) =>
      previous.filter((copiedTripId) => copiedTripId !== tripId),
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Copy className="size-4" aria-hidden="true" />
          Copied trips
        </CardTitle>
        <CardDescription>
          Mock saved trips for this session. They are not written to Planner yet.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {copiedTrips.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
            Copy a shared trip from the feed to keep it here.
          </div>
        ) : (
          copiedTrips.map((trip) => (
            <article
              key={trip.id}
              className="overflow-hidden rounded-lg border border-border bg-muted/20"
            >
              <div
                role="img"
                aria-label={trip.title}
                className="h-24 bg-cover bg-center"
                style={{ backgroundImage: `url(${trip.coverImageUrl})` }}
              />
              <div className="space-y-3 p-3">
                <div>
                  <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
                    {trip.title}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {trip.durationDays} days in {trip.location}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    <CheckCircle2 aria-hidden="true" />
                    copied
                  </Badge>
                  <Badge variant="outline">
                    <MapPinned aria-hidden="true" />
                    {formatCount(trip.stops.length)} stops
                  </Badge>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="w-full justify-center"
                  onClick={() => removeCopiedTrip(trip.id)}
                  aria-label={`Remove ${trip.title} from copied trips`}
                >
                  <X aria-hidden="true" />
                  Remove
                </Button>
              </div>
            </article>
          ))
        )}
        {copiedTripIds.length > copiedTrips.length ? (
          <p className="text-xs text-muted-foreground">
            Some copied trip references no longer exist in mock data.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
