"use client";

import { useId, useState } from "react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { hexToRgb, hslToRgb, hsvToRgb, rgbToHex, rgbToHsl, type Rgb } from "@/lib/color/color-math";
import { cn } from "@/lib/utils";

import { useColorPickerContext } from "./color-picker-context";

export type ColorFormat = "hex" | "rgb" | "hsl";

const FORMATS: { value: ColorFormat; label: string }[] = [
  { value: "hex", label: "HEX" },
  { value: "rgb", label: "RGB" },
  { value: "hsl", label: "HSL" },
];

type Channel = { key: string; label: string; value: number; max: number; suffix?: string; toRgb: (value: number) => Rgb };

/** A format menu and the picked color's channels in that format, each editable. */
export function ColorChannels({ defaultFormat = "hex", className }: { defaultFormat?: ColorFormat; className?: string }) {
  const { hsv, hex, disabled, setHex } = useColorPickerContext("Channels");
  const [format, setFormat] = useState<ColorFormat>(defaultFormat);
  const formatLabelId = useId();
  const rgb = hsvToRgb(hsv);
  const hsl = rgbToHsl(rgb);
  // Greys report hue 0; keep the hue the picker is showing instead.
  const hue = Math.round(hsv.h) % 360;

  const channels: Channel[] = format === "rgb"
    ? [
        { key: "r", label: "Red", value: rgb.r, max: 255, toRgb: (r) => ({ ...rgb, r }) },
        { key: "g", label: "Green", value: rgb.g, max: 255, toRgb: (g) => ({ ...rgb, g }) },
        { key: "b", label: "Blue", value: rgb.b, max: 255, toRgb: (b) => ({ ...rgb, b }) },
      ]
    : [
        { key: "h", label: "Hue", value: hue, max: 359, toRgb: (h) => hslToRgb({ ...hsl, h }) },
        { key: "s", label: "Saturation", value: Math.round(hsl.s), max: 100, suffix: "%", toRgb: (s) => hslToRgb({ ...hsl, h: hue, s }) },
        { key: "l", label: "Lightness", value: Math.round(hsl.l), max: 100, suffix: "%", toRgb: (l) => hslToRgb({ ...hsl, h: hue, l }) },
      ];

  return (
    <div className={cn("flex items-stretch gap-2", className)}>
      <span id={formatLabelId} className="sr-only">Color format</span>
      <Select value={format} onValueChange={(value) => value && setFormat(value as ColorFormat)} disabled={disabled}>
        <SelectTrigger aria-labelledby={formatLabelId} className="h-9 w-[5.5rem] shrink-0 font-medium">
          <SelectValue>{(value: ColorFormat) => FORMATS.find((option) => option.value === value)?.label}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {FORMATS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
        </SelectContent>
      </Select>

      <div className="flex h-9 min-w-0 flex-1 overflow-hidden rounded-lg border border-input bg-transparent focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30">
        {format === "hex" ? (
          <HexInput hex={hex} disabled={disabled} onCommit={setHex} />
        ) : (
          channels.map((channel, index) => (
            <ChannelInput
              key={`${format}-${channel.key}`}
              channel={channel}
              disabled={disabled}
              divided={index > 0}
              onCommit={(value) => setHex(rgbToHex(channel.toRgb(value)))}
            />
          ))
        )}
      </div>
    </div>
  );
}

/** Shows the live value until someone types, then keeps their text until it is valid or they leave. */
function useDraft(current: string) {
  const [draft, setDraft] = useState<string | null>(null);
  return { text: draft ?? current, setDraft, reset: () => setDraft(null) };
}

function HexInput({ hex, disabled, onCommit }: { hex: string; disabled: boolean; onCommit: (hex: string) => void }) {
  const display = hex.slice(1).toUpperCase();
  const { text, setDraft, reset } = useDraft(display);
  return (
    <label className="flex min-w-0 flex-1 items-center gap-1 px-3 text-sm">
      <span aria-hidden="true" className="text-muted-foreground">#</span>
      <span className="sr-only">Hex code</span>
      <input
        value={text}
        disabled={disabled}
        maxLength={7}
        spellCheck={false}
        autoComplete="off"
        className="min-w-0 flex-1 bg-transparent tabular-nums uppercase outline-none disabled:cursor-not-allowed"
        onChange={(event) => {
          const next = event.target.value.replace(/^#/, "");
          setDraft(next);
          if (hexToRgb(next)) onCommit(`#${next}`);
        }}
        onBlur={reset}
      />
    </label>
  );
}

function ChannelInput({ channel, disabled, divided, onCommit }: { channel: Channel; disabled: boolean; divided: boolean; onCommit: (value: number) => void }) {
  const { text, setDraft, reset } = useDraft(String(channel.value));
  return (
    <label className={cn("flex min-w-0 flex-1 items-center justify-center gap-0.5 px-2 text-sm", divided && "border-l border-input")}>
      <span className="sr-only">{channel.label}</span>
      <input
        inputMode="numeric"
        value={text}
        disabled={disabled}
        maxLength={3}
        autoComplete="off"
        className="w-full min-w-0 bg-transparent text-center tabular-nums outline-none disabled:cursor-not-allowed"
        onChange={(event) => {
          setDraft(event.target.value);
          const value = Number(event.target.value);
          if (event.target.value.trim() !== "" && Number.isInteger(value) && value >= 0 && value <= channel.max) onCommit(value);
        }}
        onKeyDown={(event) => {
          if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
          event.preventDefault();
          const next = Math.min(channel.max, Math.max(0, channel.value + (event.key === "ArrowUp" ? 1 : -1) * (event.shiftKey ? 10 : 1)));
          reset();
          onCommit(next);
        }}
        onBlur={reset}
      />
      {channel.suffix ? <span aria-hidden="true" className="text-muted-foreground">{channel.suffix}</span> : null}
    </label>
  );
}
