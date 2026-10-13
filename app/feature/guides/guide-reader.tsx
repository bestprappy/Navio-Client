"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSetAtom } from "jotai";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button.variants";
import { Skeleton } from "@/components/ui/skeleton";
import { NoteContent } from "@/components/block-editor/note-content";
import { CategoryIcon } from "../admin/_components/guides/category-icon";
import { GuideSectionHeading } from "../planner/planId/_components/guide/guide-section-list";
import {
  GuideDocumentCard,
  GuidePlaceTagList,
} from "../planner/planId/_components/guide/guide-document-card";
import { PlannerErrorBoundary } from "../planner/_components/planner-error-boundary";
import {
  GuideReaderWorkspace,
  guideReaderViewAtom,
} from "./guide-reader-workspace";
import { GuideReaderMap } from "./guide-reader-map";
import { guideReadingBlocks } from "./guide-reading-model";
import { readTravelerGuide, travelerGuideKeys } from "./user-guides-api";
import { GuideAuthor } from "./guide-author";
import { GuideReadingHero } from "./guide-reading-hero";

export function GuideReader({ guideId }: { guideId: string }) {
  const result = useQuery({
    queryKey: [...travelerGuideKeys, "detail", guideId],
    queryFn: () => readTravelerGuide(guideId),
    staleTime: 0,
  });
  if (result.isPending)
    return (
      <div
        role="status"
        aria-label="Loading guide"
        className="mx-auto max-w-5xl space-y-6 px-4 py-8"
      >
        <Skeleton className="aspect-3/1 rounded-xl" />
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-40" />
      </div>
    );
  if (result.isError)
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-12">
        <h1 className="text-2xl font-semibold">Guide unavailable</h1>
        <p role="alert" className="text-muted-foreground">
          {result.error.message}
        </p>
        <div className="flex gap-3">
          <Link
            href="/explore?tab=guides"
            className={buttonVariants({ variant: "outline" })}
          >
            Back to guides
          </Link>
          <Button onClick={() => void result.refetch()}>Try again</Button>
        </div>
      </div>
    );
  return <LoadedGuideReader key={result.data.guide.id} {...result.data} />;
}
function LoadedGuideReader({
  guide,
  author,
}: Awaited<ReturnType<typeof readTravelerGuide>>) {
  const blocks = useMemo(() => guideReadingBlocks(guide), [guide]);
  const places = useMemo(
    () => blocks.filter((block) => block.kind === "place"),
    [blocks],
  );
  const sections = blocks.flatMap((block, index) =>
    block.kind === "section" ? [{ ...block, elementId: `reading-section-${index}` }] : [],
  );
  const [selected, setSelected] = useState<string | null>(null);
  const setView = useSetAtom(guideReaderViewAtom);
  function select(id: string, source: "text" | "map" = "text") {
    setSelected(id);
    if (source === "map" && window.matchMedia("(min-width: 64rem)").matches) {
      window.requestAnimationFrame(() =>
        document
          .getElementById(`reading-place-${id}`)
          ?.scrollIntoView({ block: "nearest", behavior: "auto" }),
      );
    } else if (source === "text" && window.matchMedia("(max-width: 63.999rem)").matches) {
      setView("map");
    }
  }
  return (
    <GuideReaderWorkspace
      document={
        <>
          <div className="sticky top-0 z-20 flex min-h-14 items-center gap-3 border-b border-border bg-background/95 px-3 backdrop-blur-sm">
            <Link
              href="/explore?tab=guides"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              <ArrowLeft aria-hidden="true" />
              Explore guides
            </Link>
            <p className="min-w-0 truncate text-sm text-muted-foreground">
              {guide.name}
            </p>
          </div>
          <article aria-labelledby="guide-title" className="min-w-0 pb-16">
            <GuideReadingHero
              title={guide.name}
              location={guide.country || guide.destination.name}
              coverPlaceId={guide.coverPlaceId}
              author={<GuideAuthor author={author} onMedia />}
            />
            <div className="space-y-8 px-4 pt-5 sm:px-5">
              <div className="space-y-4">
                {guide.description ? (
                  <p className="max-w-prose whitespace-pre-wrap text-base leading-7 text-muted-foreground">
                    {guide.description}
                  </p>
                ) : null}
                {sections.length ? (
                  <nav aria-label={`${guide.name} guide sections`} className="flex flex-wrap gap-2">
                    {sections.map((section) => (
                      <Button key={section.elementId} type="button" variant="outline" size="sm" className="max-w-full rounded-full whitespace-normal text-left" onClick={() => document.getElementById(section.elementId)?.scrollIntoView({ block: "start" })}>
                        {section.category ? <CategoryIcon category={section.category} className="size-4 shrink-0" /> : null}
                        {section.category?.name ?? "Places"}
                      </Button>
                    ))}
                  </nav>
                ) : null}
              </div>
              <div className="flex flex-col gap-4">
                {blocks.map((block, index) => {
                  if (block.kind === "text")
                    return (
                      <NoteContent
                        key={index}
                        content={block.markdown}
                        mode="readonly"
                        size="reading"
                      />
                    );
                  if (block.kind === "section")
                    return (
                      <section
                        key={index}
                        id={`reading-section-${index}`}
                        aria-labelledby={`reading-section-${index}-title`}
                        className="scroll-mt-16 pt-6"
                      >
                        <GuideSectionHeading
                          section={{ id: block.id, title: block.category?.name ?? "Places", iconId: block.category?.iconId ?? "landmark", colorId: block.category?.colorId ?? "slate" }}
                          titleId={`reading-section-${index}-title`}
                          count={`${block.placeCount} ${block.placeCount === 1 ? "place" : "places"}`}
                        />
                      </section>
                    );
                  const { place } = block;
                  const url =
                    place.provider === "GOOGLE"
                      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${encodeURIComponent(place.providerPlaceId)}`
                      : `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`;
                  return (
                    <div key={index} id={`reading-place-${place.id}`} className="scroll-mt-16">
                      <GuideDocumentCard
                        place={place}
                        number={block.number}
                        colorId={block.colorId}
                        selected={selected === place.id}
                        onSelect={() => select(place.id)}
                        footerStart={<GuidePlaceTagList tags={place.tags} />}
                      >
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Open ${place.name} location`}
                          className={buttonVariants({
                            variant: "outline",
                            size: "sm",
                          })}
                        >
                          Location
                          <ExternalLink
                            aria-hidden="true"
                            className="size-3.5"
                          />
                        </a>
                      </GuideDocumentCard>
                    </div>
                  );
                })}
              </div>
            </div>
          </article>
        </>
      }
      map={
        <PlannerErrorBoundary
          fallbackTitle="The map could not be displayed"
          fallbackDescription="Use a place's location link to open it in Maps."
        >
          <GuideReaderMap
            guide={guide}
            places={places}
            selected={selected}
            onSelect={(id) => select(id, "map")}
            onClose={() => setSelected(null)}
          />
        </PlannerErrorBoundary>
      }
    />
  );
}
