"use client";

import { useDeferredValue, useId, useMemo, useState } from "react";
import { Check, Loader2, MapPinned, Plus, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  explorePlanDestination,
  explorePlanSearchText,
  type ExplorePlan,
} from "@/app/feature/explore/_components/shared-plans/explore-plans-api";
import { useExplorePlans } from "@/app/feature/explore/_components/shared-plans/use-explore-plans";
import { useAttachedPlan } from "../_components/community-plan-attachment";

const PICKER_PAGE_SIZE = 24;

type CommunityPlanPickerProps = {
  selectedToken: string | null;
  disabled: boolean;
  onChange: (token: string | null) => void;
};

function dayLabel(plan: Pick<ExplorePlan, "dayCount">) {
  return `${plan.dayCount} ${plan.dayCount === 1 ? "day" : "days"}`;
}

/** Attach a plan travellers listed on Explore, so the post can discuss it. */
export function CommunityPlanPicker({ selectedToken, disabled, onChange }: CommunityPlanPickerProps) {
  const [open, setOpen] = useState(false);
  const selected = useAttachedPlan(selectedToken);

  return (
    <section aria-label="Explore plan" className="rounded-lg border border-border bg-card p-3">
      {selectedToken ? (
        <SelectedPlan
          plan={selected.data ?? null}
          isLoading={selected.isPending}
          isUnavailable={selected.isSuccess && selected.data === null}
          isError={selected.isError}
          disabled={disabled}
          onRemove={() => onChange(null)}
        />
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                disabled={disabled}
                className="h-auto w-full justify-start gap-3 px-2 py-2 text-left"
              />
            }
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <MapPinned className="size-4" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-foreground">Discuss an Explore plan</span>
              <span className="block text-xs font-normal text-muted-foreground">
                Attach a plan travellers shared on Explore
              </span>
            </span>
            <Plus className="size-4 text-muted-foreground" aria-hidden="true" />
          </PopoverTrigger>
          <PopoverContent
            align="start"
            sideOffset={6}
            className="w-(--anchor-width) max-w-[calc(100vw-2rem)] gap-0 p-0"
          >
            <PlanSearchList
              enabled={open}
              onSelect={(token) => {
                onChange(token);
                setOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
      )}
    </section>
  );
}

function PlanSearchList({ enabled, onSelect }: { enabled: boolean; onSelect: (token: string) => void }) {
  const searchId = useId();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  const feed = useExplorePlans(null, "recent", PICKER_PAGE_SIZE, enabled);

  const matches = useMemo(
    () =>
      deferredSearch
        ? feed.plans.filter((plan) => explorePlanSearchText(plan).includes(deferredSearch))
        : feed.plans,
    [deferredSearch, feed.plans],
  );

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 border-b border-border px-3">
        <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <label htmlFor={searchId} className="sr-only">
          Search Explore plans
        </label>
        <input
          id={searchId}
          type="search"
          autoFocus
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by place, title or author"
          className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="max-h-72 overflow-y-auto p-1" aria-live="polite">
        {feed.isLoading ? (
          <p role="status" className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Loading Explore plans…
          </p>
        ) : feed.isError ? (
          <div role="alert" className="flex items-center justify-between gap-2 px-3 py-3 text-sm text-muted-foreground">
            <span>Explore plans could not be loaded.</span>
            <Button type="button" variant="outline" size="sm" onClick={() => void feed.refetch()}>
              Try again
            </Button>
          </div>
        ) : matches.length === 0 ? (
          <p className="px-3 py-3 text-sm text-muted-foreground">
            {feed.plans.length === 0
              ? "No plans are listed on Explore yet."
              : "No loaded plans match that search."}
          </p>
        ) : (
          <ul aria-label="Explore plans" className="flex flex-col">
            {matches.map((plan) => (
              <li key={plan.token}>
                <button
                  type="button"
                  className="grid w-full grid-cols-[1.25rem_1fr] gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                  onClick={() => onSelect(plan.token)}
                >
                  <MapPinned className="mt-0.5 size-4 text-muted-foreground" aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-foreground">
                      {plan.title || explorePlanDestination(plan) || "Shared plan"}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                      {[dayLabel(plan), explorePlanDestination(plan), plan.authorName].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {feed.hasMore && !feed.isLoading ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-1 w-full"
            disabled={feed.isFetchingMore}
            onClick={() => void feed.fetchMore()}
          >
            {feed.isFetchingMore ? "Loading…" : feed.loadMoreFailed ? "Retry loading more" : "Load more plans"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function SelectedPlan({
  plan,
  isLoading,
  isUnavailable,
  isError,
  disabled,
  onRemove,
}: {
  plan: ExplorePlan | null;
  isLoading: boolean;
  isUnavailable: boolean;
  isError: boolean;
  disabled: boolean;
  onRemove: () => void;
}) {
  const title = plan ? plan.title || explorePlanDestination(plan) || "Shared plan" : null;

  return (
    <div className="flex items-start gap-3">
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg",
          isUnavailable || isError ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary",
        )}
      >
        {isLoading ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Check className="size-4" aria-hidden="true" />
        )}
      </span>
      <div className="min-w-0 flex-1" aria-live="polite">
        <p className="text-xs font-medium text-muted-foreground">Discussing an Explore plan</p>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading the plan…</p>
        ) : isUnavailable ? (
          <p role="alert" className="text-sm text-destructive">
            This plan is no longer listed on Explore. Remove it or choose another.
          </p>
        ) : isError ? (
          <p role="alert" className="text-sm text-muted-foreground">
            The plan could not be loaded. You can still post; it is checked when you publish.
          </p>
        ) : plan ? (
          <>
            <p className="truncate text-sm font-semibold text-foreground">{title}</p>
            <p className="truncate text-xs text-muted-foreground">
              {[dayLabel(plan), explorePlanDestination(plan), plan.authorName].filter(Boolean).join(" · ")}
            </p>
          </>
        ) : null}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={disabled}
        onClick={onRemove}
        aria-label="Remove the attached plan"
      >
        <X className="size-4" aria-hidden="true" />
      </Button>
    </div>
  );
}
