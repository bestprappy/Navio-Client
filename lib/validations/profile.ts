import { z } from "zod";

/**
 * Client-side mirrors of the server contract in `UpdateProfileRequest`,
 * `UserPreferences`, and `UserProfileResponse`.
 *
 * The form schemas repeat the backend's own constraints so an invalid value is
 * caught before it costs a round trip, and the response schema validates what
 * comes back so a changed payload surfaces as an error state instead of an
 * undefined read somewhere in the tree.
 */

/** Matches the server's `^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,8})?$`. */
const LANGUAGE_TAG_PATTERN = /^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,8})?$/;
const COUNTRY_CODE_PATTERN = /^[A-Za-z]{2}$/;

const LANGUAGE_TAG_MESSAGE = "Choose a language such as English or Thai.";

export const profileFormSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "Please enter a display name.")
    .max(120, "Display name must be 120 characters or fewer."),
  locale: z.string().trim().max(20).regex(LANGUAGE_TAG_PATTERN, LANGUAGE_TAG_MESSAGE),
  countryCode: z
    .string()
    .trim()
    .regex(COUNTRY_CODE_PATTERN, "Please choose your country."),
});

export const preferencesFormSchema = z.object({
  distanceUnit: z.enum(["km", "mi"], { message: "Choose kilometres or miles." }),
  notificationEmail: z.boolean(),
  notificationPush: z.boolean(),
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
});
