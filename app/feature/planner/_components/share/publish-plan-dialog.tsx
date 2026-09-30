"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Compass,
  ExternalLink,
  Eye,
  Globe,
  Link2,
  Loader2,
  RefreshCw,
  UserRound,
} from "lucide-react";

import { explorePlanPath } from "@/app/feature/explore/_components/shared-plans/explore-plans-api";
import { currentUserProfileQueryKey, getMyProfile } from "@/lib/profile-api";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";

import { PlannerApiError } from "../planner-api";
import {
  NO_PUBLICATION_OPTIONS,
  sharedPlanPath,
  sharedPlanUrl,
  type PublicationOptions,
} from "./publication-api";
import { ShareOptionRow } from "./share-option-row";
import { SharedLinkField } from "./shared-link-field";
import { SharedPlanContent } from "./shared-plan-content";
import {
  usePublication,
  usePublicationPreview,
  usePublishPlan,
  useStopSharing,
  useUpdateExploreListing,
} from "./use-publication";

type PublishPlanDialogProps = {
  tripId: string;
  tripTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type View = "settings" | "preview";

function sameOptions(a: PublicationOptions, b: PublicationOptions): boolean {
  return (
    a.includeDates === b.includeDates &&
    a.includeNotes === b.includeNotes &&
    a.includeBudget === b.includeBudget
  );
}

function formatPublishedAt(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function PublishPlanDialog({ tripId, tripTitle, open, onOpenChange }: PublishPlanDialogProps) {
  const publicationQuery = usePublication(tripId, open);
  const publishMutation = usePublishPlan(tripId);
  const stopSharingMutation = useStopSharing(tripId);
  const listingMutation = useUpdateExploreListing(tripId);

  const [view, setView] = useState<View>("settings");
  const [options, setOptions] = useState<PublicationOptions>(NO_PUBLICATION_OPTIONS);
  const [isConfirmingStop, setIsConfirmingStop] = useState(false);
  /** Set once the owner has edited the form, so a refetch cannot overwrite their choices. */
  const [hasEditedOptions, setHasEditedOptions] = useState(false);
  /** Draft Explore choice for a first publish. Once published, the server's value is the truth. */
  const [draftListInExplore, setDraftListInExplore] = useState(false);
  const [publicTitle, setPublicTitle] = useState(tripTitle);
  const [hasEditedTitle, setHasEditedTitle] = useState(false);

  const publication = publicationQuery.data;
  const isPublished = publication?.published === true;
  const listedInExplore =
    publication?.published === true ? publication.listedInExplore : draftListInExplore;

  const ownerName = useOwnerDisplayName(open);
  // What recipients see now: the frozen byline once published, else the name
  // this publish would use.
  const byline =
    (publication?.published === true ? publication.authorDisplayName : ownerName) ??
    "a Navio traveler";

  // Adopt the saved settings once, when they arrive. Re-syncing on every fetch
  // would discard a checkbox the owner ticked while the query was revalidating.
  useEffect(() => {
    if (!publication || hasEditedOptions) return;
    setOptions(publication.published ? publication.options : NO_PUBLICATION_OPTIONS);
  }, [publication, hasEditedOptions]);

  useEffect(() => {
    if (hasEditedTitle) return;
    setPublicTitle(publication?.published ? publication.title ?? tripTitle : tripTitle);
  }, [publication, tripTitle, hasEditedTitle]);

  // A fresh open is a fresh decision; nothing from the last visit carries over.
  useEffect(() => {
    if (open) return;
    setView("settings");
    setIsConfirmingStop(false);
    setHasEditedOptions(false);
    setDraftListInExplore(false);
    setHasEditedTitle(false);
    publishMutation.reset();
    stopSharingMutation.reset();
    listingMutation.reset();
    // Mutations are stable across renders; resetting them is the whole intent here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const previewQuery = usePublicationPreview(tripId, options, open && view === "preview");

  const optionsChanged = useMemo(
    () => (publication?.published ? !sameOptions(options, publication.options) : false),
    [options, publication],
  );

  const isBusy =
    publishMutation.isPending || stopSharingMutation.isPending || listingMutation.isPending;
  const needsUpdate =
    publication?.published === true &&
    (publication.hasUnpublishedChanges || publication.staleSanitizer || optionsChanged || publicTitle.trim() !== (publication.title ?? tripTitle));

  function updateOption(key: keyof PublicationOptions, checked: boolean) {
    setHasEditedOptions(true);
    setOptions((current) => ({ ...current, [key]: checked }));
  }

  function handlePublish() {
    publishMutation.mutate(
      {
        options,
        expectedRevision: publication?.published ? publication.revision : null,
        listInExplore: listedInExplore,
        authorDisplayName: ownerName,
        title: publicTitle.trim(),
      },
      { onSuccess: () => setHasEditedOptions(false) },
    );
  }

  function handleExploreChange(checked: boolean) {
    if (publication?.published) {
      // Listing refreshes the byline to the owner's current name; unlisting
      // leaves it as published.
      listingMutation.mutate({
        listedInExplore: checked,
        authorDisplayName: checked ? ownerName : null,
      });
    } else {
      setDraftListInExplore(checked);
    }
  }

  const publishError = publishMutation.error;
  const isConflict = publishError instanceof PlannerApiError && publishError.status === 409;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!isBusy) onOpenChange(next);
      }}
    >
      {/* grid-rows keeps the header and footer fixed while only the body scrolls;
          the primitive's own p-4 stays, because DialogFooter's negative margins
          are measured against it. */}
      <DialogContent className="grid max-h-[90dvh] grid-rows-[auto_1fr_auto] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {view === "preview" ? (
              <>
                <Eye className="size-4" aria-hidden="true" />
                Preview shared plan
              </>
            ) : (
              <>
                <Globe className="size-4" aria-hidden="true" />
                Publish plan as a link
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {view === "preview"
              ? `This is exactly what people will see of ${tripTitle}.`
              : "Anyone with the link can view this published version. They cannot change your original plan."}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 overflow-y-auto">
          {view === "preview" ? (
            <PreviewBody
              isLoading={previewQuery.isPending}
              isError={previewQuery.isError}
              onRetry={() => void previewQuery.refetch()}
              plan={previewQuery.data ? { ...previewQuery.data, title: publicTitle.trim() || previewQuery.data.title } : undefined}
            />
          ) : publicationQuery.isPending ? (
            <div className="space-y-3" aria-busy="true">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : publicationQuery.isError ? (
            <div className="space-y-3">
              <p role="alert" className="text-sm text-destructive">
                Sharing settings could not be loaded.
              </p>
              <Button type="button" variant="outline" size="sm" onClick={() => void publicationQuery.refetch()}>
                <RefreshCw className="size-4" aria-hidden="true" />
                Try again
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <label className="flex flex-col gap-2 text-sm font-medium">Shared plan name
                <Input value={publicTitle} maxLength={120} disabled={isBusy} onChange={(event) => { setHasEditedTitle(true); setPublicTitle(event.target.value); }} placeholder="Top 10 things to do in Japan" />
                <span className="text-xs font-normal text-muted-foreground">This name appears on the shared page and Explore. Your private trip keeps its own name.</span>
              </label>
              <section aria-label="Who can see this plan" className="space-y-2">
                <AccessRow
                  icon={<UserRound className="size-4" aria-hidden="true" />}
                  who="You"
                  what="Edit and manage sharing"
                />
                <AccessRow
                  icon={<Link2 className="size-4" aria-hidden="true" />}
                  who="Anyone with the link"
                  what="View only"
                />
                {listedInExplore && (
                  <AccessRow
                    icon={<Compass className="size-4" aria-hidden="true" />}
                    who="Anyone browsing Explore"
                    what="View only"
                  />
                )}
                <p className="text-sm text-muted-foreground">People can forward this link.</p>
                <p className="text-sm text-muted-foreground">
                  Shown as <span className="font-medium text-foreground">{byline}</span>.{" "}
                  <Link
                    href="/settings/profile"
                    className="underline underline-offset-4 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-sm"
                  >
                    Change your name
                  </Link>
                </p>
              </section>

              <section aria-labelledby="share-content-heading" className="space-y-3">
                <div>
                  <h3 id="share-content-heading" className="text-sm font-semibold text-foreground">
                    Shared: itinerary, places and charging stops
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Private saved locations are always hidden.
                  </p>
                </div>

                <ShareOptionRow
                  label="Include travel dates"
                  description="Shows real dates instead of Day 1, Day 2."
                  checked={options.includeDates}
                  disabled={isBusy}
                  onCheckedChange={(checked) => updateOption("includeDates", checked)}
                />
                <ShareOptionRow
                  label="Include notes and checklists"
                  description="Your notes may contain personal details. Check them before sharing."
                  checked={options.includeNotes}
                  disabled={isBusy}
                  onCheckedChange={(checked) => updateOption("includeNotes", checked)}
                />
                <ShareOptionRow
                  label="Include budget and expenses"
                  description="Shows your total budget and each stop's cost."
                  checked={options.includeBudget}
                  disabled={isBusy}
                  onCheckedChange={(checked) => updateOption("includeBudget", checked)}
                />
              </section>

              <section aria-labelledby="share-explore-heading" className="space-y-3">
                <h3 id="share-explore-heading" className="text-sm font-semibold text-foreground">
                  Explore
                </h3>
                <ShareOptionRow
                  label="List on Explore"
                  description={
                    isPublished
                      ? `Anyone browsing Navio can find and read this plan, shared by ${ownerName ?? "a Navio traveler"}. This changes right away.`
                      : `Anyone browsing Navio can find and read this plan, shared by ${byline}.`
                  }
                  checked={listedInExplore}
                  disabled={isBusy}
                  onCheckedChange={handleExploreChange}
                />
                {listingMutation.isPending && (
                  <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    {listingMutation.variables?.listedInExplore
                      ? "Listing on Explore…"
                      : "Removing from Explore…"}
                  </p>
                )}
                {listingMutation.isError && (
                  <p role="alert" className="text-sm text-destructive">
                    {listingMutation.variables?.listedInExplore
                      ? "The plan could not be listed on Explore. Try again."
                      : "The plan could not be removed from Explore. Try again."}
                  </p>
                )}
                {isPublished && !listedInExplore && listingMutation.isSuccess && (
                  <p role="status" className="text-sm text-muted-foreground">
                    Removed from Explore. The link still works; stop sharing to turn it off.
                  </p>
                )}
                {isPublished && listedInExplore && publication.published && (
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="h-auto px-0"
                    render={<Link href={explorePlanPath(publication.token)} />}
                  >
                    <Compass className="size-4" aria-hidden="true" />
                    View on Explore
                  </Button>
                )}
              </section>

              {isPublished && publication.published && (
                <section aria-label="Published link" className="space-y-3 border-t border-border pt-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-sm font-semibold text-foreground">Link published</h3>
                    {publication.publishedAt && (
                      <p className="text-xs text-muted-foreground">
                        {formatPublishedAt(publication.publishedAt)}
                      </p>
                    )}
                  </div>

                  <SharedLinkField url={sharedPlanUrl(publication.token)} />

                  <Button type="button" variant="outline" size="sm" render={
                    <a href={sharedPlanPath(publication.token)} target="_blank" rel="noopener noreferrer" />
                  }>
                    <ExternalLink className="size-4" aria-hidden="true" />
                    Open shared plan
                  </Button>

                  {publication.staleSanitizer ? (
                    <p role="alert" className="text-sm text-destructive">
                      This link is paused because Navio&apos;s privacy rules changed. Publish again to
                      restore it under the current rules.
                    </p>
                  ) : needsUpdate ? (
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Unpublished changes.</span>{" "}
                      {optionsChanged
                        ? "Your new content settings apply when you update the published plan."
                        : "Changes to your original stay private until you update the published plan."}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Changes to your original stay private until you update the published plan.
                    </p>
                  )}

                  {isConfirmingStop ? (
                    <div className="space-y-3 rounded-lg border border-destructive/40 bg-destructive/5 p-3">
                      <p className="text-sm text-foreground">
                        People with this link will no longer be able to open the plan. Copies they
                        already made or saved stay with them.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          disabled={isBusy}
                          onClick={() =>
                            stopSharingMutation.mutate(undefined, {
                              onSuccess: () => setIsConfirmingStop(false),
                            })
                          }
                        >
                          {stopSharingMutation.isPending && (
                            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                          )}
                          Stop sharing
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={isBusy}
                          onClick={() => setIsConfirmingStop(false)}
                        >
                          Keep sharing
                        </Button>
                      </div>
                      {stopSharingMutation.isError && (
                        <p role="alert" className="text-sm text-destructive">
                          Sharing could not be stopped. Please try again.
                        </p>
                      )}
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      disabled={isBusy}
                      onClick={() => setIsConfirmingStop(true)}
                    >
                      Stop sharing
                    </Button>
                  )}
                </section>
              )}

              {publishMutation.isError && (
                <div role="alert" className="space-y-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3">
                  <p className="text-sm text-foreground">
                    {isConflict
                      ? "This plan changed somewhere else, so nothing was published."
                      : "The plan could not be published. Your settings are still here."}
                  </p>
                  {isConflict && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        publishMutation.reset();
                        void publicationQuery.refetch();
                      }}
                    >
                      <RefreshCw className="size-4" aria-hidden="true" />
                      Refresh and review
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {view === "preview" ? (
            <Button type="button" variant="outline" onClick={() => setView("settings")}>
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={isBusy || publicationQuery.isPending || publicationQuery.isError}
                onClick={() => setView("preview")}
              >
                <Eye className="size-4" aria-hidden="true" />
                Preview shared plan
              </Button>
              <Button
                type="button"
                disabled={
                  isBusy ||
                  publicationQuery.isPending ||
                  publicationQuery.isError ||
                  (isPublished && !needsUpdate)
                }
                onClick={handlePublish}
              >
                {publishMutation.isPending && (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                )}
                {publishMutation.isPending
                  ? "Publishing…"
                  : isPublished
                    ? "Update published plan"
                    : "Publish link"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * The owner's current profile name, for the byline. Shares its cache with the
 * profile menu, so opening the dialog usually costs no request. Falls back to
 * the session name, and to null ("a Navio traveler") when neither is known.
 */
function useOwnerDisplayName(enabled: boolean): string | null {
  const { data: session, status } = useSession();
  const profile = useQuery({
    queryKey: currentUserProfileQueryKey(session?.user?.id),
    queryFn: getMyProfile,
    enabled: enabled && status === "authenticated",
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
  const name = profile.data?.displayName?.trim() || session?.user?.name?.trim();
  return name ? name : null;
}

function AccessRow({ icon, who, what }: { icon: React.ReactNode; who: string; what: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2">
      <span className="flex items-center gap-2 text-sm font-medium text-foreground">
        {icon}
        {who}
      </span>
      {/* Stated as words, not a colour or an icon alone. */}
      <span className="text-sm text-muted-foreground">{what}</span>
    </div>
  );
}

function PreviewBody({
  isLoading,
  isError,
  onRetry,
  plan,
}: {
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  plan: Parameters<typeof SharedPlanContent>[0]["plan"] | undefined;
}) {
  if (isLoading) {
    return (
      <div className="space-y-3" aria-busy="true">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (isError || !plan) {
    return (
      <div className="space-y-3">
        <p role="alert" className="text-sm text-destructive">
          The preview could not be loaded, so nothing has been published.
        </p>
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="size-4" aria-hidden="true" />
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
        Names, descriptions and map pins you typed yourself are shown as you wrote them. Private
        saved locations appear only as &ldquo;Private start location&rdquo;.
      </p>
      <SharedPlanContent plan={plan} />
    </div>
  );
}
