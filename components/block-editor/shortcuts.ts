/** Keyboard shortcut labels, written the way the visitor's platform writes them. */

export type Shortcut = readonly string[];

export const SHORTCUTS = {
  bold: ["Mod", "B"],
  italic: ["Mod", "I"],
  underline: ["Mod", "U"],
  strike: ["Mod", "Shift", "S"],
  code: ["Mod", "E"],
  link: ["Mod", "K"],
  duplicate: ["Mod", "D"],
  moveUp: ["Mod", "Shift", "ArrowUp"],
  moveDown: ["Mod", "Shift", "ArrowDown"],
  blockMenu: ["Mod", "/"],
  toolbar: ["Alt", "F10"],
} as const satisfies Record<string, Shortcut>;

const APPLE_SYMBOLS: Record<string, string> = { Mod: "⌘", Shift: "⇧", Alt: "⌥", ArrowUp: "↑", ArrowDown: "↓" };
const OTHER_LABELS: Record<string, string> = { Mod: "Ctrl", ArrowUp: "↑", ArrowDown: "↓" };

export function isApplePlatform(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);
}

export function formatShortcut(keys: Shortcut, apple = isApplePlatform()): string {
  return apple ? keys.map((key) => APPLE_SYMBOLS[key] ?? key).join("") : keys.map((key) => OTHER_LABELS[key] ?? key).join("+");
}

/** The value for `aria-keyshortcuts`. */
export function ariaShortcut(keys: Shortcut, apple = isApplePlatform()): string {
  return keys.map((key) => (key === "Mod" ? (apple ? "Meta" : "Control") : key)).join("+");
}
