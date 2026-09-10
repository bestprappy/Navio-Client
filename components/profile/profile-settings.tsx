"use client";

import { useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, LockKeyhole } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useProfileAutosave } from "@/hooks/use-profile-autosave";
import {
  currentUserProfileQueryKey,
  getMyProfile,
  toPreferencesFormValues,
  toProfileFormValues,
  updateMyPreferences,
  updateMyProfile,
} from "@/lib/profile-api";
import { preferencesFormSchema, profileFormSchema } from "@/lib/validations/profile";
import type {
  PreferencesFormValues,
  ProfileFormValues,
  UserProfile,
} from "@/types/profile";
import { DangerZone } from "./danger-zone";
import { PersonalInfoForm } from "./personal-info-form";
import { PreferencesForm } from "./preferences-form";
import { ProfilePhoto } from "./profile-photo";
import { ProfileSkeleton } from "./profile-skeleton";
import { SaveStatus } from "./save-status";
import { SettingsSidebar } from "./settings-sidebar";

type ProfileEditorProps = {
  profile: UserProfile;
  sessionImage: string | null;
  onProfileSaved: (profile: UserProfile) => void;
};

function ProfileEditor({ profile, sessionImage, onProfileSaved }: ProfileEditorProps) {
  const profileBaseline = useMemo(() => toProfileFormValues(profile), [profile]);
  const preferencesBaseline = useMemo(() => toPreferencesFormValues(profile), [profile]);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: profileBaseline,
    mode: "onChange",
  });
  const preferencesForm = useForm<PreferencesFormValues>({
    resolver: zodResolver(preferencesFormSchema),
    defaultValues: preferencesBaseline,
    mode: "onChange",
  });

  const saveProfile = useCallback(
    async (values: ProfileFormValues, baseline: ProfileFormValues) => {
      onProfileSaved(await updateMyProfile(values, baseline));
    },
    [onProfileSaved],
  );
  const savePreferences = useCallback(
    async (values: PreferencesFormValues, baseline: PreferencesFormValues) => {
      onProfileSaved(await updateMyPreferences(values, baseline));
    },
    [onProfileSaved],
  );

  // Both sections write to the same user record, so they share a mutation scope
  // and never have two PATCHes in flight against it at once.
  const profileAutosave = useProfileAutosave({
    form: profileForm,
    baseline: profileBaseline,
    save: saveProfile,
    scopeId: `profile-save-${profile.id}`,
  });
  const preferencesAutosave = useProfileAutosave({
    form: preferencesForm,
    baseline: preferencesBaseline,
    save: savePreferences,
    scopeId: `profile-save-${profile.id}`,
  });

  return (
    <div className="min-w-0 rounded-[var(--card-radius-lg)] border border-border/80 bg-card p-5 sm:p-8">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Personal information
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Update your personal details and account information.
          </p>
        </div>
        <SaveStatus status={profileAutosave.status} onRetry={profileAutosave.retry} />
      </header>

      <Separator className="my-7" />

      <ProfilePhoto
        imageUrl={sessionImage}
        displayName={profile.displayName}
        status={profile.status}
      />

      <Separator className="my-7" />

      <FormProvider {...profileForm}>
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void profileForm.trigger();
          }}
          className="space-y-5"
        >
          <fieldset className="min-w-0 border-0 p-0">
            <legend className="sr-only">Personal information</legend>
            <PersonalInfoForm profile={profile} />
          </fieldset>
          <div className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
            <LockKeyhole aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
            <p>Valid changes save to your Navio account automatically.</p>
          </div>
          {profileAutosave.error ? (
            <p role="alert" className="text-sm text-destructive">
              {profileAutosave.error}
            </p>
          ) : null}
        </form>
      </FormProvider>

      <Separator className="my-7" />

      <FormProvider {...preferencesForm}>
        <form noValidate onSubmit={(event) => event.preventDefault()} className="space-y-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-1.5">
              <h2 className="text-base font-semibold tracking-tight text-foreground">
                Travel preferences
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                How Navio measures your routes and when it gets in touch.
              </p>
            </div>
            <SaveStatus
              status={preferencesAutosave.status}
              onRetry={preferencesAutosave.retry}
            />
          </div>
          <fieldset className="min-w-0 border-0 p-0">
            <legend className="sr-only">Travel preferences</legend>
            <PreferencesForm />
          </fieldset>
          {preferencesAutosave.error ? (
            <p role="alert" className="text-sm text-destructive">
              {preferencesAutosave.error}
            </p>
          ) : null}
        </form>
      </FormProvider>

      <Separator className="my-7" />
      <DangerZone />
    </div>
  );
}

export function ProfileSettings() {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const userId = session?.user?.id ?? null;
  const queryKey = currentUserProfileQueryKey(userId);

  const profile = useQuery({
    queryKey,
    queryFn: getMyProfile,
    enabled: status === "authenticated",
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  // A save returns the updated record, so the cache is filled from the response
  // instead of costing a second round trip. The navbar reads the same key.
  const handleProfileSaved = useCallback(
    (updated: UserProfile) => {
      queryClient.setQueryData(queryKey, updated);
    },
    [queryClient, queryKey],
  );

  if (status === "loading" || profile.isPending) {
    return <ProfileSkeleton />;
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-8 sm:py-8 lg:flex-row lg:gap-8">
      <SettingsSidebar />
      <div className="min-w-0 flex-1 space-y-4">
        {profile.data ? (
          <ProfileEditor
            key={profile.data.id}
            profile={profile.data}
            sessionImage={session?.user?.image ?? null}
            onProfileSaved={handleProfileSaved}
          />
        ) : (
          <div
            role="alert"
            className="rounded-[var(--card-radius-lg)] border border-border bg-card p-8"
          >
            <CircleAlert aria-hidden="true" className="mb-4 size-6 text-destructive" />
            <h1 className="text-xl font-semibold">We could not load your profile</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {profile.error instanceof Error
                ? profile.error.message
                : "Please try again, or sign in again to manage your account."}
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-5 h-11 px-5"
              disabled={profile.isFetching}
              onClick={() => void profile.refetch()}
            >
              {profile.isFetching ? "Retrying..." : "Try again"}
            </Button>
          </div>
        )}
        <p className="px-1 text-center text-xs text-muted-foreground">
          Made for your next adventure.
        </p>
      </div>
    </main>
  );
}
