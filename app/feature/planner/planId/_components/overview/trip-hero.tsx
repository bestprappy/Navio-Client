"use client";

import { useMemo, useState } from "react";

import { destinationCountryCover } from "@/app/feature/explore/_components/shared-plans/plan-cover.data";
import { isPersistedTripId } from "../../../_components/planner-api";
import { tripCoverUrl } from "../../../_components/trip-cover-api";
import { TripCoverEditor } from "./trip-cover-editor";

type TripHeroProps = {
  planId?: string;
  destinationName: string;
  destinationCity?: string | null;
  destinationCountry?: string | null;
  coverMediaId?: string | null;
  readOnly?: boolean;
};

/**
 * The planner banner. Shows, in order: the owner's uploaded photo, an
 * attributed photo of the destination city or country, or the brand gradient.
 */
export function TripHero({
  planId,
  destinationName,
  destinationCity,
  destinationCountry,
  coverMediaId,
  readOnly = false,
}: TripHeroProps) {
  const tripId = isPersistedTripId(planId) ? planId : null;
  const uploadedUrl = tripId ? tripCoverUrl(tripId, coverMediaId) : null;
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const destination = useMemo(
    () => destinationCountryCover({ city: destinationCity, country: destinationCountry, name: destinationName }),
    [destinationCity, destinationCountry, destinationName],
  );
  const showUploaded = uploadedUrl !== null && failedUrl !== uploadedUrl;

  return (
    <div className="relative h-48 w-full overflow-hidden bg-muted @lg/planner:h-56">
      <div aria-hidden="true" className="absolute inset-0" style={{ background: "var(--brand-gradient)" }} />

      {showUploaded ? (
        // eslint-disable-next-line @next/next/no-img-element -- served by the authenticated proxy, so it cannot go through the image optimizer
        <img
          src={uploadedUrl}
          alt={`Cover photo for trip to ${destinationName}`}
          decoding="async"
          className="absolute inset-0 size-full object-cover"
          onError={() => {
            console.error("Trip cover image failed to load.", { component: "TripHero", tripId });
            setFailedUrl(uploadedUrl);
          }}
        />
      ) : destination ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- bundled, pre-sized webp shared with the Explore plan covers */}
          <img
            src={destination.src}
            alt={`${destination.subject}, ${destination.country}`}
            width={960}
            height={600}
            decoding="async"
            fetchPriority="high"
            className="absolute inset-0 size-full object-cover"
            style={{ objectPosition: destination.objectPosition }}
          />
          <p className="absolute left-3 top-3 flex max-w-[calc(100%-4.5rem)] min-w-0 items-center gap-1.5 rounded-full bg-scrim/60 px-2.5 py-1 text-[10px] leading-4 text-on-media backdrop-blur-sm">
            <a
              href={destination.sourceUrl}
              target="_blank"
              rel="noreferrer"
              title={`${destination.subject} by ${destination.author}`}
              className="min-w-0 truncate underline-offset-2 hover:underline focus-visible:underline focus-visible:outline-none"
            >
              Photo: {destination.author}
            </a>
            <a
              href={destination.licenseUrl}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 underline underline-offset-2 focus-visible:outline-none"
            >
              {destination.license}
            </a>
          </p>
        </>
      ) : null}

      {!readOnly && tripId ? (
        <TripCoverEditor
          tripId={tripId}
          hasCustomCover={Boolean(coverMediaId)}
          hasDestinationPhoto={destination !== undefined}
        />
      ) : null}
    </div>
  );
}
