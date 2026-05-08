"use client";

import { MapPin, Search } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

import { getExploreItems } from "../constants/explore.data";
import { ExploreCard } from "./explore-card";

type ExploreSectionProps = {
  destinationName: string;
  distanceText?: string;
};

export function ExploreSection({
  destinationName,
  distanceText,
}: ExploreSectionProps) {
  const items = getExploreItems(destinationName);

  return (
    <section className="px-4 py-4 mt-6">
      <Accordion defaultValue={["explore"]}>
        <AccordionItem value="explore" className="border-none">
          <div className="flex items-center justify-between">
            <AccordionTrigger
              iconSide="left"
              className="text-2xl font-bold text-foreground hover:text-primary hover:no-underline py-0 items-center"
            >
              Explore
            </AccordionTrigger>
            <Button
              size="lg"
              className="rounded-full px-6 gap-1.5 mr-6"
              onClick={(e) => e.stopPropagation()}
            >
              <Search className="size-3 " aria-hidden="true" />
              Browse all
            </Button>
          </div>

          <AccordionContent className="pt-0">
            <div className="m-6">
              {distanceText && (
                <p className="mb-3 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="size-3 shrink-0" aria-hidden="true" />
                  {distanceText}
                </p>
              )}

              <Carousel
                id="explore-cards"
                opts={{ align: "start", slidesToScroll: 1 }}
                className="w-full"
              >
                <CarouselContent className="-ml-3">
                  {items.map((item) => (
                    <CarouselItem key={item.id} className="pl-3 basis-1/3">
                      <ExploreCard
                        title={item.title}
                        subtitle={item.subtitle}
                        source={item.source}
                        imageUrl={item.imageUrl}
                        gradient={item.gradient}
                        className="w-full"
                      />
                    </CarouselItem>
                  ))}
                </CarouselContent>

                <CarouselPrevious className="left-0 -translate-x-1/2" />
                <CarouselNext className="right-0 translate-x-1/2" />
              </Carousel>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  );
}
