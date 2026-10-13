import type { SheetCell, SheetRow } from "./itinerary-sheet";

// A cell starting with one of these is run as a formula by spreadsheet apps.
// Shared plans are written by other people, so their text is never trusted.
const FORMULA_PREFIX = /^[=+\-@\t\r]/;

export function toCsvCell(value: SheetCell): string {
  if (value === null) return "";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  const text = FORMULA_PREFIX.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(text) ? `"${text.replaceAll("\"", "\"\"")}"` : text;
}

/** RFC 4180 CSV with a byte-order mark so Excel opens Thai and other scripts as UTF-8. */
export function toCsv(rows: SheetRow[]): string {
  return `﻿${rows.map((row) => row.cells.map(toCsvCell).join(",")).join("\r\n")}\r\n`;
}
