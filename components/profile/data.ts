/**
 * Reference data for the profile forms.
 *
 * The values here mirror what `PATCH /v1/users/me` accepts: `countryCode` is a
 * two-letter ISO code and `locale` is a short language tag. The lists are
 * curated rather than exhaustive, so {@link withCurrentOption} keeps a stored
 * value selectable even when the backend holds something outside the list.
 */

export type SelectOption = {
  value: string;
  label: string;
};

export const COUNTRY_OPTIONS: SelectOption[] = [
  { value: "TH", label: "Thailand" },
  { value: "SG", label: "Singapore" },
  { value: "MY", label: "Malaysia" },
  { value: "VN", label: "Vietnam" },
  { value: "ID", label: "Indonesia" },
  { value: "JP", label: "Japan" },
  { value: "KR", label: "South Korea" },
  { value: "TW", label: "Taiwan" },
  { value: "AU", label: "Australia" },
  { value: "NZ", label: "New Zealand" },
  { value: "GB", label: "United Kingdom" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "NL", label: "Netherlands" },
  { value: "NO", label: "Norway" },
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
];

export const LOCALE_OPTIONS: SelectOption[] = [
  { value: "en", label: "English" },
  { value: "th", label: "Thai" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "de", label: "German" },
  { value: "fr", label: "French" },
];

export const DISTANCE_UNIT_OPTIONS: SelectOption[] = [
  { value: "km", label: "Kilometres (km)" },
  { value: "mi", label: "Miles (mi)" },
];

export const DEFAULT_LOCALE = "en";
export const DEFAULT_COUNTRY_CODE = "TH";
export const DEFAULT_DISTANCE_UNIT = "km";

/**
 * Returns the option list with `current` appended when it is a real value the
 * list does not already cover. Without this a profile stored as, say, `PT`
 * would render an empty select and the first edit would silently rewrite it.
 */
export function withCurrentOption(
  options: SelectOption[],
  current: string | null | undefined,
): SelectOption[] {
  if (!current) return options;
  if (options.some((option) => option.value === current)) return options;
  return [...options, { value: current, label: current }];
}

/** Human-readable account states returned in `UserProfileResponse.status`. */
export const ACCOUNT_STATUS_LABELS: Record<string, string> = {
  active: "Active",
  suspended: "Suspended",
  banned: "Banned",
  deleted: "Closed",
};
