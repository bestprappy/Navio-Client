import { Moon, Sun } from "lucide-react";

import { DARK_SURFACE, LIGHT_SURFACE, labelColor } from "@/lib/palette/palette-colors";

import type { TextColors } from "./palette-api";

type PaletteThemePreviewProps = TextColors & {
  hex: string | null;
  name: string;
};

const THEMES = [
  { id: "light", label: "Light theme", Icon: Sun, surface: LIGHT_SURFACE, text: "#14161c" },
  { id: "dark", label: "Dark theme", Icon: Moon, surface: DARK_SURFACE, text: "#f5f6f8" },
] as const;

/**
 * The color as travelers meet it: a numbered stop, its route line and a day
 * label, drawn side by side on the light and the dark surface.
 */
export function PaletteThemePreview({ hex, name, textOnLight, textOnDark }: PaletteThemePreviewProps) {
  const label = name.trim() || "Day 1";
  return (
    <div className="grid overflow-hidden rounded-lg shadow-[inset_0_0_0_1px_var(--border)] sm:grid-cols-2" role="group" aria-label="Preview in both themes">
      {THEMES.map(({ id, label: themeLabel, Icon, surface, text }) => {
        const foreground = hex ? labelColor(hex, id === "light" ? textOnLight : textOnDark) : text;
        return (
          <figure key={id} className="flex min-w-0 flex-col gap-3 p-3" style={{ backgroundColor: surface, color: text }}>
            <figcaption className="flex items-center gap-1.5 text-xs opacity-70">
              <Icon aria-hidden="true" className="size-3.5" />
              {themeLabel}
            </figcaption>
            {hex ? (
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold" style={{ backgroundColor: hex, color: foreground }}>1</span>
                <span aria-hidden="true" className="h-1 min-w-4 flex-1 rounded-full" style={{ backgroundColor: hex }} />
                <span className="truncate rounded-md px-2 py-0.5 text-xs font-semibold" style={{ backgroundColor: hex, color: foreground }}>{label}</span>
              </div>
            ) : (
              <p className="text-xs opacity-70">Pick a color to preview it.</p>
            )}
          </figure>
        );
      })}
    </div>
  );
}
