import type { TripBlockColorId } from "./types";

export type TripBlockColorOption = {
  id: TripBlockColorId;
  label: string;
  value: string;
  foreground: string;
};

export const tripBlockColorOptions: TripBlockColorOption[] = [
  {
    id: "teal",
    label: "Teal",
    value: "var(--planner-block-teal)",
    foreground: "var(--planner-block-foreground)",
  },
  {
    id: "cyan",
    label: "Cyan",
    value: "var(--planner-block-cyan)",
    foreground: "var(--planner-block-foreground)",
  },
  {
    id: "blue",
    label: "Blue",
    value: "var(--planner-block-blue)",
    foreground: "var(--planner-block-foreground)",
  },
  {
    id: "indigo",
    label: "Indigo",
    value: "var(--planner-block-indigo)",
    foreground: "var(--planner-block-foreground)",
  },
  {
    id: "violet",
    label: "Violet",
    value: "var(--planner-block-violet)",
    foreground: "var(--planner-block-foreground)",
  },
  {
    id: "rose",
    label: "Rose",
    value: "var(--planner-block-rose)",
    foreground: "var(--planner-block-foreground)",
  },
  {
    id: "coral",
    label: "Coral",
    value: "var(--planner-block-coral)",
    foreground: "var(--planner-block-foreground)",
  },
  {
    id: "amber",
    label: "Amber",
    value: "var(--planner-block-amber)",
    foreground: "var(--planner-block-foreground)",
  },
  {
    id: "emerald",
    label: "Emerald",
    value: "var(--planner-block-emerald)",
    foreground: "var(--planner-block-foreground)",
  },
  {
    id: "pine",
    label: "Pine",
    value: "var(--planner-block-pine)",
    foreground: "var(--planner-block-foreground)",
  },
  {
    id: "navy",
    label: "Navy",
    value: "var(--planner-block-navy)",
    foreground: "var(--planner-block-foreground)",
  },
  {
    id: "slate",
    label: "Slate",
    value: "var(--planner-block-slate)",
    foreground: "var(--planner-block-foreground)",
  },
  {
    id: "plum",
    label: "Plum",
    value: "var(--planner-block-plum)",
    foreground: "var(--planner-block-foreground)",
  },
  {
    id: "wine",
    label: "Wine",
    value: "var(--planner-block-wine)",
    foreground: "var(--planner-block-foreground)",
  },
  {
    id: "brick",
    label: "Brick",
    value: "var(--planner-block-brick)",
    foreground: "var(--planner-block-foreground)",
  },
  {
    id: "rust",
    label: "Rust",
    value: "var(--planner-block-rust)",
    foreground: "var(--planner-block-foreground)",
  },
];

export const defaultTripBlockColorId = "blue" satisfies TripBlockColorId;

export function getTripBlockColorById(
  colorId: TripBlockColorId,
): TripBlockColorOption {
  return (
    tripBlockColorOptions.find((color) => color.id === colorId) ??
    tripBlockColorOptions[0]
  );
}

export function getTripBlockColorByIndex(index: number): TripBlockColorId {
  const color = tripBlockColorOptions[index % tripBlockColorOptions.length];

  return color?.id ?? defaultTripBlockColorId;
}
