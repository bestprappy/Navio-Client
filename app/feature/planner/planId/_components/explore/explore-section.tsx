"use client";

import Image from "next/image";
import Link from "next/link";
import { useAtomValue } from "jotai";
import { Compass, MapPin, ArrowUpRight } from "lucide-react";
import { PLANS } from "@/app/feature/explore/_components/data";
import { getTripDestinations } from "../../../_components/trip-destinations";
import { itineraryBlocksAtom } from "../overview/trip-builder.atoms";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function ExploreSection({ destinationName, country }: { destinationName: string; country: string }) {
  const blocks = useAtomValue(itineraryBlocksAtom);
  const destinations = getTripDestinations(destinationName, blocks);
  return <section className="px-4 py-4 mt-4">
    <Accordion defaultValue={["explore"]}><AccordionItem value="explore" className="border-none">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <AccordionTrigger iconSide="left" className="py-0 text-2xl font-bold hover:no-underline">Explore</AccordionTrigger>
        <Link href="/explore" className="inline-flex min-h-10 items-center gap-2 rounded-full border border-primary/35 bg-primary/10 px-4 text-sm font-medium text-primary hover:bg-primary/20 focus-visible:ring-2 focus-visible:ring-ring">See more<ArrowUpRight className="size-4" /></Link>
      </div>
      <AccordionContent className="pt-4 [&_a]:no-underline">
        <p className="mb-4 flex items-center gap-2 text-sm text-muted-foreground"><Compass className="size-4 text-primary" />Explore {country === "Your trip" ? destinationName : country}</p>
        <div className="space-y-5">
          {destinations.map((destination) => {
            const normalize = (name: string) => name.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
            const matches = PLANS.filter((plan) => normalize(plan.province) === normalize(destination.split(",")[0])).slice(0, 2);
            return <div key={destination}>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold"><MapPin className="size-4 text-accent" />{destination}</h3>
              <div className="grid gap-3 @2xl/planner:grid-cols-2">
                {matches.length ? matches.map((plan) => <Link key={plan.id} href={`/explore/view/${plan.id}/${plan.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`} className="group flex min-w-0 gap-3 overflow-hidden rounded-xl border border-border bg-card p-2 hover:border-primary/60 focus-visible:ring-2 focus-visible:ring-ring">
                  <div className="relative min-h-24 w-24 shrink-0 overflow-hidden rounded-lg"><Image src={plan.imageUrl} alt="" fill sizes="110px" className="object-cover transition-transform duration-300 group-hover:scale-105" /></div>
                  <div className="min-w-0 flex-1 py-1"><p className="line-clamp-3 text-sm font-semibold leading-snug">{plan.title}</p><p className="mt-2 text-xs text-muted-foreground">{plan.province} · Shared itinerary</p></div>
                </Link>) : <p className="rounded-xl border border-dashed border-border bg-secondary/20 p-4 text-sm leading-relaxed text-muted-foreground">No shared itineraries for {destination} yet. You can still find local places when adding stops to your days.</p>}
              </div>
            </div>;
          })}
        </div>
      </AccordionContent>
    </AccordionItem></Accordion>
  </section>;
}
