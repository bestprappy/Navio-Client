"use client";

import { Controller, useFormContext } from "react-hook-form";

import { Checkbox } from "@/components/ui/checkbox";
import type { PreferencesFormValues } from "@/types/profile";
import { DISTANCE_UNIT_OPTIONS } from "./data";
import { ProfileSelectField } from "./profile-select-field";

type PreferenceToggleProps = {
  name: "notificationEmail" | "notificationPush";
  label: string;
  description: string;
};

function PreferenceToggle({ name, label, description }: PreferenceToggleProps) {
  const { control } = useFormContext<PreferencesFormValues>();
  const fieldId = `preference-${name}`;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className="flex min-w-0 items-start gap-3 rounded-[var(--btn-radius)] border border-border/70 bg-background/30 p-4">
          <Checkbox
            id={fieldId}
            name={field.name}
            inputRef={field.ref}
            checked={field.value}
            onCheckedChange={(checked) => field.onChange(checked === true)}
            onBlur={field.onBlur}
            aria-describedby={`${fieldId}-description`}
            className="mt-0.5"
          />
          <div className="flex min-w-0 flex-col gap-1">
            <label htmlFor={fieldId} className="text-sm font-medium text-foreground">
              {label}
            </label>
            <p id={`${fieldId}-description`} className="text-xs leading-relaxed text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
      )}
    />
  );
}

/**
 * The preference fields `PATCH /v1/users/me/preferences` accepts. The stored
 * `language` preference is not shown: the profile-level Language field is the
 * one control this page offers, and a second language setting beside it would
 * be a choice with no visible difference.
 */
export function PreferencesForm() {
  return (
    <div className="grid min-w-0 gap-x-6 gap-y-5 sm:grid-cols-2">
      <ProfileSelectField<PreferencesFormValues>
        name="distanceUnit"
        label="Distance unit"
        placeholder="Select a unit"
        options={DISTANCE_UNIT_OPTIONS}
        description="Applied to routes, ranges, and charging stops."
      />
      <div className="hidden sm:block" aria-hidden="true" />
      <PreferenceToggle
        name="notificationEmail"
        label="Email updates"
        description="Trip confirmations and important account notices."
      />
      <PreferenceToggle
        name="notificationPush"
        label="Push notifications"
        description="Live route and charging alerts while you travel."
      />
    </div>
  );
}
