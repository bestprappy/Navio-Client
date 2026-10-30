"use client";
/* Provider photos stay with their attribution and bypass the image optimizer. */
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { APIProvider, useMap } from "@vis.gl/react-google-maps";
import {
  ArrowLeft,
  Clock,
  ExternalLink,
  Images,
  MapPin,
  Phone,
  Star,
} from "lucide-react";
import { AppearanceGoogleMap } from "@/components/map/appearance-google-map";
import { AppearanceGoogleMarker } from "@/components/map/appearance-google-marker";
import { MapPinMark } from "@/components/map/numbered-map-pin";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { AddPlaceToPlan, DiscoveryPlanBanner } from "./plan-context";
import { PhotoCredit } from "./places-discovery";
import { readPlace, safeExternalUrl, type DiscoveryItem } from "./places-api";
// [DEFERRED][EXCLUDE_FROM_REPORT] PLACES_EDITORIAL: integration retained for future work.
// import { PlaceArticle } from "./place-article";
import { GoogleAttribution } from "./google-attribution";

export const readerMapOptions = {
  gestureHandling: "greedy",
  scrollwheel: true,
  zoomControl: true,
} as const;

type ReaderPhoto = DiscoveryItem["photos"][number];
function readerPhotos(item: DiscoveryItem): ReaderPhoto[] {
  const supplied = item.photos.length
    ? item.photos
    : item.place.photoUrl
      ? [
          {
            url: item.place.photoUrl,
            attributions: item.photoAttributions,
            googleMapsUri: item.photoGoogleMapsUri,
          },
        ]
      : [];
  return [
    ...new Map(
      supplied
        .filter((photo) => safeExternalUrl(photo.url))
        .map((photo) => [photo.url, photo]),
    ).values(),
  ].slice(0, 3);
}
function PhotoAttribution({
  item,
  photo,
}: {
  item: DiscoveryItem;
  photo: ReaderPhoto;
}) {
  return (
    <PhotoCredit
      item={{
        ...item,
        photoAttributions: photo.attributions,
        photoGoogleMapsUri: photo.googleMapsUri,
      }}
    />
  );
}
function ReaderPhotos({ item }: { item: DiscoveryItem }) {
  const photos = readerPhotos(item);
  const [selected, setSelected] = useState<number | null>(null);
  if (!photos.length) return null;
  const selectedPhoto = selected == null ? undefined : photos[selected];
  return (
    <section aria-labelledby="reader-photos-title" className="space-y-4">
      <div className="flex items-center gap-2">
        <Images className="size-4 text-primary" aria-hidden="true" />
        <h2 id="reader-photos-title" className="text-lg font-semibold">
          A closer look
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {photos.map((photo, index) => (
          <figure
            key={photo.url}
            className={
              index === 0 ? "col-span-2 space-y-2" : "min-w-0 space-y-2"
            }
          >
            <button
              type="button"
              onClick={() => setSelected(index)}
              aria-label={`Enlarge photo ${index + 1} of ${item.place.name}`}
              className={`relative block w-full overflow-hidden rounded-2xl bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${index === 0 ? "aspect-[16/9]" : "aspect-[4/3]"}`}
            >
              <span className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                <Images className="size-6" aria-hidden="true" />
              </span>
              <img
                src={safeExternalUrl(photo.url)}
                alt={`${item.place.name}, photo ${index + 1}`}
                loading="lazy"
                referrerPolicy="no-referrer"
                className="relative size-full object-cover transition-transform duration-300 motion-safe:hover:scale-[1.025]"
                onError={(event) => {
                  event.currentTarget.hidden = true;
                }}
              />
            </button>
            <figcaption>
              <PhotoAttribution item={item} photo={photo} />
            </figcaption>
          </figure>
        ))}
      </div>
      <GoogleAttribution />
      <Dialog
        open={!!selectedPhoto}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-4xl">
          <DialogTitle className="pr-8">{item.place.name}</DialogTitle>
          <DialogDescription>Place photo from Google Maps</DialogDescription>
          {selectedPhoto && (
            <>
              <img
                src={safeExternalUrl(selectedPhoto.url)}
                alt={item.place.name}
                referrerPolicy="no-referrer"
                className="max-h-[65dvh] w-full rounded-xl object-contain"
              />
              <PhotoAttribution item={item} photo={selectedPhoto} />
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

export function PlaceReader({ placeId }: { placeId: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const [view, setView] = useState<"place" | "map">("place");
  const [width, setWidth] = useState(45);
  const frame = useRef<HTMLDivElement>(null);
  const query = useQuery({
    queryKey: ["discovery-place", placeId],
    queryFn: ({ signal }) => readPlace(placeId, signal),
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });
  const returnParams = new URLSearchParams(params.toString());
  returnParams.set("tab", "places");
  const back = `/explore?${returnParams}`;
  if (query.isPending)
    return (
      <div role="status" className="p-8 text-sm text-muted-foreground">
        Loading place…
      </div>
    );
  if (query.isError)
    return (
      <div role="alert" className="space-y-4 overflow-y-auto p-8">
        <p>{query.error.message}</p>
        <Button variant="outline" onClick={() => void query.refetch()}>
          Try again
        </Button>
        <Link href={back} className="block text-primary">
          Back to Places
        </Link>
      </div>
    );
  const item = query.data;
  const place = item.place;
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const website = safeExternalUrl(place.website);
  const mapLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${encodeURIComponent(place.providerPlaceId)}`;
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border bg-card px-4 py-2">
        <Link
          href={back}
          onClick={(event) => {
            if (
              sessionStorage.getItem("navio-places-return") === placeId &&
              window.history.length > 1
            ) {
              event.preventDefault();
              sessionStorage.removeItem("navio-places-return");
              router.back();
            }
          }}
          className="inline-flex min-h-10 items-center gap-2 text-sm font-medium"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to Places
        </Link>
        <div className="flex gap-1 lg:hidden">
          {(["place", "map"] as const).map((mode) => (
            <Button
              key={mode}
              size="sm"
              variant={view === mode ? "secondary" : "ghost"}
              aria-pressed={view === mode}
              onClick={() => setView(mode)}
            >
              {mode === "place" ? "Place" : "Map"}
            </Button>
          ))}
        </div>
      </div>
      <div
        ref={frame}
        className="relative flex min-h-0 flex-1 overflow-hidden"
        style={{ "--reader-width": `${width}%` } as CSSProperties}
      >
        <article
          aria-label="Place information"
          tabIndex={0}
          className={`${view === "place" ? "block" : "hidden"} min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring lg:block lg:flex-none lg:w-[var(--reader-width)]`}
        >
          <div className="mx-auto max-w-2xl space-y-7 p-5 pb-10 sm:p-7">
            <header className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                {place.category || "A place to discover"}
              </p>
              <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
                {place.name}
              </h1>
              {place.description && (
                <p className="text-sm leading-7 text-muted-foreground">
                  {place.description}
                </p>
              )}
              <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
                {place.rating != null && (
                  <p className="flex items-center gap-2 text-sm">
                    <Star
                      className="size-4 shrink-0 text-accent"
                      aria-hidden="true"
                    />
                    <span>
                      {place.rating.toFixed(1)}{" "}
                      <span className="text-muted-foreground">
                        · {(place.reviewCount || 0).toLocaleString()} Google
                        reviews
                      </span>
                    </span>
                  </p>
                )}
                {place.address && (
                  <p className="flex items-start gap-2 text-sm leading-6 text-muted-foreground">
                    <MapPin
                      className="mt-1 size-4 shrink-0"
                      aria-hidden="true"
                    />
                    <span>{place.address}</span>
                  </p>
                )}
                <a
                  href="#reader-visit-details"
                  className="inline-flex min-h-8 items-center gap-2 text-sm font-medium text-primary"
                >
                  <Clock className="size-4" aria-hidden="true" />
                  Opening hours & visit details
                </a>
                {item.businessStatus === "CLOSED_PERMANENTLY" ? (
                  <p className="rounded-xl bg-destructive/5 p-3 text-sm text-destructive">
                    Google Maps lists this place as permanently closed.
                  </p>
                ) : (
                  <AddPlaceToPlan placeId={place.providerPlaceId} />
                )}
                {item.businessStatus === "CLOSED_TEMPORARILY" && (
                  <p className="text-sm text-muted-foreground">
                    Temporarily closed according to Google Maps. Check before
                    visiting.
                  </p>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Place information from Google Maps.
              </p>
            </header>
            <DiscoveryPlanBanner />
            {item.reason && (
              <aside className="rounded-2xl border border-primary/10 bg-primary/5 p-4">
                <h2 className="text-sm font-semibold">Why consider it</h2>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  {item.reason}
                </p>
              </aside>
            )}
            <ReaderPhotos key={`photos:${placeId}`} item={item} />
            <section
              id="reader-visit-details"
              className="scroll-mt-5 space-y-4 rounded-2xl border border-border bg-card p-5"
            >
              <h2 className="text-lg font-semibold">Planning a visit</h2>
              <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-medium">
                  <Clock className="size-4 text-primary" aria-hidden="true" />
                  Opening hours
                </h3>
                {place.openingHours?.weekdayDescriptions?.length ? (
                  <dl className="space-y-2 text-sm text-muted-foreground">
                    {place.openingHours.weekdayDescriptions.map((day) => {
                      const split = day.indexOf(":");
                      return split > 0 ? (
                        <div
                          key={day}
                          className="flex flex-wrap justify-between gap-x-4 gap-y-1 border-b border-border/50 pb-2 last:border-0"
                        >
                          <dt>{day.slice(0, split)}</dt>
                          <dd className="font-medium text-foreground">
                            {day.slice(split + 1).trim()}
                          </dd>
                        </div>
                      ) : (
                        <div key={day}>
                          <dt className="sr-only">Hours</dt>
                          <dd>{day}</dd>
                        </div>
                      );
                    })}
                  </dl>
                ) : (
                  <p className="text-sm leading-6 text-muted-foreground">
                    {place.openingHours?.summary ||
                      "Opening hours are not available. Check with the place before visiting."}
                  </p>
                )}
                <p className="text-xs leading-5 text-muted-foreground">
                  Hours may change, especially on holidays.
                </p>
              </div>
              {place.phone && (
                <p className="flex items-center gap-2 text-sm">
                  <Phone className="size-4 text-primary" aria-hidden="true" />
                  {place.phone}
                </p>
              )}
              <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-3">
                {website && (
                  <a
                    href={website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-primary"
                  >
                    Website{" "}
                    <ExternalLink className="size-3.5" aria-hidden="true" />
                  </a>
                )}
                <a
                  href={mapLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-primary"
                >
                  Google Maps{" "}
                  <ExternalLink className="size-3.5" aria-hidden="true" />
                </a>
              </div>
            </section>
            {/* [DEFERRED][EXCLUDE_FROM_REPORT] PLACES_EDITORIAL - do not enable without a new request.
            <PlaceArticle key={`article:${placeId}`} item={item} />
            */}
            <GoogleAttribution />
          </div>
        </article>
        <div
          role="separator"
          aria-label="Resize place and map panels"
          aria-orientation="vertical"
          aria-valuenow={width}
          aria-valuemin={35}
          aria-valuemax={60}
          tabIndex={0}
          className="z-10 hidden w-1.5 shrink-0 cursor-col-resize touch-none bg-border/60 hover:bg-primary/30 focus-visible:bg-primary/40 lg:block"
          onDoubleClick={() => setWidth(45)}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
              event.preventDefault();
              setWidth((value) =>
                Math.max(
                  35,
                  Math.min(60, value + (event.key === "ArrowLeft" ? -2 : 2)),
                ),
              );
            }
          }}
          onPointerDown={(event) =>
            event.currentTarget.setPointerCapture(event.pointerId)
          }
          onPointerMove={(event) => {
            if (
              !event.currentTarget.hasPointerCapture(event.pointerId) ||
              !frame.current
            )
              return;
            const rect = frame.current.getBoundingClientRect();
            setWidth(
              Math.max(
                35,
                Math.min(60, ((event.clientX - rect.left) / rect.width) * 100),
              ),
            );
          }}
          onPointerUp={(event) =>
            event.currentTarget.releasePointerCapture(event.pointerId)
          }
        />
        <div
          aria-label="Place map"
          className={`${view === "map" ? "block" : "hidden"} min-h-0 min-w-0 flex-1 overflow-hidden bg-muted lg:block`}
        >
          {key ? (
            <APIProvider apiKey={key}>
              <AppearanceGoogleMap
                defaultCenter={place.location}
                defaultZoom={15}
                {...readerMapOptions}
                className="size-full"
                style={{ width: "100%", height: "100%" }}
              >
                <ReaderMapResize />
                <AppearanceGoogleMarker position={place.location}>
                  <span role="img" aria-label={place.name} className="relative block">
                    <MapPinMark color="var(--map-pin)" foreground="var(--map-pin-foreground)" selected>
                      <span className="size-2.5 rounded-full bg-current" />
                    </MapPinMark>
                  </span>
                </AppearanceGoogleMarker>
              </AppearanceGoogleMap>
            </APIProvider>
          ) : (
            <div className="flex size-full items-center justify-center p-6">
              <a
                href={mapLink}
                target="_blank"
                rel="noreferrer"
                className="text-primary"
              >
                View location on Google Maps →
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReaderMapResize() {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    let frame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (map.getDiv().clientWidth && map.getDiv().clientHeight)
          google.maps.event.trigger(map, "resize");
      });
    });
    observer.observe(map.getDiv());
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [map]);
  return null;
}
