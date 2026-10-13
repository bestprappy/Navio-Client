import { createZip } from "@/lib/zip";

import type { CurrencyCode } from "../../budget/budget.types";
import { getTripBlockColorById } from "../../constants/trip-block-colors";
import type { TripBlockColorId } from "../../constants/types";
import { getSheetColumns, toSheetRows, type SheetCell, type SheetRow } from "./itinerary-sheet";
import type { ItineraryTable } from "./itinerary-table";

const MAIN_NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
const REL_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const XML_HEADER = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\n";
const MAX_CELL_TEXT = 32767;

const HEADER_FILL = "F1F3F7";
const TRIP_TOTAL_FILL = "E4E8F0";
const RULE_COLOR = "D5D9E2";

// XML 1.0 forbids most control characters; a pasted note can still contain them.
const INVALID_XML_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g;

function escapeXml(value: string): string {
  return value
    .replace(INVALID_XML_CHARS, "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;");
}

export function columnLetter(index: number): string {
  let letter = "";
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) {
    letter = String.fromCharCode(65 + ((n - 1) % 26)) + letter;
  }
  return letter;
}

/** Day color mixed with white, for cells that should read as part of the day without shouting. */
export function tintHex(hex: string, strength = 0.16): string {
  const value = hex.replace("#", "");
  return [0, 2, 4]
    .map((start) => {
      const channel = Number.parseInt(value.slice(start, start + 2), 16);
      return Math.round(channel * strength + 255 * (1 - strength)).toString(16).padStart(2, "0");
    })
    .join("")
    .toUpperCase();
}

function dayHex(colorId: TripBlockColorId): string {
  return getTripBlockColorById(colorId).mapColor.replace("#", "").toUpperCase();
}

type CellStyle = {
  font: "regular" | "bold" | "bold-white";
  fill: string | null;
  ruled: boolean;
  money: boolean;
  align?: "right";
};

/** Registers each distinct cell style once and hands back its index in styles.xml. */
class StyleSheet {
  private readonly fills: string[] = [];
  private readonly xfs: string[] = ["<xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\" xfId=\"0\"/>"];
  private readonly xfIndex = new Map<string, number>();

  constructor(private readonly moneyFormat: string) {}

  index(style: CellStyle): number {
    const key = JSON.stringify(style);
    const existing = this.xfIndex.get(key);
    if (existing !== undefined) return existing;
    const fontId = { regular: 0, bold: 1, "bold-white": 2 }[style.font];
    const fillId = style.fill ? this.fillId(style.fill) : 0;
    const alignment = `<alignment vertical="top" wrapText="1"${style.align ? ` horizontal="${style.align}"` : ""}/>`;
    const xf = `<xf numFmtId="${style.money ? 164 : 0}" fontId="${fontId}" fillId="${fillId}" borderId="${style.ruled ? 1 : 0}" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">${alignment}</xf>`;
    this.xfs.push(xf);
    this.xfIndex.set(key, this.xfs.length - 1);
    return this.xfs.length - 1;
  }

  private fillId(hex: string): number {
    const existing = this.fills.indexOf(hex);
    // Fills 0 and 1 are reserved by the format (none and gray125).
    if (existing >= 0) return existing + 2;
    this.fills.push(hex);
    return this.fills.length + 1;
  }

  toXml(): string {
    const fills = [
      "<fill><patternFill patternType=\"none\"/></fill>",
      "<fill><patternFill patternType=\"gray125\"/></fill>",
      ...this.fills.map((hex) => `<fill><patternFill patternType="solid"><fgColor rgb="FF${hex}"/><bgColor indexed="64"/></patternFill></fill>`),
    ];
    return `${XML_HEADER}<styleSheet xmlns="${MAIN_NS}">`
      + `<numFmts count="1"><numFmt numFmtId="164" formatCode="${escapeXml(this.moneyFormat)}"/></numFmts>`
      + "<fonts count=\"3\">"
      + "<font><sz val=\"11\"/><name val=\"Calibri\"/><family val=\"2\"/></font>"
      + "<font><b/><sz val=\"11\"/><name val=\"Calibri\"/><family val=\"2\"/></font>"
      + "<font><b/><sz val=\"11\"/><color rgb=\"FFFFFFFF\"/><name val=\"Calibri\"/><family val=\"2\"/></font>"
      + "</fonts>"
      + `<fills count="${fills.length}">${fills.join("")}</fills>`
      + "<borders count=\"2\"><border><left/><right/><top/><bottom/><diagonal/></border>"
      + `<border><left/><right/><top/><bottom style="thin"><color rgb="FF${RULE_COLOR}"/></bottom><diagonal/></border></borders>`
      + "<cellStyleXfs count=\"1\"><xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\"/></cellStyleXfs>"
      + `<cellXfs count="${this.xfs.length}">${this.xfs.join("")}</cellXfs>`
      + "<cellStyles count=\"1\"><cellStyle name=\"Normal\" xfId=\"0\" builtinId=\"0\"/></cellStyles>"
      + "</styleSheet>";
  }
}

function moneyFormatFor(currency: CurrencyCode): string {
  const digits = new Intl.NumberFormat("en-US", { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2;
  return digits > 0 ? `#,##0.${"0".repeat(digits)}` : "#,##0";
}

function cellStyle(row: SheetRow, column: number, lastColumn: number): CellStyle {
  const money = column === lastColumn;
  switch (row.kind) {
    case "header":
      return { font: "bold", fill: HEADER_FILL, ruled: true, money: false, align: money ? "right" : undefined };
    case "trip-total":
      return { font: "bold", fill: TRIP_TOTAL_FILL, ruled: false, money, align: column >= lastColumn - 1 ? "right" : undefined };
    case "stop":
    case "day-total": {
      const color = dayHex(row.colorId);
      if (column === 0) return { font: "bold-white", fill: color, ruled: false, money: false };
      const isTotal = row.kind === "day-total";
      return {
        font: isTotal && column >= lastColumn - 1 ? "bold" : "regular",
        fill: column === 1 || isTotal ? tintHex(color) : null,
        ruled: true,
        money,
        align: isTotal && column >= lastColumn - 1 ? "right" : undefined,
      };
    }
  }
}

function cellXml(value: SheetCell, reference: string, style: number): string {
  if (value === null || value === "") return `<c r="${reference}" s="${style}"/>`;
  if (typeof value === "number") {
    return Number.isFinite(value) ? `<c r="${reference}" s="${style}"><v>${value}</v></c>` : `<c r="${reference}" s="${style}"/>`;
  }
  const text = escapeXml(value.slice(0, MAX_CELL_TEXT));
  return `<c r="${reference}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${text}</t></is></c>`;
}

export function createItineraryWorkbook(table: ItineraryTable): Uint8Array<ArrayBuffer> {
  const columns = getSheetColumns(table);
  const rows = toSheetRows(table);
  const styles = new StyleSheet(moneyFormatFor(table.currency));
  const lastColumn = columns.length - 1;

  const sheetData = rows
    .map((row, rowIndex) => {
      const cells = row.cells
        .map((value, column) => cellXml(value, `${columnLetter(column)}${rowIndex + 1}`, styles.index(cellStyle(row, column, lastColumn))))
        .join("");
      return `<row r="${rowIndex + 1}">${cells}</row>`;
    })
    .join("");
  const cols = columns
    .map((column, index) => `<col min="${index + 1}" max="${index + 1}" width="${column.width}" customWidth="1"/>`)
    .join("");

  const sheet = `${XML_HEADER}<worksheet xmlns="${MAIN_NS}" xmlns:r="${REL_NS}">`
    + "<sheetPr><pageSetUpPr fitToPage=\"1\"/></sheetPr>"
    + "<sheetViews><sheetView workbookViewId=\"0\"><pane ySplit=\"1\" topLeftCell=\"A2\" activePane=\"bottomLeft\" state=\"frozen\"/></sheetView></sheetViews>"
    + "<sheetFormatPr defaultRowHeight=\"15\"/>"
    + `<cols>${cols}</cols><sheetData>${sheetData}</sheetData>`
    + "<pageMargins left=\"0.5\" right=\"0.5\" top=\"0.75\" bottom=\"0.75\" header=\"0.3\" footer=\"0.3\"/>"
    + "<pageSetup orientation=\"landscape\" fitToWidth=\"1\" fitToHeight=\"0\"/>"
    + "</worksheet>";

  return createZip([
    {
      name: "[Content_Types].xml",
      data: `${XML_HEADER}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">`
        + "<Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/>"
        + "<Default Extension=\"xml\" ContentType=\"application/xml\"/>"
        + "<Override PartName=\"/xl/workbook.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml\"/>"
        + "<Override PartName=\"/xl/worksheets/sheet1.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml\"/>"
        + "<Override PartName=\"/xl/styles.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml\"/>"
        + "</Types>",
    },
    {
      name: "_rels/.rels",
      data: `${XML_HEADER}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`
        + `<Relationship Id="rId1" Type="${REL_NS}/officeDocument" Target="xl/workbook.xml"/>`
        + "</Relationships>",
    },
    {
      name: "xl/workbook.xml",
      data: `${XML_HEADER}<workbook xmlns="${MAIN_NS}" xmlns:r="${REL_NS}">`
        + "<sheets><sheet name=\"Itinerary\" sheetId=\"1\" r:id=\"rId1\"/></sheets></workbook>",
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      data: `${XML_HEADER}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`
        + `<Relationship Id="rId1" Type="${REL_NS}/worksheet" Target="worksheets/sheet1.xml"/>`
        + `<Relationship Id="rId2" Type="${REL_NS}/styles" Target="styles.xml"/>`
        + "</Relationships>",
    },
    { name: "xl/worksheets/sheet1.xml", data: sheet },
    { name: "xl/styles.xml", data: styles.toXml() },
  ]);
}
