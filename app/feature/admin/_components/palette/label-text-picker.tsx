"use client";

import { TriangleAlert } from "lucide-react";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DARK_SURFACE, LIGHT_SURFACE, labelColor } from "@/lib/palette/palette-colors";

import type { TextColors } from "./palette-api";
import { LABEL_TEXT_STYLES, labelTextStyleById, labelTextStyleId, lowContrastThemes } from "./label-text-styles";

type LabelTextPickerProps = {
  hex: string | null;
  value: TextColors;
  onValueChange: (value: TextColors) => void;
  disabled?: boolean;
  /** Ties the group to a visible heading. */
  labelledBy: string;
};

/** Chooses the text color drawn on a color, per theme, with a sample of each choice. */
export function LabelTextPicker({ hex, value, onValueChange, disabled = false, labelledBy }: LabelTextPickerProps) {
  const selected = labelTextStyleId(value);
  const lowContrast = hex ? lowContrastThemes(hex, value) : [];

  return (
    <div className="flex flex-col gap-2">
      <RadioGroup
        aria-labelledby={labelledBy}
        value={selected}
        disabled={disabled}
        onValueChange={(id) => {
          const style = labelTextStyleById(id);
          if (style) onValueChange({ textOnLight: style.textOnLight, textOnDark: style.textOnDark });
        }}
        className="gap-0.5"
      >
        {LABEL_TEXT_STYLES.map((style) => (
          <label
            key={style.id}
            className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-muted has-data-checked:bg-muted has-disabled:cursor-not-allowed has-disabled:opacity-60"
          >
            <RadioGroupItem value={style.id} />
            <LabelSample hex={hex} colors={style} />
            <span className="min-w-0 flex-1">{style.label}</span>
          </label>
        ))}
      </RadioGroup>
      {lowContrast.length > 0 ? (
        <p className="flex items-start gap-2 text-sm text-muted-foreground">
          <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-warning" />
          <span>Labels are hard to read on this color in the {lowContrast.length === 2 ? "light and dark themes" : `${lowContrast[0]} theme`}.</span>
        </p>
      ) : null}
    </div>
  );
}

/** "Aa" on the color, once on each theme's surface. */
function LabelSample({ hex, colors }: { hex: string | null; colors: TextColors }) {
  return (
    <span aria-hidden="true" className="flex shrink-0 overflow-hidden rounded-md shadow-[inset_0_0_0_1px_var(--border)]">
      {([[LIGHT_SURFACE, colors.textOnLight], [DARK_SURFACE, colors.textOnDark]] as const).map(([surface, choice]) => (
        <span key={surface} className="p-1" style={{ backgroundColor: surface }}>
          <span
            className="flex h-5 w-7 items-center justify-center rounded text-xs font-semibold"
            style={hex ? { backgroundColor: hex, color: labelColor(hex, choice) } : { backgroundColor: "var(--muted)" }}
          >
            Aa
          </span>
        </span>
      ))}
    </span>
  );
}
