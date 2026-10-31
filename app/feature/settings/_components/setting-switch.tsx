"use client";

import { useId } from "react";

import { Switch } from "@/components/ui/switch";

type SettingSwitchProps = {
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
};

/** One labelled on/off row. The whole label is clickable and the description is announced with it. */
export function SettingSwitch({ label, description, checked, disabled, onCheckedChange }: SettingSwitchProps) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <label htmlFor={id} className="flex min-w-0 cursor-pointer flex-col">
        <span className="text-sm font-medium text-foreground">{label}</span>
        {description ? <span id={`${id}-description`} className="text-xs leading-relaxed text-muted-foreground">{description}</span> : null}
      </label>
      <Switch
        id={id}
        checked={checked}
        disabled={disabled}
        aria-describedby={description ? `${id}-description` : undefined}
        onCheckedChange={(next) => onCheckedChange(next)}
        className="mt-0.5"
      />
    </div>
  );
}
