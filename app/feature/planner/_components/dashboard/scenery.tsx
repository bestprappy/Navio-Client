"use client";

import Image from "next/image";
import { useState } from "react";

import { usePlaceDetails } from "../../planId/_components/place/use-place-details";

type TripSceneryProps = {
  placeId: string;
  /** The owner's uploaded cover. When set, no place lookup is made. */
  coverUrl?: string | null;
  sizes?: string;
};

const DEFAULT_SIZES = "(max-width: 639px) 100vw, (max-width: 1279px) 50vw, 33vw";
const photoClass = "object-cover opacity-40 dark:opacity-25";

/**
 * The faded photo behind a dashboard trip card: the owner's uploaded cover when
 * there is one, otherwise a photo of the trip's destination place. The place
 * lookup lives in its own component so a trip with a cover never mounts it and
 * never spends a Places request.
 */
export function TripScenery({ placeId, coverUrl = null, sizes = DEFAULT_SIZES }: TripSceneryProps) {
  const [failedCover, setFailedCover] = useState<string | null>(null);
  const showCover = coverUrl !== null && failedCover !== coverUrl;

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden bg-secondary">
      {showCover ? (
        // eslint-disable-next-line @next/next/no-img-element -- served by the authenticated proxy, so it cannot go through the image optimizer
        <img
          src={coverUrl}
          alt=""
          decoding="async"
          className={`absolute inset-0 size-full ${photoClass}`}
          onError={() => {
            console.error("Trip cover image failed to load.", { component: "TripScenery", coverUrl });
            setFailedCover(coverUrl);
          }}
        />
      ) : (
        <PlaceScenery placeId={placeId} sizes={sizes} />
      )}
      <div className="absolute inset-0 bg-card/35 dark:bg-background/20" />
    </div>
  );
}

function PlaceScenery({ placeId, sizes }: { placeId: string; sizes: string }) {
  const place = usePlaceDetails(placeId);
  const imageUrl = place.data?.imageUrl;
  return imageUrl ? <SceneryPhoto key={imageUrl} src={imageUrl} sizes={sizes} /> : null;
}

function SceneryPhoto({ src, sizes }: { src: string; sizes: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;

  return <Image src={src} alt="" fill sizes={sizes} unoptimized onError={() => setFailed(true)} className={photoClass} />;
}
