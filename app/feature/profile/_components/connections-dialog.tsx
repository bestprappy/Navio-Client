"use client";

import { useEffect, useId, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Search, UserPlus, Check } from "lucide-react";

import { AuthorChip } from "@/components/social/profile-link";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useRelationshipActions, useViewer } from "@/hooks/use-social";
import { listConnections, searchPeople, socialKeys } from "@/lib/social-api";
import type { Connection } from "@/lib/validations/social";
import { cn } from "@/lib/utils";

type ConnectionsKind = "followers" | "following";

type ConnectionsDialogProps = {
  accountId: string;
  name: string;
  kind: ConnectionsKind | null;
  onKindChange: (kind: ConnectionsKind | null) => void;
};

function useDebounced(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

/**
 * Follower and following lists, paginated, with search. Search asks the
 * profile service for matching people first, then narrows the list to them, so
 * it finds anyone on the list rather than only the rows already loaded.
 */
export function ConnectionsDialog({ accountId, name, kind, onKindChange }: ConnectionsDialogProps) {
  const searchId = useId();
  const [query, setQuery] = useState("");
  const term = useDebounced(query.trim(), 300);
  const searching = term.replace(/^@/, "").length >= 2;

  const matches = useQuery({
    queryKey: ["people-search", term],
    queryFn: ({ signal }) => searchPeople(term, 50, signal),
    enabled: kind !== null && searching,
    staleTime: 30_000,
  });
  const within = searching ? matches.data?.content.flatMap((person) => (person.accountId ? [person.accountId] : [])) : undefined;

  const list = useInfiniteQuery({
    queryKey: socialKeys.connections(accountId, kind ?? "followers", searching ? term : ""),
    queryFn: ({ pageParam, signal }) => listConnections(accountId, kind ?? "followers", pageParam, within, signal),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.last ? undefined : last.number + 1),
    enabled: kind !== null && (!searching || matches.isSuccess),
  });

  const rows = list.data?.pages.flatMap((page) => page.content) ?? [];
  const loading = list.isPending && (!searching || matches.isPending || matches.isSuccess);

  return (
    <Dialog open={kind !== null} onOpenChange={(open) => { if (!open) { onKindChange(null); setQuery(""); } }}>
      <DialogContent className="flex max-h-[85svh] flex-col gap-4 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{kind === "following" ? `${name} follows` : `${name}'s followers`}</DialogTitle>
          <DialogDescription className="sr-only">A list of travellers. Use the search box to find someone.</DialogDescription>
        </DialogHeader>

        <div role="tablist" aria-label="List" className="flex gap-1 rounded-lg bg-muted p-1">
          {(["followers", "following"] as const).map((option) => (
            <button
              key={option}
              type="button"
              role="tab"
              aria-selected={kind === option}
              onClick={() => onKindChange(option)}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                kind === option ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option === "followers" ? "Followers" : "Following"}
            </button>
          ))}
        </div>

        <div className="relative">
          <label htmlFor={searchId} className="sr-only">Search people</label>
          <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input id={searchId} type="search" value={query} placeholder="Search by name or @username"
            onChange={(event) => setQuery(event.target.value)} className="h-10 pl-9" />
        </div>

        <div className="-mx-2 min-h-40 overflow-y-auto px-2" role="tabpanel" aria-busy={loading}>
          {loading ? (
            <div className="flex flex-col gap-3">{[0, 1, 2, 3].map((row) => <Skeleton key={row} className="h-11 w-full" />)}</div>
          ) : list.isError || matches.isError ? (
            <div role="alert" className="flex flex-col items-start gap-3 py-4 text-sm text-muted-foreground">
              {(list.error ?? matches.error)?.message}
              <Button type="button" variant="outline" className="h-10 px-4" onClick={() => { void matches.refetch(); void list.refetch(); }}>Try again</Button>
            </div>
          ) : rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {searching ? `No one on this list matches "${term}".` : kind === "following" ? `${name} isn't following anyone yet.` : `${name} has no followers yet.`}
            </p>
          ) : (
            <ul role="list" className="flex flex-col divide-y divide-border/60">
              {rows.map((row) => <ConnectionRow key={row.accountId} row={row} onNavigate={() => onKindChange(null)} />)}
            </ul>
          )}
          {list.hasNextPage ? (
            <Button type="button" variant="ghost" className="mt-2 h-10 w-full" disabled={list.isFetchingNextPage} onClick={() => void list.fetchNextPage()}>
              {list.isFetchingNextPage ? "Loading…" : "Show more"}
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ConnectionRow({ row, onNavigate }: { row: Connection; onNavigate: () => void }) {
  const viewer = useViewer();
  const { follow } = useRelationshipActions(row.accountId);
  const [following, setFollowing] = useState(row.viewerFollows);
  const self = viewer.accountId === row.accountId;

  return (
    <li className="flex items-center justify-between gap-3 py-2" onClickCapture={(event) => {
      if (event.target instanceof Element && event.target.closest("a")) onNavigate();
    }}>
      <AuthorChip accountId={row.accountId} size="default" />
      {self ? null : (
        <Button
          type="button"
          variant={following ? "outline" : "default"}
          className="h-9 shrink-0 px-3"
          disabled={follow.isPending}
          onClick={() => {
            const next = !following;
            setFollowing(next);
            follow.mutate(next, { onError: () => setFollowing(!next) });
          }}
        >
          {following ? <Check aria-hidden="true" /> : <UserPlus aria-hidden="true" />}
          {following ? "Following" : "Follow"}
        </Button>
      )}
    </li>
  );
}
