"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAtomValue, useSetAtom } from "jotai";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BookX, Map as MapIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button.variants";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { PlannerErrorBoundary } from "../../../../planner/_components/planner-error-boundary";
import { activeGuideListAtom, guidePlaceCandidateAtom, guideDraftsAtom, loadGuideDraftAtom, selectedGuidePlaceAtom } from "../guides.atoms";
import { getGuide, GuideApiError, guideKeys } from "../guides-api";
import { GuideActions, SaveIndicator } from "./guide-editor-toolbar";
import { useGuideAutosave } from "./use-guide-autosave";
import type { Guide } from "../guide-model";
import { CategoryBar } from "./category-bar";
import { GuideBody } from "./guide-body";
import { GuideBanner, GuideHeading } from "./guide-cover";
import { GuideEditorProvider } from "./guide-editor-context";
import { GuideMap } from "./guide-map";

const WIDE_QUERY = "(min-width: 64rem)";

function subscribeWide(onChange: () => void) {
  const query = window.matchMedia(WIDE_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** Whether the map fits beside the text; one map is mounted either way. */
function useIsWide(): boolean {
  return useSyncExternalStore(subscribeWide, () => window.matchMedia(WIDE_QUERY).matches, () => true);
}

/** Write a guide on the left while its places appear on the map on the right. */
export function GuideEditor({ guideId }: { guideId: string }) {
  const result = useQuery({ queryKey: guideKeys.detail(guideId), queryFn: () => getGuide(guideId), refetchOnWindowFocus: false });
  const drafts = useAtomValue(guideDraftsAtom);
  const loadDraft = useSetAtom(loadGuideDraftAtom);
  useEffect(() => {
    if (result.data && !drafts[guideId]) loadDraft(result.data);
  }, [drafts, guideId, loadDraft, result.data]);
  if (result.isPending) return <GuideEditorSkeleton />;
  if (result.isError) {
    if (result.error instanceof GuideApiError && result.error.kind === "notFound") return <GuideNotFound />;
    return <div role="alert" className="flex flex-col items-start gap-3 p-6"><p>{result.error.message}</p><Button onClick={() => void result.refetch()}>Try again</Button></div>;
  }
  const guide = drafts[guideId];
  if (!guide) return <GuideEditorSkeleton />;
  return <LoadedGuideEditor key={guideId} guide={guide} reload={async () => {
    const latest = await getGuide(guideId);
    loadDraft(latest);
  }} />;
}

function LoadedGuideEditor({ guide, reload }: { guide: Guide; reload: () => Promise<void> }) {
  const router = useRouter();
  const guideId = guide.id;
  const { status, flush, reset } = useGuideAutosave(guideId);
  const [reloadError, setReloadError] = useState<string | null>(null);
  const isWide = useIsWide();
  const [mapOpen, setMapOpen] = useState(false);
  const setSelected = useSetAtom(selectedGuidePlaceAtom);
  const setCandidate = useSetAtom(guidePlaceCandidateAtom);
  const setActiveList = useSetAtom(activeGuideListAtom);

  useEffect(() => {
    // Selection, a pending place and the working list belong to the guide they were made in.
    return () => {
      setSelected(null);
      setCandidate(null);
      setActiveList(null);
    };
  }, [guideId, setActiveList, setCandidate, setSelected]);

  return (
    <GuideEditorProvider guide={guide}>
      <div className="flex h-full min-h-0">
        <div className="flex min-w-0 flex-1 flex-col overflow-y-auto overscroll-contain">
          <div className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/95 px-3 backdrop-blur-sm sm:px-4">
            <Link href="/admin/guides" onClick={(event) => {
              if (status.kind === "pending" || status.kind === "saving" || status.kind === "error") {
                event.preventDefault();
                void flush().then((saved) => { if (saved) router.push("/admin/guides"); });
              }
            }} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "shrink-0")}>
              <ArrowLeft aria-hidden="true" />
              Guides
            </Link>
            <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-muted-foreground">
              <span className="text-foreground">{guide.name || "Untitled guide"}</span>
            </p>
            <SaveIndicator status={status} updatedAt={guide.updatedAt} updatedByName={guide.updatedByName} />
            </div>
            <GuideActions status={status} flush={flush} />
            {isWide ? null : (
              <Button type="button" variant="outline" size="sm" onClick={() => setMapOpen(true)}>
                <MapIcon aria-hidden="true" />
                Map
              </Button>
            )}
          </div>
          {status.kind === "error" || status.kind === "conflict" || status.kind === "gone" ? (
            <div role="alert" className="flex flex-wrap items-center gap-3 border-b border-border bg-muted p-4 text-sm">
              <p className="min-w-0 flex-1">{status.message}</p>
              {status.kind === "error" ? <Button size="sm" onClick={() => void flush()}>Retry save</Button> : null}
              {status.kind === "conflict" ? <Button size="sm" onClick={() => {
                void reload().then(() => { reset(); setReloadError(null); }).catch((error: unknown) => setReloadError(error instanceof Error ? error.message : "Could not reload this guide."));
              }}>Reload latest guide</Button> : null}
              {reloadError ? <p>{reloadError}</p> : null}
            </div>
          ) : null}

          <article aria-label={`${guide.name || "Untitled"} guide`} className="pb-32">
            <GuideBanner />
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-5 pt-8 sm:px-10">
              <GuideHeading />
              <CategoryBar />
              <PlannerErrorBoundary
                fallbackTitle="The guide editor stopped working"
                fallbackDescription="Reload the page to open the last version saved to Navio."
              >
                <GuideBody />
              </PlannerErrorBoundary>
            </div>
          </article>
        </div>

        {isWide ? (
          <aside aria-label="Guide map" className="w-2/5 shrink-0 border-l border-border xl:w-1/2">
            <MapBoundary />
          </aside>
        ) : (
          <Sheet open={mapOpen} onOpenChange={setMapOpen}>
            <SheetContent side="bottom" className="h-[85dvh] gap-0 p-0">
              <SheetHeader className="border-b border-border">
                <SheetTitle>{guide.name} on the map</SheetTitle>
                <SheetDescription>Pins are numbered like the places in each list.</SheetDescription>
              </SheetHeader>
              <div className="min-h-0 flex-1">
                <MapBoundary />
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </GuideEditorProvider>
  );
}

/** A failing map leaves the text, and everything written in it, untouched. */
function MapBoundary() {
  return (
    <PlannerErrorBoundary fallbackTitle="The map stopped working" fallbackDescription="Your guide is saved. Reload the page to bring the map back.">
      <GuideMap />
    </PlannerErrorBoundary>
  );
}

function GuideNotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-start gap-3 px-6 py-16">
      <BookX aria-hidden="true" className="size-6 text-muted-foreground" />
      <h1 className="text-2xl font-semibold tracking-tight">Guide not found</h1>
      <p className="text-muted-foreground">
        This guide no longer exists. Another admin may have deleted it.
      </p>
      <Link href="/admin/guides" className={buttonVariants({ variant: "outline" })}>
        <ArrowLeft aria-hidden="true" />
        Back to guides
      </Link>
    </div>
  );
}

function GuideEditorSkeleton() {
  return (
    <div role="status" aria-label="Loading guide" className="flex h-full">
      <div className="flex flex-1 flex-col">
        <Skeleton className="h-14 rounded-none" />
        <Skeleton className="h-48 rounded-none sm:h-64" />
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-5 pt-8 sm:px-10">
          <Skeleton className="h-12 w-2/3" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
      <Skeleton className="hidden w-2/5 rounded-none lg:block xl:w-1/2" />
    </div>
  );
}
