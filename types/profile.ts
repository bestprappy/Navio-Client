import type { z } from "zod";

import type {
  preferencesFormSchema,
  profileFormSchema,
  userPreferencesSchema,
  userProfileSchema,
} from "@/lib/validations/profile";

/** The caller's own profile as returned by `GET /v1/users/me`. */
export type UserProfile = z.infer<typeof userProfileSchema>;

export type UserPreferences = z.infer<typeof userPreferencesSchema>;

/** Editable profile fields, matching `PATCH /v1/users/me`. */
export type ProfileFormValues = z.infer<typeof profileFormSchema>;

/** Editable preference fields, matching `PATCH /v1/users/me/preferences`. */
export type PreferencesFormValues = z.infer<typeof preferencesFormSchema>;

export type ProfileSaveStatus = "idle" | "dirty" | "saving" | "saved" | "error";
