import type { z } from "zod";

import type {
  profileFormSchema,
  publicProfileFormSchema,
  userPreferencesSchema,
  userProfileSchema,
} from "@/lib/validations/profile";

/** The caller's own profile as returned by `GET /v1/users/me`. */
export type UserProfile = z.infer<typeof userProfileSchema>;

export type UserPreferences = z.infer<typeof userPreferencesSchema>;

/** Editable profile fields, matching `PATCH /v1/users/me`. */
export type ProfileFormValues = z.infer<typeof profileFormSchema>;

/** Settings > Profile form values; `username` is normalized by the schema. */
export type PublicProfileFormInput = z.input<typeof publicProfileFormSchema>;
export type PublicProfileFormValues = z.output<typeof publicProfileFormSchema>;

export type ProfileSaveStatus = "idle" | "dirty" | "saving" | "saved" | "error";
