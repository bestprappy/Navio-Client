/** Only public planning data/computation; never account data or saved trips. */
export function isPublicPlannerRequest(method: string, path: string): boolean {
  const pathname = path.split("?")[0];
  if (method === "POST") return pathname === "/v1/routes/directions";
  if (method !== "GET") return false;
  return pathname === "/v1/ev/chargers/near"
    || pathname === "/v1/trips/currencies/rate"
    || /^\/v1\/geo\/places\/[^/]+$/.test(pathname);
}
