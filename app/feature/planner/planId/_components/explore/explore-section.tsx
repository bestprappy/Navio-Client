"use client";

import Link from "next/link";
import { useAtomValue } from "jotai";
import { ArrowUpRight, Compass, MapPin } from "lucide-react";

import { SharedPlanCard } from "@/app/feature/explore/_components/shared-plans/shared-plan-card";
import { explorePlanSearchText } from "@/app/feature/explore/_components/shared-plans/explore-plans-api";
import { useExplorePlans } from "@/app/feature/explore/_components/shared-plans/use-explore-plans";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { getTripDestinations } from "../../../_components/trip-destinations";
import { itineraryBlocksAtom } from "../overview/trip-builder.atoms";

export function ExploreSection({ destinationName, country }: { destinationName: string; country: string }) {
  const blocks = useAtomValue(itineraryBlocksAtom);
  const destinations = getTripDestinations(destinationName, blocks);
  const shared = useExplorePlans(null);

  return (
    <section className="mt-4 px-4 py-4">
      <Accordion defaultValue={["explore"]}>
        <AccordionItem value="explore" className="border-none">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <AccordionTrigger iconSide="left" className="py-0 text-2xl font-bold hover:no-underline">Explore</AccordionTrigger>
            <Link href="/explore" className="inline-flex min-h-10 items-center gap-2 rounded-full border border-primary/35 bg-primary/10 px-4 text-sm font-medium text-primary hover:bg-primary/20 focus-visible:ring-2 focus-visible:ring-ring">See more <ArrowUpRight className="size-4" aria-hidden="true" /></Link>
          </div>
          <AccordionContent className="pt-4 [&_a]:no-underline">
            <p className="mb-4 flex items-center gap-2 text-sm text-muted-foreground"><Compass className="size-4 text-primary" aria-hidden="true" />Explore {country === "Your trip" ? destinationName : country}</p>
            {shared.isError && <p role="alert" className="text-sm text-destructive">Shared plans could not be loaded.</p>}
            <div className="space-y-5">
              {destinations.map((destination) => {
                const place = destination.split(",")[0]?.trim().toLowerCase() ?? "";
                const matches = shared.plans.filter((plan) => place && explorePlanSearchText(plan).includes(place)).slice(0, 2);
                return (
                  <div key={destination}>
                    <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold"><MapPin className="size-4 text-accent" aria-hidden="true" />{destination}</h3>
                    <div className="grid gap-3 @2xl/planner:grid-cols-2">
                      {matches.map((plan) => <SharedPlanCard key={plan.token} plan={plan} />)}
                      {!matches.length && !shared.isLoading && !shared.isError && (
                        <p className="rounded-xl border border-dashed border-border bg-secondary/20 p-4 text-sm leading-relaxed text-muted-foreground">No shared itineraries for {destination} yet.</p>
                      )}
                      {shared.isLoading && <p className="text-sm text-muted-foreground">Loading shared plans…</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  );
}
