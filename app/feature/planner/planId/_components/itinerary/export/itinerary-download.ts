import { downloadFile, toFileNameSlug } from "@/lib/download-file";

import { toCsv } from "./itinerary-csv";
import { toSheetRows } from "./itinerary-sheet";
import type { ItineraryTable } from "./itinerary-table";
import { createItineraryWorkbook } from "./itinerary-xlsx";

export type SpreadsheetFormat = "csv" | "xlsx";

const XLSX_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** Saves the table as a spreadsheet; throws when the file cannot be created. */
export function downloadItinerarySpreadsheet(table: ItineraryTable, format: SpreadsheetFormat, fileName: string): void {
  const baseName = `${toFileNameSlug(fileName, "trip")}-itinerary`;
  if (format === "csv") {
    downloadFile(toCsv(toSheetRows(table)), `${baseName}.csv`, "text/csv;charset=utf-8");
  } else {
    downloadFile(createItineraryWorkbook(table), `${baseName}.xlsx`, XLSX_TYPE);
  }
}
