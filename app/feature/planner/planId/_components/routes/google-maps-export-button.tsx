"use client";

import { type MouseEvent, useMemo, useState } from "react";
import { ExternalLink, MapPin } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import type { TripBlockData } from "../constants/types";
import {
  getGoogleMapsDirectionsLinks,
  type GoogleMapsDirectionsLink,
} from "./google-maps-export";

type GoogleMapsExportButtonProps = {
  blocks: TripBlockData[];
  className?: string;
};

type DisplayDirectionsLink = GoogleMapsDirectionsLink & {
  id: string;
};

function stopMapInteraction(event: MouseEvent<HTMLElement>) {
  event.stopPropagation();
}

function getBlockLabel(block: TripBlockData): string {
  return block.title || block.date || "Day route";
}

function getDisplayLinks(blocks: TripBlockData[]): DisplayDirectionsLink[] {
  return blocks.filter((block) => block.kind !== "list").flatMap((block) => {
    const blockLinks = getGoogleMapsDirectionsLinks(block);
    const blockLabel = getBlockLabel(block);

    return blockLinks.map((link, index) => ({
      ...link,
      id: `${block.id}-${index}`,
      label:
        blockLinks.length === 1
          ? blockLabel
          : `${blockLabel} - ${link.label}`,
    }));
  });
}

function ExportButtonContent() {
  return (
    <>
      <MapPin className="size-3.5" aria-hidden="true" />
      <span>Google Maps</span>
    </>
  );
}

export function GoogleMapsExportButton({
  blocks,
  className,
}: GoogleMapsExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const links = useMemo(() => getDisplayLinks(blocks), [blocks]);
  const disabledTitle =
    "Add at least two places to the itinerary before opening Google Maps.";

  if (links.length === 0) {
    return (
      <div
        className={cn("pointer-events-auto", className)}
        title={disabledTitle}
        onClick={stopMapInteraction}
        onMouseDown={stopMapInteraction}
      >
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled
          title={disabledTitle}
          className="rounded-sm bg-card/95 shadow-md backdrop-blur-sm"
          onClick={stopMapInteraction}
          onMouseDown={stopMapInteraction}
        >
          <ExportButtonContent />
        </Button>
      </div>
    );
  }

  if (links.length === 1) {
    const link = links[0];

    return (
      <div className={cn("pointer-events-auto", className)}>
        <a
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          title="Open this trip in Google Maps"
          aria-label="Open this trip in Google Maps"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "rounded-sm bg-card/95 shadow-md backdrop-blur-sm",
          )}
          onClick={stopMapInteraction}
          onMouseDown={stopMapInteraction}
        >
          <ExportButtonContent />
        </a>
      </div>
    );
  }

  return (
    <div className={cn("pointer-events-auto", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger
          type="button"
          title="Choose a Google Maps route part"
          aria-label="Choose a Google Maps route part"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "rounded-sm bg-card/95 shadow-md backdrop-blur-sm",
          )}
          onClick={stopMapInteraction}
          onMouseDown={stopMapInteraction}
        >
          <ExportButtonContent />
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={8}
          className="w-72 rounded-sm p-4"
          onClick={stopMapInteraction}
          onMouseDown={stopMapInteraction}
        >
          <PopoverHeader>
            <PopoverTitle>Open in Google Maps</PopoverTitle>
            <PopoverDescription>
              This route is split to keep every stop compatible with Google
              Maps links.
            </PopoverDescription>
          </PopoverHeader>

          <div className="space-y-2">
            {links.map((link) => (
              <a
                key={link.id}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "w-full justify-between rounded-sm bg-background",
                )}
                onClick={(event) => {
                  stopMapInteraction(event);
                  setIsOpen(false);
                }}
                onMouseDown={stopMapInteraction}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <ExternalLink className="size-3.5" aria-hidden="true" />
                  <span className="truncate">{link.label}</span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {link.stopCount} stops
                </span>
              </a>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
