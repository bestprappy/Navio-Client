/** Local preview is enabled; production rollout requires an explicit build-time flag. */
export const placesEnabled = process.env.NEXT_PUBLIC_PLACES_ENABLED === "true"
  || (process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_PLACES_ENABLED !== "false");
