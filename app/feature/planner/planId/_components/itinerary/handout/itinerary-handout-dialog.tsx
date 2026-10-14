"use client";

import { useId, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useAtom } from "jotai";
import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { ItineraryTable } from "../export/itinerary-table";
import type { TableLeg } from "../table/itinerary-table-legs";
import { handoutOptionsAtom, normalizeHandoutOptions, type HandoutOptions } from "./handout-options";
import { ItineraryHandout, type ItineraryHandoutProps } from "./itinerary-handout";
import styles from "./itinerary-handout.module.css";

type ItineraryHandoutDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: ItineraryTable;
  legs: ReadonlyMap<string, TableLeg>;
  title: string;
  destinationName: string;
};

/** An A4 sheet at 96 CSS pixels per inch. */
const SHEET_WIDTH_PX = (210 / 25.4) * 96;
const PREVIEW_GUTTER_PX = 32;

type FlagOption = Exclude<keyof HandoutOptions, "preparedBy">;

const INCLUDE_OPTIONS: { key: FlagOption; label: string; hint: string }[] = [
  { key: "showNotes", label: "Notes", hint: "Your notes for each stop" },
  { key: "showPhotos", label: "Photos", hint: "A photo beside each place" },
  { key: "showTravel", label: "Travel between stops", hint: "Mode, time and distance" },
  { key: "showCosts", label: "Costs", hint: "Leave off for priced packages" },
];

/** Text for a CSS string: escapes quotes and backslashes and keeps it on one line. */
function toCssString(value: string): string {
  return `"${value.replace(/[\\"]/g, "\\$&").replace(/\s+/g, " ").slice(0, 120)}"`;
}

function OptionCheckbox({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (checked: boolean) => void }) {
  const id = useId();
  return (
    <div className="flex items-start gap-3">
      <Checkbox id={id} checked={checked} onCheckedChange={onChange} aria-describedby={`${id}-hint`} className="mt-0.5" />
      <div className="flex flex-col gap-1">
        <Label htmlFor={id}>{label}</Label>
        <span id={`${id}-hint`} className="text-xs text-muted-foreground">{hint}</span>
      </div>
    </div>
  );
}

/** Scales the A4 sheet down to fit the preview pane. */
function SheetPreview({ children }: { children: ReactNode }) {
  const paneRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);

  useLayoutEffect(() => {
    const pane = paneRef.current;
    if (!pane || typeof ResizeObserver === "undefined") return;
    const measure = () => setZoom(Math.min(1, Math.max(0.3, (pane.clientWidth - PREVIEW_GUTTER_PX) / SHEET_WIDTH_PX)));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(pane);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={paneRef}
      className="min-h-64 flex-1 overflow-y-auto bg-well p-4"
      tabIndex={0}
      aria-label="Handout preview"
    >
      <div className="mx-auto w-fit shadow-md ring-1 ring-foreground/10" style={{ zoom }}>
        {children}
      </div>
    </div>
  );
}

/** The copy the browser prints: hidden on screen, the only thing on the printed page. */
function PrintCopy({ footer, ...props }: ItineraryHandoutProps & { footer: string }) {
  // Paper is light whatever the app theme, and the page may run past one screen.
  const pageCss = `@page {
  @bottom-left { content: ${toCssString(footer)}; font: 8pt sans-serif; color: #6b7280; }
  @bottom-right { content: "Page " counter(page) " of " counter(pages); font: 8pt sans-serif; color: #6b7280; }
}
@media print {
  html, body { height: auto !important; min-height: 0 !important; overflow: visible !important; background: #fff !important; color-scheme: light !important; }
}`;
  return createPortal(
    <div className={styles.printRoot}>
      <style>{pageCss}</style>
      <ItineraryHandout {...props} />
    </div>,
    document.body,
  );
}

function HandoutContent({ table, legs, title, destinationName }: Omit<ItineraryHandoutDialogProps, "open" | "onOpenChange">) {
  const [storedOptions, setStoredOptions] = useAtom(handoutOptionsAtom);
  const options = useMemo(() => normalizeHandoutOptions(storedOptions), [storedOptions]);
  const [printFailed, setPrintFailed] = useState(false);
  const preparedById = useId();

  function update(patch: Partial<HandoutOptions>) {
    setStoredOptions({ ...options, ...patch });
  }

  function print() {
    try {
      window.print();
      setPrintFailed(false);
    } catch (error) {
      console.error("Could not open the print window for the handout.", {
        component: "ItineraryHandoutDialog",
        operation: "print",
        dayCount: table.days.length,
        error,
      });
      setPrintFailed(true);
    }
  }

  const handoutProps: ItineraryHandoutProps = { table, legs, title, destinationName, options };
  const footer = options.preparedBy.trim() ? `${title}, prepared by ${options.preparedBy.trim()}` : title;

  return (
    <>
      <DialogHeader className="border-b px-5 py-4 pr-12">
        <DialogTitle className="text-lg font-semibold">PDF handout</DialogTitle>
        <DialogDescription>
          A printable plan to give travellers. Choose what to include, then save it as a PDF.
        </DialogDescription>
      </DialogHeader>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto md:flex-row md:overflow-hidden">
        <aside className="flex shrink-0 flex-col gap-6 border-b p-5 md:w-72 md:overflow-y-auto md:border-r md:border-b-0">
          <div className="flex flex-col gap-2">
            <Label htmlFor={preparedById}>Prepared by</Label>
            <Input
              id={preparedById}
              value={options.preparedBy}
              maxLength={120}
              onChange={(event) => update({ preparedBy: event.target.value })}
              placeholder="Your name or company"
              aria-describedby={`${preparedById}-hint`}
            />
            <span id={`${preparedById}-hint`} className="text-xs text-muted-foreground">Printed at the top of the first page.</span>
          </div>

          <fieldset className="flex flex-col gap-4">
            <legend className="mb-3 text-sm font-semibold text-foreground">Include</legend>
            {INCLUDE_OPTIONS.map(({ key, label, hint }) => (
              <OptionCheckbox key={key} label={label} hint={hint} checked={options[key]} onChange={(checked) => update({ [key]: checked })} />
            ))}
          </fieldset>

          <fieldset className="flex flex-col gap-4">
            <legend className="mb-3 text-sm font-semibold text-foreground">Layout</legend>
            <OptionCheckbox
              label="Each day on a new page"
              hint="Easier to hand out one day at a time"
              checked={options.dayPerPage}
              onChange={(checked) => update({ dayPerPage: checked })}
            />
          </fieldset>
        </aside>

        <SheetPreview>
          <ItineraryHandout {...handoutProps} />
        </SheetPreview>
      </div>

      <div className="flex flex-col gap-3 border-t px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {printFailed
            ? <span role="alert" className="text-destructive">The print window could not open. Use your browser&apos;s Print command instead.</span>
            : "In the print window, choose Save as PDF as the destination."}
        </p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button onClick={print} disabled={table.days.length === 0}>
            <Printer aria-hidden="true" />
            Save as PDF
          </Button>
        </div>
      </div>

      <PrintCopy {...handoutProps} footer={footer} />
    </>
  );
}

/** Previews and prints the itinerary handout for the days shown in the table. */
export function ItineraryHandoutDialog({ open, onOpenChange, ...props }: ItineraryHandoutDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[calc(100dvh-2rem)] max-h-[60rem] flex-col gap-0 overflow-hidden p-0 sm:max-w-6xl">
        {/* Mounts on open, so the print copy exists only while the dialog does. */}
        {open && <HandoutContent {...props} />}
      </DialogContent>
    </Dialog>
  );
}
