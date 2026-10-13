"use client";

import { useMemo, useState } from "react";
import { createStore, useAtomValue } from "jotai";
import { useQuery } from "@tanstack/react-query";
import { BookOpen } from "lucide-react";

import { CountryFlag } from "@/components/ui/country-flag";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

import { destinationQueryAtom } from "../../../../planner/_components/planner-setup.atoms";
import { filterGuides, groupGuidesByCountry, type CountryGroup } from "../guide-model";
import { guideKeys, listGuides, type GuideSummary } from "../guides-api";
import { BrowserGuideImport } from "./browser-guide-import";
import { GuideCard } from "./guide-card";
import { NewGuideComposer } from "./new-guide-composer";

/** Admin home for guides: start one, or open one from the country it belongs to. */
export function GuidesDashboard() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8 sm:px-6 lg:px-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Guides</h1>
        <p className="max-w-prose text-muted-foreground">
          Every admin can see and edit these guides. Publish a guide when it is ready for travelers to browse while they plan.
        </p>
      </header>
      <GuidesWorkspace />
    </div>
  );
}

function GuidesWorkspace() {
  const [searchStore] = useState(createStore);
  const query = useAtomValue(destinationQueryAtom, { store: searchStore });
  const result = useQuery({ queryKey: guideKeys.list, queryFn: listGuides, refetchInterval: 30_000 });
  const guides = result.data;
  const groups = useMemo(() => groupGuidesByCountry(filterGuides(guides ?? [], query)), [guides, query]);

  return (
    <>
      <NewGuideComposer searchStore={searchStore} guides={guides ?? []} disabled={!guides} />
      {guides ? <BrowserGuideImport guides={guides} /> : null}
      {result.isError ? <div role="alert" className="flex flex-col items-start gap-3"><p>{result.error.message}</p><Button variant="outline" onClick={() => void result.refetch()}>Try again</Button></div> : null}
      {result.isPending ? <GuidesDashboardSkeleton /> : groups.length ? (
        <div className="flex flex-col gap-12">
          {groups.map((group) => (
            <CountrySection key={group.country} group={group} />
          ))}
        </div>
      ) : (
        result.isError ? null : <EmptyAtlas query={query.trim()} hasGuides={(guides?.length ?? 0) > 0} />
      )}
    </>
  );
}

function CountrySection({ group }: { group: CountryGroup<GuideSummary> }) {
  const headingId = `guides-${group.country.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-5">
      <div className="flex items-end gap-4 border-b border-border pb-3">
        <CountryFlag code={group.countryCode} className="size-12 rounded-xl [&_.fi]:size-7" />
        <h2 id={headingId} className="min-w-0 flex-1 truncate text-4xl leading-none font-extrabold tracking-tight sm:text-5xl">
          {group.country}
        </h2>
        <p className="shrink-0 pb-1 text-sm text-muted-foreground">
          <span className="font-mono tabular-nums text-foreground">{group.guides.length}</span> {group.guides.length === 1 ? "guide" : "guides"}
        </p>
      </div>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-5">
        {group.guides.map((guide) => (
          <li key={guide.id} className="min-w-0">
            <GuideCard guide={guide} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function EmptyAtlas({ query, hasGuides }: { query: string; hasGuides: boolean }) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-xl border border-dashed border-border px-6 py-10">
      <BookOpen aria-hidden="true" className="size-6 text-muted-foreground" />
      <p className="font-medium">{hasGuides && query ? `No guide for “${query}” yet` : "No guides yet"}</p>
      <p className="max-w-prose text-sm text-muted-foreground">
        Choose the destination from the suggestions above, then select Start writing.
      </p>
    </div>
  );
}

function GuidesDashboardSkeleton() {
  return (
    <div role="status" aria-label="Loading guides" className="flex flex-col gap-10">
      <Skeleton className="h-36 w-full rounded-xl" />
      <div className="flex flex-col gap-5">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-5">
          <Skeleton className="aspect-4/3 rounded-xl" />
          <Skeleton className="aspect-4/3 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
