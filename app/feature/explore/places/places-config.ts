/**
 * Places discovery is off everywhere, including `next dev`: its uncached Google photo
 * lookups went past the free tier. Set NEXT_PUBLIC_PLACES_ENABLED=true (and
 * navio.discovery.enabled on the mobility service) to bring it back.
 */
export const placesEnabled = process.env.NEXT_PUBLIC_PLACES_ENABLED === "true";
