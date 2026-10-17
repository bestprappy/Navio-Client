"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  useInfiniteQuery,
  useIsMutating,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useAtomValue } from "jotai";
import { Check, MapPin, Plus, Search } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResponsivePicker } from "@/components/ui/responsive-picker";
import {
  getPlannerSnapshot,
  listTrips,
  requestJson,
  type TripResponse,
} from "../../planner/_components/planner-api";
import {
  recentPlanSidebarAtom,
  recentPlanSidebarStore,
  lastWorkedPlanAtom,
} from "../../planner/_components/recent-plan-sidebar";
import { groupPlanChoices, preferredRecentPlanId } from "./plan-picker-model";

const connectedPlanSchema = z.object({
  id: z.uuid(),
  displayName: z.string().nullish(),
  title: z.string().nullish(),
  destinationName: z.string(),
  destinationCity: z.string().nullish(),
  destinationCountryCode: z.string().nullish(),
  destinationLat: z.number().nullable(),
  destinationLng: z.number().nullable(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export function useDiscoveryPlan() {
  const params = useSearchParams();
  const { data: session, status } = useSession();
  const raw = params.get("plan");
  const planId = raw && z.uuid().safeParse(raw).success ? raw : null;
  const query = useQuery({
    queryKey: ["discovery-plan", session?.user?.id, planId],
    queryFn: async () =>
      connectedPlanSchema.parse(
        await requestJson(`/api/trips/${encodeURIComponent(planId!)}`),
      ),
    enabled: status === "authenticated" && !session?.error && !!planId,
    retry: false,
  });
  return {
    plan:
      status === "authenticated" && !session?.error ? query.data : undefined,
    planId,
    query,
    status: session?.error ? ("unauthenticated" as const) : status,
    ownerId: session?.user?.id,
  };
}

export function DiscoveryPlanBanner() {
  const { plan, planId, query, status } = useDiscoveryPlan();
  if (!planId) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm">
      <span>
        {plan
          ? `Exploring for ${plan.displayName || plan.title || plan.destinationName}`
          : query.isError
            ? "This plan could not be loaded. Choose a plan when adding a place."
            : status === "unauthenticated"
              ? "Sign in to reconnect your plan."
              : "Connecting your plan…"}
      </span>
      {plan && (
        <Link
          href={`/planner/${plan.id}`}
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Return to plan →
        </Link>
      )}
    </div>
  );
}

const acknowledgement = z.object({
  blockId: z.string(),
  itemId: z.string(),
  version: z.number(),
  alreadyAdded: z.boolean(),
});

export function AddPlaceToPlan({ placeId }: { placeId: string }) {
  const { ownerId, planId } = useDiscoveryPlan();
  return (
    <AddPlaceToPlanAction
      key={`${ownerId}-${planId}-${placeId}`}
      placeId={placeId}
    />
  );
}

function AddPlaceToPlanAction({ placeId }: { placeId: string }) {
  const { plan, status, ownerId } = useDiscoveryPlan();
  const recent = useAtomValue(recentPlanSidebarAtom, {
    store: recentPlanSidebarStore,
  });
  const lastWorked = useAtomValue(lastWorkedPlanAtom, {
    store: recentPlanSidebarStore,
  });
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<TripResponse | null>(null);
  const [listChoices, setListChoices] = useState<Array<{
    id: string;
    title: string;
  }> | null>(null);
  const [lastSaved, setLastSaved] = useState<{
    id: string;
    name: string;
    alreadyAdded: boolean;
  } | null>(null);
  const cache = useQueryClient();
  const trips = useInfiniteQuery({
    queryKey: ["discovery-trip-choices", ownerId],
    queryFn: ({ pageParam }) => listTrips(pageParam, 50),
    initialPageParam: 0,
    getNextPageParam: (last, pages) =>
      last.content.length &&
      pages.reduce((count, page) => count + page.content.length, 0) <
        last.totalElements
        ? pages.length
        : undefined,
    enabled: open && status === "authenticated",
  });
  // The API does not promise ordering. Load the remaining pages before calling a trip Latest.
  const { hasNextPage, isFetching, isFetchNextPageError, fetchNextPage } =
    trips;
  useEffect(() => {
    if (open && hasNextPage && !isFetching && !isFetchNextPageError)
      void fetchNextPage();
  }, [open, hasNextPage, isFetching, isFetchNextPageError, fetchNextPage]);
  const tripChoices = trips.data?.pages.flatMap((page) => page.content) || [];
  const recentId = preferredRecentPlanId(
    ownerId,
    lastWorked,
    preferredRecentPlanId(ownerId, recent, plan?.id) ?? undefined,
  );
  const groups = groupPlanChoices(tripChoices, recentId, search);
  const pending =
    useIsMutating({ mutationKey: ["discovery-add", ownerId, placeId] }) > 0;
  const mutation = useMutation({
    mutationKey: ["discovery-add", ownerId, placeId],
    mutationFn: async ({
      trip,
      listId,
    }: {
      trip: TripResponse;
      listId?: string;
    }) => {
      const append = async (
        snapshot: Awaited<ReturnType<typeof getPlannerSnapshot>>,
      ) => {
        const lists = snapshot.blocks.filter((block) => block.kind === "list");
        if (
          (lists.length > 1 && !listId) ||
          (listId && !lists.some((list) => list.id === listId))
        ) {
          return {
            lists: lists.map((block) => ({
              id: block.id,
              title: block.title || "My List",
            })),
            result: null,
          };
        }
        const result = acknowledgement.parse(
          await requestJson(
            `/api/trips/${encodeURIComponent(trip.id)}/planner/my-list/places`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                providerPlaceId: placeId,
                provider: "GOOGLE",
                listBlockId: listId || lists[0]?.id,
                expectedVersion: snapshot.version,
              }),
            },
          ),
        );
        return { lists: null, result };
      };
      try {
        return await append(await getPlannerSnapshot(trip.id));
      } catch (error) {
        if (error instanceof Error && "status" in error && error.status === 409)
          return append(await getPlannerSnapshot(trip.id));
        throw error;
      }
    },
    onSuccess: ({ lists, result }, { trip }) => {
      setSelected(trip);
      if (!result) {
        setListChoices(lists);
        return;
      }
      setListChoices(null);
      setOpen(false);
      setLastSaved({
        id: trip.id,
        name: trip.displayName || trip.title || trip.destinationName,
        alreadyAdded: result.alreadyAdded,
      });
      if (ownerId)
        recentPlanSidebarStore.set(lastWorkedPlanAtom, {
          planId: trip.id,
          ownerId,
        });
      cache.setQueryData(
        ["discovery-added", ownerId, trip.id, placeId],
        result,
      );
      void cache.invalidateQueries({ queryKey: ["planner"] });
      void cache.invalidateQueries({
        queryKey: ["discovery-trip-choices", ownerId],
      });
    },
  });
  if (status !== "authenticated")
    return (
      <Link
        href="/sign-in"
        className="inline-flex min-h-10 items-center text-sm font-medium text-primary"
      >
        Sign in to add
      </Link>
    );
  const choose = (trip: TripResponse, listId?: string) => {
    if (!pending) {
      setSelected(trip);
      mutation.mutate({ trip, listId });
    }
  };
  const row = (trip: TripResponse) => (
    <button
      key={trip.id}
      type="button"
      disabled={pending}
      onClick={() => choose(trip)}
      className="flex min-h-20 w-full items-center gap-3 rounded-xl border border-border bg-background p-3 text-left transition-colors hover:border-primary/30 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/5 text-primary">
        <MapPin className="size-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block break-words text-sm font-medium">
          {trip.displayName || trip.title || trip.destinationName}
        </span>
        <span className="block truncate text-xs text-muted-foreground">
          {trip.destinationName}
        </span>
        <span className="block text-xs text-muted-foreground">
          {trip.startDate} – {trip.endDate}
        </span>
      </span>
      {plan?.id === trip.id && (
        <span className="shrink-0 rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">
          Current
        </span>
      )}
      <Plus className="size-4 shrink-0 text-primary" aria-hidden="true" />
    </button>
  );
  return (
    <div className="space-y-2">
      <ResponsivePicker
        open={open}
        onOpenChange={(value) => {
          setOpen(value);
          if (value && !pending) {
            setListChoices(null);
            setSelected(null);
            setSearch("");
            mutation.reset();
          }
        }}
        title="Add to Plan"
        description="Choose a trip to save this place in My List."
        trigger={
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            className="w-full"
          >
            <Plus className="size-4" aria-hidden="true" />
            {pending ? "Adding…" : "Add to Plan"}
          </Button>
        }
      >
        {listChoices && selected ? (
          <div className="space-y-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() => {
                setListChoices(null);
                mutation.reset();
              }}
            >
              ← Back to plans
            </Button>
            <p className="text-sm">
              Choose a list in{" "}
              <strong>
                {selected.displayName ||
                  selected.title ||
                  selected.destinationName}
              </strong>
            </p>
            {listChoices.map((list) => (
              <Button
                key={list.id}
                type="button"
                variant="outline"
                disabled={pending}
                className="h-auto min-h-11 w-full justify-start whitespace-normal py-2 text-left"
                onClick={() => choose(selected, list.id)}
              >
                {list.title}
              </Button>
            ))}
          </div>
        ) : (
          <>
            <label className="relative block">
              <Search
                className="absolute left-3 top-3 size-4 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                aria-label="Search your plans"
                placeholder="Search plans or destinations"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-10 rounded-xl pl-9"
              />
            </label>
            {trips.isPending ||
            (trips.hasNextPage && !trips.isFetchNextPageError) ? (
              <p role="status" className="py-5 text-sm text-muted-foreground">
                Loading your trips…
              </p>
            ) : (
              <div className="space-y-5">
                {groups.latest && (
                  <section className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Latest
                    </h3>
                    {row(groups.latest)}
                  </section>
                )}
                {!!groups.trips.length && (
                  <section className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Trip List
                    </h3>
                    {groups.trips.map(row)}
                  </section>
                )}
                {trips.isSuccess && !groups.latest && !groups.trips.length && (
                  <p className="py-4 text-sm text-muted-foreground">
                    {search
                      ? "No plans match your search."
                      : "You don’t have any trips yet."}
                  </p>
                )}
              </div>
            )}
            {trips.isError && (
              <div role="alert" className="space-y-2 text-sm">
                <p>Plans could not all be loaded.</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    trips.isFetchNextPageError
                      ? void trips.fetchNextPage()
                      : void trips.refetch()
                  }
                >
                  Try again
                </Button>
              </div>
            )}
            {trips.isSuccess && !tripChoices.length && (
              <Link
                href="/planner/new"
                className="text-sm font-medium text-primary"
              >
                Create a trip →
              </Link>
            )}
          </>
        )}
        {pending && (
          <p role="status" className="text-sm text-muted-foreground">
            Adding to My List…
          </p>
        )}
        {mutation.isError && (
          <p role="alert" className="text-sm text-destructive">
            {mutation.error instanceof Error
              ? mutation.error.message
              : "Could not add this place. Please retry."}
          </p>
        )}
      </ResponsivePicker>
      {lastSaved && (
        <p
          role="status"
          className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground"
        >
          <Check className="size-3.5 text-primary" aria-hidden="true" />
          {lastSaved.alreadyAdded ? "Already saved in" : "Added to"}{" "}
          {lastSaved.name}.{" "}
          <Link
            href={`/planner/${lastSaved.id}`}
            className="font-medium text-primary"
          >
            View My List →
          </Link>
        </p>
      )}
    </div>
  );
}
