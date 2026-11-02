import assert from "node:assert/strict";
import { test } from "node:test";

const math = await import("../../lib/color/color-math.ts");

test("hex parses with or without the hash and rejects anything else", () => {
  assert.deepEqual(math.hexToRgb("#E8590C"), { r: 232, g: 89, b: 12 });
  assert.deepEqual(math.hexToRgb("e8590c"), { r: 232, g: 89, b: 12 });
  for (const value of ["#e859", "red", "#e8590cz", ""]) assert.equal(math.hexToRgb(value), null, value);
});

test("every built-in palette color survives a round trip through HSV and HSL", () => {
  for (const hex of ["#00ae84", "#008cdf", "#ea8a18", "#4e535b", "#ffffff", "#000000", "#e8590c"]) {
    const rgb = math.hexToRgb(hex);
    assert.equal(math.rgbToHex(math.hsvToRgb(math.rgbToHsv(rgb))), hex, `hsv ${hex}`);
    assert.equal(math.rgbToHex(math.hslToRgb(math.rgbToHsl(rgb))), hex, `hsl ${hex}`);
  }
});

test("the picker's corners are white, black and the pure hue", () => {
  assert.equal(math.rgbToHex(math.hsvToRgb({ h: 200, s: 0, v: 100 })), "#ffffff");
  assert.equal(math.rgbToHex(math.hsvToRgb({ h: 200, s: 100, v: 0 })), "#000000");
  assert.equal(math.rgbToHex(math.hsvToRgb({ h: 0, s: 100, v: 100 })), "#ff0000");
  assert.equal(math.rgbToHex(math.hsvToRgb({ h: 360, s: 100, v: 100 })), "#ff0000");
});

test("out-of-range channels are clamped instead of producing invalid hex", () => {
  assert.equal(math.rgbToHex({ r: 300, g: -4, b: 12.6 }), "#ff000d");
});
