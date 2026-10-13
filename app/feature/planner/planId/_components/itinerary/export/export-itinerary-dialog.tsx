"use client";

import { useMemo, useState } from "react";
import { useAtomValue } from "jotai";
import { FileSpreadsheet, FileText, Sheet } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { downloadFile, toFileNameSlug } from "@/lib/download-file";

import {
  itineraryBlocksAtom,
  tripCurrencyAtom,
  tripExpensesAtom,
} from "../../overview/trip-builder.atoms";
import { ExportDayPicker } from "./export-day-picker";
import { toCsv } from "./itinerary-csv";
import { toSheetRows } from "./itinerary-sheet";
import { buildItineraryTable, type ItineraryTableAnchors } from "./itinerary-table";
import { ItineraryTablePreview } from "./itinerary-table-preview";
import { createItineraryWorkbook } from "./itinerary-xlsx";

type ExportItineraryDialogProps = {
  /** Where each day starts and ends, keyed by day ID. */
  anchors: ReadonlyMap<string, ItineraryTableAnchors>;
  /** Names the downloaded file, such as the destination. */
  fileName: string;
};

type ExportFormat = "csv" | "xlsx";

const XLSX_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export function ExportItineraryDialog({ anchors, fileName }: ExportItineraryDialogProps) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-sm text-primary transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
        <Sheet className="size-4" aria-hidden="true" />
        Export table
      </DialogTrigger>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-4 sm:max-w-5xl">
        {/* Content mounts on open, so the day choice starts fresh each time. */}
        {open && <ExportItineraryContent anchors={anchors} fileName={fileName} />}
      </DialogContent>
    </Dialog>
  );
}

function ExportItineraryContent({ anchors, fileName }: ExportItineraryDialogProps) {
  const days = useAtomValue(itineraryBlocksAtom);
  const expenses = useAtomValue(tripExpensesAtom);
  const currency = useAtomValue(tripCurrencyAtom);
  const orderedDays = useMemo(() => days.toSorted((a, b) => a.date.localeCompare(b.date)), [days]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(days.map((day) => day.id)));
  const [failedFormat, setFailedFormat] = useState<ExportFormat | null>(null);

  const table = useMemo(
    () => buildItineraryTable({ blocks: orderedDays, expenses, currency: currency.code, anchors, dayIds: selectedIds }),
    [orderedDays, expenses, currency.code, anchors, selectedIds],
  );
  const stopCount = table.days.reduce((count, day) => count + day.rows.length, 0);
  const hasSelection = table.days.length > 0;

  function download(exportFormat: ExportFormat) {
    const baseName = `${toFileNameSlug(fileName, "trip")}-itinerary`;
    try {
      if (exportFormat === "csv") {
        downloadFile(toCsv(toSheetRows(table)), `${baseName}.csv`, "text/csv;charset=utf-8");
      } else {
        downloadFile(createItineraryWorkbook(table), `${baseName}.xlsx`, XLSX_TYPE);
      }
      setFailedFormat(null);
    } catch (error) {
      console.error("Itinerary export failed.", {
        component: "ExportItineraryDialog",
        operation: "download",
        format: exportFormat,
        dayCount: table.days.length,
        error,
      });
      setFailedFormat(exportFormat);
    }
  }

  return (
    <>
      <DialogHeader className="pr-8">
        <DialogTitle className="text-lg font-semibold">Export itinerary as a table</DialogTitle>
        <DialogDescription>
          Choose the days to include. CSV opens in any spreadsheet app; Excel also keeps each day&apos;s color.
        </DialogDescription>
      </DialogHeader>

      <ExportDayPicker days={orderedDays} selectedIds={selectedIds} onChange={setSelectedIds} />

      {hasSelection ? (
        <ItineraryTablePreview table={table} className="min-h-0 flex-1" />
      ) : (
        <p className="flex min-h-40 flex-1 items-center justify-center rounded-lg border border-dashed px-4 text-center text-sm text-muted-foreground">
          Choose at least one day to see the table.
        </p>
      )}

      {failedFormat && (
        <p role="alert" className="text-sm text-destructive">
          The {failedFormat === "csv" ? "CSV" : "Excel"} file could not be created. Try again.
        </p>
      )}

      <DialogFooter className="items-center sm:justify-between">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {table.days.length} {table.days.length === 1 ? "day" : "days"}, {stopCount} {stopCount === 1 ? "stop" : "stops"}
        </p>
        <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row">
          <Button variant="outline" disabled={!hasSelection} onClick={() => download("csv")}>
            <FileText aria-hidden="true" />
            Download CSV
          </Button>
          <Button disabled={!hasSelection} onClick={() => download("xlsx")}>
            <FileSpreadsheet aria-hidden="true" />
            Download Excel
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}
