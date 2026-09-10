"use client";

import { useMemo } from "react";
import { Controller, useFormContext } from "react-hook-form";

import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { ProfileFormValues, UserProfile } from "@/types/profile";
import { COUNTRY_OPTIONS, LOCALE_OPTIONS, withCurrentOption } from "./data";
import { ProfileSelectField } from "./profile-select-field";
import { ReadOnlyField } from "./read-only-field";

type PersonalInfoFormProps = {
  profile: UserProfile;
};

/**
 * The three fields `PATCH /v1/users/me` accepts, plus the account details it
 * does not. Email and account status are shown because they are the first
 * things a user looks for on this page, and stating where they are managed is
 * clearer than leaving them out.
 */
export function PersonalInfoForm({ profile }: PersonalInfoFormProps) {
  const { control } = useFormContext<ProfileFormValues>();
  const countryOptions = useMemo(
    () => withCurrentOption(COUNTRY_OPTIONS, profile.countryCode?.toUpperCase()),
    [profile.countryCode],
  );
  const localeOptions = useMemo(
    () => withCurrentOption(LOCALE_OPTIONS, profile.locale),
    [profile.locale],
  );

  return (
    <div className="grid min-w-0 gap-x-6 gap-y-5 sm:grid-cols-2">
      <Controller
        control={control}
        name="displayName"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid} className="min-w-0 gap-2 sm:col-span-2">
            <FieldLabel htmlFor="profile-displayName">Display name</FieldLabel>
            <Input
              {...field}
              id="profile-displayName"
              autoComplete="name"
              placeholder="How you appear across Navio"
              maxLength={120}
              required
              aria-invalid={fieldState.invalid}
              aria-describedby={
                fieldState.error ? "profile-displayName-error" : "profile-displayName-description"
              }
              className="h-11 rounded-[var(--btn-radius)] border-border bg-background/30 text-foreground shadow-none"
            />
            <p
              id="profile-displayName-description"
              className="text-xs leading-relaxed text-muted-foreground"
            >
              Shown on your trips and anywhere you post in the community.
            </p>
            <FieldError id="profile-displayName-error" errors={[fieldState.error]} />
          </Field>
        )}
      />

      <ProfileSelectField<ProfileFormValues>
        name="countryCode"
        label="Country"
        placeholder="Select a country"
        options={countryOptions}
        description="Used to tailor destinations and charging suggestions."
      />

      <ProfileSelectField<ProfileFormValues>
        name="locale"
        label="Language"
        placeholder="Select a language"
        options={localeOptions}
        description="Your preferred language for Navio content."
      />

      <ReadOnlyField
        label="Email address"
        value={profile.email}
        hint="Managed by your sign-in provider. Change it there and it updates here."
      />

      <ReadOnlyField
        label="Member since"
        value={formatMemberSince(profile.createdAt)}
        hint="The day your Navio account was created."
      />
    </div>
  );
}

function formatMemberSince(createdAt: string | null): string {
  if (!createdAt) return "";
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return "";
  return created.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
