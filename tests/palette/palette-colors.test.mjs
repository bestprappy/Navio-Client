import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";

const clientRoot = new URL("../../", import.meta.url);
registerHooks({ resolve(specifier, context, nextResolve) {
  const aliased = specifier.startsWith("@/") ? new URL(specifier.slice(2), clientRoot).href : specifier;
  const local = aliased.startsWith(".") || aliased.startsWith("file:");
  if (local && !/\.(?:ts|tsx|js|mjs|json)$/.test(aliased)) return nextResolve(`${aliased}.ts`, context);
  return nextResolve(aliased, context);
} });

const palette = await import("../../lib/palette/palette-colors.ts");
const colors = await import("../../app/feature/planner/planId/_components/constants/trip-block-colors.ts");
const { sharedDayColorId } = await import("../../app/feature/planner/_components/share/shared-plan-blocks.ts");
const { isAllowedPaletteRoute } = await import("../../app/api/admin/palette-colors/palette-routes.ts");
const { categorySchema } = await import("../../app/feature/admin/_components/guides/guide-storage.ts");

const color = (id, hex, retired = false) => ({ id, name: id, hex, retired });

test("built-in colors fall back to their theme tokens whether or not the palette has loaded", () => {
  palette.registerPaletteColors([]);
  assert.equal(colors.getTripBlockColorById("amber").value, "var(--palette-amber, var(--planner-block-amber))");
  assert.equal(colors.getTripBlockColorById("amber").foreground, "var(--palette-amber-fg, var(--planner-block-foreground))");
  palette.registerPaletteColors([color("amber", "#ea8a18")]);
  assert.equal(colors.getTripBlockColorById("amber").mapColor, "#ea8a18");
});

test("an admin-added color renders through its CSS variable and maps with its hex", () => {
  palette.registerPaletteColors([color("sunset-orange", "#e8590c")]);
  const resolved = colors.getTripBlockColorById("sunset-orange");
  assert.equal(resolved.id, "sunset-orange");
  assert.equal(resolved.value, "var(--palette-sunset-orange, var(--palette-teal, var(--planner-block-teal)))");
  assert.equal(resolved.mapColor, "#e8590c");
});

test("an added color still renders before the palette loads, falling back on the map only", () => {
  palette.registerPaletteColors([]);
  const resolved = colors.getTripBlockColorById("sunset-orange");
  assert.match(resolved.value, /^var\(--palette-sunset-orange, /);
  assert.equal(resolved.mapColor, "#00ae84");
});

test("a malformed saved color falls back to the first built-in color and never reaches CSS", () => {
  for (const value of ["#FF6B6B", "x);background:url(evil)", "Teal", ""]) {
    assert.equal(colors.getTripBlockColorById(value).id, "teal", value);
  }
});

test("a deleted color, built-in or added, resolves to the default color everywhere", () => {
  palette.registerPaletteColors([color("teal", "#00ae84"), { ...color("amber", "#00ae84", true), deleted: true }, { ...color("red", "#00ae84", true), deleted: true }]);
  for (const id of ["amber", "red"]) {
    const resolved = colors.getTripBlockColorById(id);
    assert.equal(resolved.id, "teal", id);
    assert.equal(resolved.mapColor, "#00ae84", id);
  }
});

test("a deleted color's CSS variables point at the default color so unrefreshed DOM follows too", () => {
  const css = palette.paletteCssVariables(palette.paletteColorsSchema.parse([{ ...color("red", "#00ae84", true), deleted: true }]));
  assert.equal(css, ":root{--palette-red:var(--palette-teal, #00ae84);--palette-red-fg:var(--palette-teal-fg, #ffffff);}");
});

test("label text follows the administrator's choice per theme", () => {
  const parsed = palette.paletteColorsSchema.parse([{ ...color("amber", "#ea8a18"), textOnLight: "white", textOnDark: "black" }]);
  assert.equal(palette.paletteCssVariables(parsed), ":root{--palette-amber:#ea8a18;--palette-amber-fg:#ffffff;}.dark{--palette-amber-fg:#14161c;}");
  assert.equal(palette.labelColor("#ea8a18", "auto"), "#14161c");
  assert.equal(palette.labelColor("#ea8a18", "white"), "#ffffff");
  assert.equal(palette.labelColor("#005189", "black"), "#14161c");
});

test("older palette responses without label or deleted fields still parse as automatic and live", () => {
  const [parsed] = palette.paletteColorsSchema.parse([color("ok", "#123456")]);
  assert.equal(parsed.deleted, false);
  assert.equal(parsed.textOnLight, "auto");
  assert.equal(palette.paletteColorsSchema.parse([{ ...color("ok", "#123456"), textOnDark: "purple" }])[0].textOnDark, "auto");
});

test("new days skip default colors an administrator retired", () => {
  palette.registerPaletteColors([color("teal", "#00ae84", true), color("cyan", "#00b2b2"), color("blue", "#008cdf")]);
  assert.deepEqual([0, 1, 2].map(colors.getTripBlockColorByIndex), ["cyan", "blue", "cyan"]);
});

test("new days use the active palette when every default color was retired", () => {
  palette.registerPaletteColors([color("teal", "#00ae84", true), color("sunset", "#e8590c"), color("moss", "#4d7c0f")]);
  assert.deepEqual([0, 1, 2].map(colors.getTripBlockColorByIndex), ["sunset", "moss", "sunset"]);
});

test("new days use the familiar defaults before the palette loads", () => {
  palette.registerPaletteColors([]);
  assert.deepEqual([0, 1, 2].map(colors.getTripBlockColorByIndex), ["teal", "cyan", "blue"]);
});

test("a shared day keeps its owner's color and older shares fall back to the default sequence", () => {
  palette.registerPaletteColors([]);
  assert.equal(sharedDayColorId({ label: "Day 1", colorId: "amber" }, 0), "amber");
  assert.equal(sharedDayColorId({ label: "Day 2", colorId: "sunset-orange" }, 1), "sunset-orange");
  assert.equal(sharedDayColorId({ label: "Day 3" }, 2), "blue");
  assert.equal(sharedDayColorId({ label: "Day 1", colorId: "x);color:red" }, 0), "teal");
});

test("text on a palette color uses whichever of white or dark reads better", () => {
  assert.equal(palette.readableForeground("#005189"), "#ffffff");
  assert.equal(palette.readableForeground("#fde047"), "#14161c");
});

test("colors that vanish on either theme are flagged before reaching the server", () => {
  assert.equal(palette.isVisibleOnBothThemes("#e8590c"), true);
  assert.equal(palette.isVisibleOnBothThemes("#fafafa"), false);
  assert.equal(palette.isVisibleOnBothThemes("#111111"), false);
});

test("the palette response rejects ids and hex codes that could break out of CSS", () => {
  assert.equal(palette.paletteColorsSchema.safeParse([color("bad;id", "#ffffff")]).success, false);
  assert.equal(palette.paletteColorsSchema.safeParse([color("ok", "red}body{x")]).success, false);
  const parsed = palette.paletteColorsSchema.parse([color("ok", "#ABCDEF")]);
  assert.equal(palette.paletteCssVariables(parsed), ":root{--palette-ok:#abcdef;--palette-ok-fg:#14161c;}");
});

test("the admin proxy forwards only list, add, label text, retire, restore and delete", () => {
  assert.equal(isAllowedPaletteRoute("GET", []), true);
  assert.equal(isAllowedPaletteRoute("POST", []), true);
  assert.equal(isAllowedPaletteRoute("POST", ["teal", "retire"]), true);
  assert.equal(isAllowedPaletteRoute("POST", ["teal", "restore"]), true);
  assert.equal(isAllowedPaletteRoute("PATCH", ["teal"]), true);
  assert.equal(isAllowedPaletteRoute("DELETE", ["teal"]), true);
  assert.equal(isAllowedPaletteRoute("DELETE", []), false);
  assert.equal(isAllowedPaletteRoute("DELETE", ["../users"]), false);
  assert.equal(isAllowedPaletteRoute("PATCH", ["teal", "retire"]), false);
  assert.equal(isAllowedPaletteRoute("PUT", ["teal"]), false);
  assert.equal(isAllowedPaletteRoute("POST", ["teal", "delete"]), false);
  assert.equal(isAllowedPaletteRoute("POST", ["../users", "retire"]), false);
});

test("guide categories accept any palette id but not raw colors", () => {
  const base = { id: "eat", name: "Eat", iconId: "utensils" };
  assert.equal(categorySchema.safeParse({ ...base, colorId: "sunset-orange" }).success, true);
  assert.equal(categorySchema.safeParse({ ...base, colorId: "#ff0000" }).success, false);
});
