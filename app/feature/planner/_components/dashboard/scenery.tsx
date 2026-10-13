"use client";

import Image from "next/image";
import { useState } from "react";

import { usePlaceDetails } from "../../planId/_components/place/use-place-details";

export function TripScenery({ placeId, sizes = "(max-width: 639px) 100vw, (max-width: 1279px) 50vw, 33vw" }: {
  placeId: string;
  sizes?: string;
}) {
  const place = usePlaceDetails(placeId);
  const imageUrl = place.data?.imageUrl;

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden bg-secondary">
      {imageUrl && <SceneryPhoto key={imageUrl} src={imageUrl} sizes={sizes} />}
      <div className="absolute inset-0 bg-card/35 dark:bg-background/20" />
    </div>
  );
}

function SceneryPhoto({ src, sizes }: { src: string; sizes: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;

  return <Image src={src} alt="" fill sizes={sizes} unoptimized onError={() => setFailed(true)} className="object-cover opacity-40 dark:opacity-25" />;
}
