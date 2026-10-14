import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { pathToFileURL } from "node:url";
import { test } from "node:test";

const clientRoot = pathToFileURL(`${process.cwd()}/`).href;
registerHooks({ resolve(specifier, context, next) {
  const aliased = specifier.startsWith("@/") ? new URL(specifier.slice(2), clientRoot).href : specifier;
  const local = aliased.startsWith(".") || aliased.startsWith("file:");
  return next(local && !/\.(?:[cm]?js|tsx?|json)$/.test(aliased) ? `${aliased}.ts` : aliased, context);
} });

const exportDir = "../../app/feature/planner/planId/_components/itinerary/export";
const { buildItineraryTable, formatTableTime } = await import(`${exportDir}/itinerary-table.ts`);
const { toSheetRows } = await import(`${exportDir}/itinerary-sheet.ts`);
const { toCsv, toCsvCell } = await import(`${exportDir}/itinerary-csv.ts`);
const { createItineraryWorkbook, columnLetter, tintHex } = await import(`${exportDir}/itinerary-xlsx.ts`);
const { crc32 } = await import("../../lib/zip.ts");
const { anchors, dayOne, dayTwo, expenses, listBlock } = await import("./itinerary-export/data.ts");

const build = (overrides = {}) => buildItineraryTable({
  blocks: [dayTwo, listBlock, dayOne],
  expenses,
  currency: "THB",
  anchors,
  ...overrides,
});

test("each day lists its start, places and charging stops in order, then its end, without notes or checklists", () => {
  const [first] = build().days;
  assert.deepEqual(first.rows.map((row) => [row.kind, row.name]), [
    ["start", "Suvarnabhumi Airport"],
    ["place", "Wat Arun"],
    ["place", "Jay Fai"],
    ["charger", "PTT EV Station"],
    ["end", "Riva Hotel"],
  ]);
  assert.equal(first.rows[3].chargeDetail, "About 45 min, charge to 80%");
});

test("days are ordered by date and saved lists are not exported", () => {
  const table = build();
  assert.deepEqual(table.days.map((day) => [day.id, day.number]), [["day-one", 1], ["day-two", 2]]);
});

test("choosing one day keeps its number from the whole trip", () => {
  const table = build({ dayIds: new Set(["day-two"]) });
  assert.deepEqual(table.days.map((day) => [day.id, day.number]), [["day-two", 2]]);
  assert.equal(table.total, 450);
});

test("a stop lists its linked expenses and a stop with only a stored cost shows that cost", () => {
  const table = build();
  const jayFai = table.days[0].rows.find((row) => row.id === "jay-fai");
  assert.deepEqual(jayFai.expenses.map((expense) => [expense.label, expense.categoryLabel, expense.amount]), [
    ["Crab omelette", "Food", 1000],
    ["Drinks", "Drinks", 120.5],
  ]);
  assert.equal(jayFai.total, 1120.5);
  const market = table.days[1].rows.find((row) => row.id === "market");
  assert.deepEqual(market.expenses, []);
  assert.equal(market.total, 450);
});

test("day totals add up their stops and the trip total ignores expenses not tied to a stop", () => {
  const table = build();
  assert.deepEqual(table.days.map((day) => day.total), [1120.5, 450]);
  assert.equal(table.total, 1570.5);
});

test("times read as a range, a single time or nothing", () => {
  const rows = build().days[0].rows;
  assert.deepEqual(rows.map((row) => row.time), [null, "9:00 AM – 10:30 AM", "12:00 PM", null, null]);
  assert.equal(formatTableTime("00:05"), "12:05 AM");
  assert.equal(formatTableTime("23:59"), "11:59 PM");
});

test("spreadsheet rows repeat the day on every stop and add day and trip totals", () => {
  const rows = toSheetRows(build());
  assert.deepEqual(rows[0].cells, ["Day", "Date", "Time", "Stop", "Place", "Address", "Notes", "Expenses", "Cost (THB)"]);
  assert.deepEqual(rows[1].cells.slice(0, 5), ["Day 1", "Tue, Dec 22", "", "Start", "Suvarnabhumi Airport"]);
  const jayFai = rows.find((row) => row.cells[4] === "Jay Fai");
  assert.equal(jayFai.cells[7], "Food: Crab omelette ฿1,000.00\nDrinks: ฿120.50");
  assert.equal(jayFai.cells[8], 1120.5);
  const charger = rows.find((row) => row.cells[3] === "EV charging");
  assert.equal(charger.cells[6], "About 45 min, charge to 80%");
  assert.deepEqual(rows.filter((row) => row.kind === "day-total").map((row) => row.cells.slice(-2)), [["Day 1 total", 1120.5], ["Day 2 total", 450]]);
  assert.deepEqual(rows.at(-1).cells.slice(-2), ["Trip total", 1570.5]);
});

test("CSV quotes separators and blocks spreadsheet formulas from plan text", () => {
  assert.equal(toCsvCell("Cover shoulders, \"no shorts\""), "\"Cover shoulders, \"\"no shorts\"\"\"");
  assert.equal(toCsvCell("=HYPERLINK(\"x\")"), "\"'=HYPERLINK(\"\"x\"\")\"");
  assert.equal(toCsvCell("+66 2 123"), "'+66 2 123");
  assert.equal(toCsvCell(1120.5), "1120.5");
  assert.equal(toCsvCell(null), "");
  const csv = toCsv(toSheetRows(build()));
  assert.ok(csv.startsWith("﻿Day,Date,Time,"));
  assert.ok(csv.includes("\"'=HYPERLINK("));
  assert.ok(csv.endsWith("\r\n"));
});

function readZip(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const end = bytes.byteLength - 22;
  assert.equal(view.getUint32(end, true), 0x06054b50);
  const count = view.getUint16(end + 10, true);
  let pointer = view.getUint32(end + 16, true);
  const files = new Map();
  for (let index = 0; index < count; index++) {
    assert.equal(view.getUint32(pointer, true), 0x02014b50);
    const crc = view.getUint32(pointer + 16, true);
    const size = view.getUint32(pointer + 20, true);
    const nameLength = view.getUint16(pointer + 28, true);
    const offset = view.getUint32(pointer + 42, true);
    const name = new TextDecoder().decode(bytes.subarray(pointer + 46, pointer + 46 + nameLength));
    assert.equal(view.getUint32(offset, true), 0x04034b50);
    const dataStart = offset + 30 + view.getUint16(offset + 26, true);
    const data = bytes.subarray(dataStart, dataStart + size);
    assert.equal(crc32(data), crc, `${name} checksum`);
    files.set(name, new TextDecoder().decode(data));
    pointer += 46 + nameLength;
  }
  return files;
}

test("the Excel file is a valid package with escaped text, numeric costs and day colors", () => {
  const files = readZip(createItineraryWorkbook(build()));
  assert.deepEqual([...files.keys()], [
    "[Content_Types].xml",
    "_rels/.rels",
    "xl/workbook.xml",
    "xl/_rels/workbook.xml.rels",
    "xl/worksheets/sheet1.xml",
    "xl/styles.xml",
  ]);
  const sheet = files.get("xl/worksheets/sheet1.xml");
  assert.ok(sheet.includes("Cover shoulders, &quot;no shorts&quot;"));
  assert.ok(sheet.includes("<v>1120.5</v>"));
  assert.ok(sheet.includes("state=\"frozen\""));
  const styles = files.get("xl/styles.xml");
  assert.ok(styles.includes("rgb=\"FF00AE84\""), "teal day fill");
  assert.ok(styles.includes("rgb=\"FFEA8A18\""), "amber day fill");
  assert.ok(styles.includes("formatCode=\"#,##0.00\""));
});

test("Excel money format follows the currency's decimals", () => {
  const files = readZip(createItineraryWorkbook(build({ currency: "JPY" })));
  assert.ok(files.get("xl/styles.xml").includes("formatCode=\"#,##0\""));
});

test("control characters pasted into notes cannot break the Excel XML", () => {
  const noisy = { ...dayTwo, items: [{ ...dayTwo.items[0], notes: "Gate\u0007 B <left>" }] };
  const sheet = readZip(createItineraryWorkbook(build({ blocks: [noisy] }))).get("xl/worksheets/sheet1.xml");
  assert.ok(sheet.includes("Gate B &lt;left&gt;"));
});

test("column letters and day tints are computed exactly", () => {
  assert.deepEqual([0, 8, 25, 26, 27].map(columnLetter), ["A", "I", "Z", "AA", "AB"]);
  assert.equal(tintHex("#00AE84"), "D6F2EB");
  assert.equal(tintHex("#000000", 1), "000000");
});

test("stops are numbered like the map pins: start first, places in order, charging stops unnumbered, end last", () => {
  const [first, second] = build().days;
  assert.deepEqual(first.rows.map((row) => [row.name, row.position]), [
    ["Suvarnabhumi Airport", 1],
    ["Wat Arun", 2],
    ["Jay Fai", 3],
    ["PTT EV Station", null],
    ["Riva Hotel", 4],
  ]);
  assert.deepEqual(second.rows.map((row) => row.position), [1, 2]);
});

test("anchor rows use the route point ID, so the leg arriving at the day's end can be found", () => {
  const [first] = build().days;
  assert.equal(first.rows[0].id, "day-one:start");
  assert.equal(first.rows.at(-1).id, "day-one:end");
});

test("a day spans from its first timed stop to the last one's end, and is null without times", () => {
  const [first, second] = build().days;
  assert.equal(first.timeSpan, "9:00 AM – 12:00 PM");
  assert.equal(second.timeSpan, null);
});

test("a named day keeps its name and a day titled with its date has none", () => {
  const named = { ...dayTwo, title: "Weekend market" };
  const dated = { ...dayOne, title: dayOne.date };
  const days = build({ blocks: [named, dated] }).days;
  assert.deepEqual(days.map((day) => day.title), ["", "Weekend market"]);
});

test("the times inside a stop are sorted and formatted, and blank rows are dropped", () => {
  const withMoments = {
    ...dayTwo,
    items: [{
      ...dayTwo.items[0],
      schedule: [
        { id: "m2", time: "10:30", label: "Lunch at the food court " },
        { id: "m1", time: "09:00", timeEnd: "09:10", label: "Meet at gate 1" },
        { id: "blank", time: "", label: "  " },
      ],
    }],
  };
  const [day] = build({ blocks: [withMoments] }).days;
  assert.deepEqual(day.rows[1].moments, [
    { id: "m1", time: "9:00 AM – 9:10 AM", label: "Meet at gate 1" },
    { id: "m2", time: "10:30 AM", label: "Lunch at the food court" },
  ]);
});

test("only times filled by Calculate times are marked calculated", () => {
  const calculated = { ...dayTwo, items: [{ ...dayTwo.items[0], time: "14:00", timeSource: "calculated" }] };
  const untimed = { ...dayTwo, items: [{ ...dayTwo.items[0], timeSource: "calculated" }] };
  assert.equal(build({ blocks: [calculated] }).days[0].rows[1].timeIsCalculated, true);
  assert.equal(build({ blocks: [untimed] }).days[0].rows[1].timeIsCalculated, false);
  assert.equal(build().days[0].rows[1].timeIsCalculated, false);
});

test("rows carry clock minutes for stays and a place's type for its tag", () => {
  const [first] = build().days;
  const watArun = first.rows.find((row) => row.id === "wat-arun");
  assert.deepEqual([watArun.startMinute, watArun.endMinute], [540, 630]);
  assert.deepEqual([first.rows[0].startMinute, first.rows[0].category], [null, null]);
  const typed = { ...dayTwo, items: [{ ...dayTwo.items[0], description: " Market ", placeType: "market" }] };
  const market = build({ blocks: [typed] }).days[0].rows[1];
  assert.deepEqual([market.category, market.placeType], ["Market", "market"]);
});
