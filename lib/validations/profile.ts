import { z } from "zod";

/**
 * Client-side mirrors of the server contract in `UpdateProfileRequest` and
 * `UserProfileResponse`. Only the display name is edited here; the other
 * stored profile and preference fields are read leniently and never written.
 *
 * The form schemas repeat the backend's own constraints so an invalid value is
 * caught before it costs a round trip, and the response schema validates what
 * comes back so a changed payload surfaces as an error state instead of an
 * undefined read somewhere in the tree.
 */

export const profileFormSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "Enter the name other travellers will see.")
    .max(120, "Keep your display name to 120 characters or fewer."),
});

/**
 * Preferences as stored. `language` is read and written back untouched: the
 * profile-level `locale` is the field this UI edits, and echoing the stored
 * language avoids resetting a value the user never saw.
 */
export const userPreferencesSchema = z.object({
  language: z.string().nullish().transform((value) => value ?? null),
  distanceUnit: z
    .string()
    .nullish()
    .transform((value) => (value === "mi" ? "mi" : "km")),
  notificationEmail: z.boolean().nullish().transform((value) => value ?? true),
  notificationPush: z.boolean().nullish().transform((value) => value ?? false),
});

/**
 * `GET /v1/users/me`. Only the fields this UI depends on are required; the
 * optional ones are normalised to null so no consumer has to re-check them.
 */
export const userProfileSchema = z.object({
  id: z.string().min(1),
  displayName: z.string(),
  email: z.string(),
  avatarMediaId: z.string().nullish().transform((value) => value ?? null),
  status: z.string().nullish().transform((value) => value ?? "active"),
  locale: z.string().nullish().transform((value) => value ?? null),
  countryCode: z.string().nullish().transform((value) => value ?? null),
  roles: z
    .array(z.string())
    .nullish()
    .transform((value) => value ?? []),
  preferences: userPreferencesSchema
    .nullish()
    .transform((value) => value ?? userPreferencesSchema.parse({})),
  createdAt: z.string().nullish().transform((value) => value ?? null),
  updatedAt: z.string().nullish().transform((value) => value ?? null),
  username: z.string().nullish().transform((value) => value ?? null),
  usernameChangeAvailableAt: z.string().nullish().transform((value) => value ?? null),
  accountId: z.string().nullish().transform((value) => value ?? null),
  bio: z.string().nullish().transform((value) => value ?? ""),
  bannerMediaId: z.string().nullish().transform((value) => value ?? null),
  travelInterests: z.array(z.string()).nullish().transform((value) => value ?? []),
  travelPace: z.string().nullish().transform((value) => value ?? null),
  showTravelPreferences: z.boolean().nullish().transform((value) => value ?? true),
});

export const USERNAME_PATTERN = /^[a-z][a-z0-9_]{2,29}$/;
export const BIO_MAX_LENGTH = 280;
export const MAX_TRAVEL_INTERESTS = 8;

/** The public-profile form on Settings > Profile. Mirrors `UpdateProfileRequest`. */
export const publicProfileFormSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "Enter the name other travellers will see.")
    .max(120, "Keep your display name to 120 characters or fewer."),
  username: z
    .string()
    .trim()
    .transform((value) => value.replace(/^@/, "").toLowerCase())
    .pipe(
      z
        .string()
        .min(3, "Usernames are 3 to 30 characters.")
        .max(30, "Usernames are 3 to 30 characters.")
        .regex(USERNAME_PATTERN, "Use lowercase letters, numbers and underscores, starting with a letter."),
    ),
  bio: z.string().max(BIO_MAX_LENGTH, `Keep your bio to ${BIO_MAX_LENGTH} characters.`),
  travelInterests: z.array(z.string()).max(MAX_TRAVEL_INTERESTS, `Choose up to ${MAX_TRAVEL_INTERESTS} interests.`),
  travelPace: z.enum(["", "relaxed", "balanced", "packed"]),
});
