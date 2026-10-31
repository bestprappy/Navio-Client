"use client";

import { useId, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Eye, LoaderCircle } from "lucide-react";

import { InterestToggle } from "@/components/social/interest-stamp";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useUnsavedChangesGuard } from "@/hooks/use-unsaved-changes-guard";
import { publicProfilePatch, savePublicProfile, toPublicProfileForm } from "@/lib/profile-api";
import { TRAVEL_INTERESTS, TRAVEL_PACES } from "@/lib/travel-interests";
import { BIO_MAX_LENGTH, MAX_TRAVEL_INTERESTS, publicProfileFormSchema } from "@/lib/validations/profile";
import type { PublicProfileFormInput, PublicProfileFormValues, UserProfile } from "@/types/profile";
import { SettingsGroup, VisibilityBadge } from "../settings-section";
import { ProfilePreviewDialog } from "./profile-preview-dialog";
import { UsernameField } from "./username-field";

type PublicProfileFormProps = {
  profile: UserProfile;
  onSaved: (profile: UserProfile) => Promise<void> | void;
};

/**
 * Name, handle, bio and travel preferences, saved together with an explicit
 * Save. Leaving with unsaved edits asks first. Media uploads are separate and
 * save immediately, so they never sit in an unsaved state.
 */
export function PublicProfileForm({ profile, onSaved }: PublicProfileFormProps) {
  const ids = { name: useId(), username: useId(), bio: useId() };
  const defaults = useMemo(() => toPublicProfileForm(profile), [profile]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");

  const form = useForm<PublicProfileFormInput, unknown, PublicProfileFormValues>({
    resolver: zodResolver(publicProfileFormSchema),
    defaultValues: defaults,
    values: defaults,
    resetOptions: { keepDirtyValues: false },
    mode: "onTouched",
  });
  const draft = useWatch({ control: form.control });
  const dirty = form.formState.isDirty;
  useUnsavedChangesGuard(dirty);

  const save = useMutation({
    mutationFn: (values: PublicProfileFormValues) => {
      const patch = publicProfilePatch(values, profile);
      return Object.keys(patch).length ? savePublicProfile(patch) : Promise.resolve(profile);
    },
    onSuccess: async (updated) => {
      await onSaved(updated);
      form.reset(toPublicProfileForm(updated));
      setSavedMessage("Profile saved.");
    },
    onError: (error) => {
      setSavedMessage("");
      console.error("Profile save failed.", { component: "PublicProfileForm", error });
    },
  });

  const interests = draft.travelInterests ?? [];
  const bioLength = (draft.bio ?? "").length;

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit((values) => save.mutate(values))}
      onChange={() => setSavedMessage("")}
      className="flex flex-col"
    >
      <SettingsGroup title="Name and username" aside={<VisibilityBadge visibility="public" />}
        description="Shown on your profile, posts, comments and plans you share under your name.">
        <div className="flex flex-col gap-5">
          <Controller
            control={form.control}
            name="displayName"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor={ids.name}>Display name</FieldLabel>
                <Input {...field} id={ids.name} maxLength={120} autoComplete="name" className="h-11"
                  aria-invalid={fieldState.invalid || undefined} aria-describedby={`${ids.name}-error`} />
                <FieldError id={`${ids.name}-error`} errors={[fieldState.error]} />
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="username"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor={ids.username}>Username</FieldLabel>
                <UsernameField
                  id={ids.username}
                  value={field.value}
                  savedUsername={profile.username}
                  changeAvailableAt={profile.usernameChangeAvailableAt}
                  invalid={fieldState.invalid}
                  describedBy={`${ids.username}-hint ${ids.username}-error`}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
                <FieldDescription id={`${ids.username}-hint`}>
                  Your profile link is navio/u/{(draft.username || "username").replace(/^@/, "").toLowerCase()}. Usernames are unique,
                  can be changed once every 30 days, and your old one keeps pointing to you for 90 days.
                </FieldDescription>
                <FieldError id={`${ids.username}-error`} errors={[fieldState.error]} />
              </Field>
            )}
          />
        </div>
      </SettingsGroup>

      <SettingsGroup title="Bio" aside={<VisibilityBadge visibility="public" />}
        description="A line or two about how you like to travel.">
        <Controller
          control={form.control}
          name="bio"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <Label htmlFor={ids.bio} className="sr-only">Bio</Label>
              <Textarea {...field} id={ids.bio} rows={4} maxLength={BIO_MAX_LENGTH}
                aria-invalid={fieldState.invalid || undefined} aria-describedby={`${ids.bio}-count ${ids.bio}-error`} />
              <div className="flex justify-between gap-3">
                <FieldError id={`${ids.bio}-error`} errors={[fieldState.error]} />
                <span id={`${ids.bio}-count`} className="ml-auto text-xs tabular-nums text-muted-foreground">
                  {bioLength}/{BIO_MAX_LENGTH}
                </span>
              </div>
            </Field>
          )}
        />
      </SettingsGroup>

      <SettingsGroup
        title="Travel interests"
        aside={<VisibilityBadge visibility={profile.showTravelPreferences ? "public" : "private"} />}
        description={profile.showTravelPreferences
          ? `Optional. Pick up to ${MAX_TRAVEL_INTERESTS}. You can hide these in Privacy.`
          : "Optional. Hidden from your profile; turn them on in Privacy."}
      >
        <Controller
          control={form.control}
          name="travelInterests"
          render={({ field }) => (
            <fieldset className="flex flex-col gap-3">
              <legend className="sr-only">Travel interests</legend>
              <div className="flex flex-wrap gap-2">
                {TRAVEL_INTERESTS.map((interest) => {
                  const selected = field.value.includes(interest.id);
                  return (
                    <InterestToggle
                      key={interest.id}
                      interest={interest}
                      selected={selected}
                      disabled={field.value.length >= MAX_TRAVEL_INTERESTS}
                      onToggle={() => field.onChange(selected
                        ? field.value.filter((id) => id !== interest.id)
                        : [...field.value, interest.id])}
                    />
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground" aria-live="polite">
                {interests.length} of {MAX_TRAVEL_INTERESTS} chosen
              </p>
            </fieldset>
          )}
        />
      </SettingsGroup>

      <SettingsGroup title="Travel pace" aside={<VisibilityBadge visibility={profile.showTravelPreferences ? "public" : "private"} />}
        description="Optional. Helps travellers who share plans understand your style.">
        <Controller
          control={form.control}
          name="travelPace"
          render={({ field }) => (
            <RadioGroup value={field.value} onValueChange={(value) => field.onChange(value)} aria-label="Travel pace" className="gap-1">
              {[{ id: "", label: "Not set", description: "Leave it off your profile." }, ...TRAVEL_PACES].map((pace) => (
                <Label key={pace.id || "none"} className="flex min-h-11 cursor-pointer items-start gap-3 rounded-md px-2 py-2 font-normal hover:bg-muted/60">
                  <RadioGroupItem value={pace.id} className="mt-0.5" />
                  <span className="flex flex-col">
                    <span className="font-medium text-foreground">{pace.label}</span>
                    <span className="text-xs text-muted-foreground">{pace.description}</span>
                  </span>
                </Label>
              ))}
            </RadioGroup>
          )}
        />
      </SettingsGroup>

      <div className="sticky bottom-0 z-10 -mx-4 mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-border bg-background/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-[var(--card-radius-md)] sm:border sm:px-4">
        <Button type="button" variant="ghost" className="h-10 px-3" onClick={() => setPreviewOpen(true)}>
          <Eye aria-hidden="true" />
          Preview public profile
        </Button>
        <div className="flex flex-wrap items-center gap-3">
          <span role="status" aria-live="polite" className="text-sm text-muted-foreground">
            {save.isError ? <span className="text-destructive">{save.error.message}</span> : dirty ? "Unsaved changes" : savedMessage}
          </span>
          {dirty ? (
            <Button type="button" variant="outline" className="h-10 px-4" disabled={save.isPending} onClick={() => { form.reset(defaults); save.reset(); }}>
              Discard
            </Button>
          ) : null}
          <Button type="submit" className="h-10 px-5" disabled={!dirty || save.isPending}>
            {save.isPending ? <LoaderCircle aria-hidden="true" className="animate-spin motion-reduce:animate-none" /> : null}
            {save.isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>

      <ProfilePreviewDialog open={previewOpen} onOpenChange={setPreviewOpen} profile={profile} draft={draft} />
    </form>
  );
}
