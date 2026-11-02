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

const styles = await import("../../app/feature/admin/_components/palette/label-text-styles.ts");

test("the menu offers automatic plus every white/black combination across the two themes", () => {
  const combos = styles.LABEL_TEXT_STYLES.map((style) => `${style.textOnLight}/${style.textOnDark}`);
  assert.deepEqual(combos, ["auto/auto", "white/white", "black/black", "white/black", "black/white"]);
});

test("a saved choice maps back to its menu entry, and an unlisted mix is reported as custom", () => {
  assert.equal(styles.labelTextStyleId({ textOnLight: "black", textOnDark: "white" }), "black-light");
  assert.equal(styles.labelTextStyleId({ textOnLight: "auto", textOnDark: "white" }), "custom");
});

test("hard-to-read label text is flagged per theme", () => {
  assert.deepEqual(styles.lowContrastThemes("#fde047", { textOnLight: "white", textOnDark: "black" }), ["light"]);
  assert.deepEqual(styles.lowContrastThemes("#005189", { textOnLight: "black", textOnDark: "black" }), ["light", "dark"]);
  assert.deepEqual(styles.lowContrastThemes("#005189", { textOnLight: "auto", textOnDark: "white" }), []);
});
