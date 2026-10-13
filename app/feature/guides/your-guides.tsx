"use client";

import Link from "next/link";
import { useDeferredValue, useState } from "react";
import { useSession } from "next-auth/react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { BookOpen, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button.variants";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { YourGuideCard } from "./guide-card";
import { NewGuideDialog } from "./new-guide-dialog";
import { listYourGuides } from "./user-guides-api";

export function YourGuides({ preview = false }: { preview?: boolean }) {
  const { data: session, status } = useSession();
  const [search, setSearch] = useState("");
  const term = useDeferredValue(search.trim());
  const result = useInfiniteQuery({
    queryKey: ["user-guides", session?.user?.id, "list", { term, preview }],
    queryFn: ({ pageParam }) =>
      listYourGuides(pageParam, term, preview ? 3 : 12),
    initialPageParam: 0,
    getNextPageParam: (page) =>
      page.number + 1 < page.totalPages ? page.number + 1 : undefined,
    enabled: status === "authenticated" && !session?.error,
    staleTime: 30_000,
  });
  const guides = result.data?.pages.flatMap((page) => page.content) ?? [];
  return (
    <section
      aria-labelledby={
        preview ? "your-guides-heading" : "guides-library-heading"
      }
      className="space-y-5"
    >
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h2
            id={preview ? "your-guides-heading" : "guides-library-heading"}
            className={
              preview
                ? "text-xl font-semibold tracking-tight"
                : "text-3xl font-bold tracking-tight"
            }
          >
            Your Guides
          </h2>
          <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
            Keep the places you know, and the tips you would pass on.
          </p>
        </div>
        <NewGuideDialog />
      </header>
      {!preview ? (
        <label className="relative block max-w-md">
          <span className="sr-only">Search your guides</span>
          <Search
            aria-hidden="true"
            className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={search}
            maxLength={100}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search your guides by city, country or title"
            className="h-11 pl-10"
          />
        </label>
      ) : null}
      {result.isPending ? (
        <div
          role="status"
          aria-label="Loading your guides"
          className="grid gap-4 lg:grid-cols-2"
        >
          {[0, 1].map((id) => (
            <Skeleton key={id} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : result.isError && !result.data ? (
        <div role="alert" className="flex flex-wrap items-center gap-3">
          <p className="text-sm">Your guides could not be loaded.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void result.refetch()}
          >
            Try again
          </Button>
        </div>
      ) : guides.length ? (
        <ul
          className={
            preview
              ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
              : "grid gap-4 lg:grid-cols-2"
          }
        >
          {guides.map((guide) => (
            <li key={guide.id} className="min-w-0">
              <YourGuideCard guide={guide} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex items-start gap-4 rounded-xl border border-dashed border-border p-6">
          <BookOpen
            aria-hidden="true"
            className="mt-0.5 size-6 shrink-0 text-primary"
          />
          <div className="space-y-1">
            <p className="font-medium">
              {term
                ? "No guides match this search"
                : "Your first guide starts with a place"}
            </p>
            <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
              {term
                ? "Try another city, country or title."
                : "A favorite cafe, a quiet trail, a neighborhood you love. Write a guide and help someone discover it."}
            </p>
          </div>
        </div>
      )}
      {result.isRefetchError ? (
        <p role="alert" className="text-sm text-destructive">
          Your library could not be refreshed.{" "}
          <button className="underline" onClick={() => void result.refetch()}>
            Try again
          </button>
        </p>
      ) : null}
      {preview && guides.length ? (
        <Link
          href="/dashboard/guides"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          See all your guides
        </Link>
      ) : null}
      {!preview && result.hasNextPage ? (
        <Button
          variant="outline"
          disabled={result.isFetchingNextPage}
          onClick={() => void result.fetchNextPage()}
        >
          {result.isFetchNextPageError
            ? "Retry loading guides"
            : result.isFetchingNextPage
              ? "Loading…"
              : "Load more guides"}
        </Button>
      ) : null}
    </section>
  );
}
