"use client";

import { useId } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

type ShareOptionRowProps = {
  label: string;
  /** Says what including this actually exposes; shown under the label, never as a tooltip. */
  description: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
};

/**
 * One opt-in for the publish dialog.
 *
 * <p>The description is wired through `aria-describedby` rather than left as
 * decoration, because the warning about what a setting reveals is the part a
 * screen-reader user most needs before turning it on.
 */
export function ShareOptionRow({
  label,
  description,
  checked,
  disabled,
  onCheckedChange,
}: ShareOptionRowProps) {
  const id = useId();
  const descriptionId = `${id}-description`;

  return (
    <div className="flex items-start gap-3">
      <Checkbox
        id={id}
        checked={checked}
        disabled={disabled}
        aria-describedby={descriptionId}
        onCheckedChange={onCheckedChange}
        className="mt-0.5"
      />
      <div className="min-w-0 space-y-0.5">
        <Label htmlFor={id} className="cursor-pointer font-medium text-foreground">
          {label}
        </Label>
        <p id={descriptionId} className="text-sm text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}
