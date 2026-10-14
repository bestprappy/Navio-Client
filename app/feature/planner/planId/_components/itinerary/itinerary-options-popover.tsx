"use client";

import { useState } from "react";
import { MoreHorizontal, Table2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";

import { RouteLineModeSwitch } from "./route-line-mode-switch";
import { useItineraryView } from "./table/use-itinerary-view";

/** Trip-wide itinerary settings, matching each day's Block options menu. */
export function ItineraryOptionsPopover() {
  const [isOpen, setIsOpen] = useState(false);
  const [, setView] = useItineraryView();

  return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger
          type="button"
          aria-label="Itinerary options"
          className="flex size-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <MoreHorizontal className="size-5" aria-hidden="true" />
        </PopoverTrigger>
        <PopoverContent align="end" sideOffset={8} className="w-72 gap-4 rounded-sm p-4">
          <PopoverHeader>
            <PopoverTitle>Itinerary options</PopoverTitle>
          </PopoverHeader>

          <RouteLineModeSwitch />

          <section aria-labelledby="itinerary-table-heading" className="space-y-2">
            <h4 id="itinerary-table-heading" className="text-xs font-semibold text-muted-foreground">Table</h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full justify-start rounded-sm"
              onClick={() => {
                setIsOpen(false);
                setView("table");
              }}
            >
              <Table2 aria-hidden="true" />
              View as table
            </Button>
            <p className="text-xs text-muted-foreground">Export to Excel, CSV or a PDF handout from the table.</p>
          </section>
        </PopoverContent>
      </Popover>
  );
}
