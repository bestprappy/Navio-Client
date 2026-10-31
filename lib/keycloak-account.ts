import "server-only";

/**
 * Keycloak's account console for the realm, where credentials and the sign-in
 * email are managed. Built on the server because the issuer is not a public
 * environment variable. `section` opens a specific console page.
 */
export function keycloakAccountUrl(section: "" | "personal-info" | "account-security/signing-in" = ""): string | null {
  const issuer = process.env.AUTH_KEYCLOAK_ISSUER?.replace(/\/$/, "");
  if (!issuer) return null;
  try {
    const url = new URL(`${issuer}/account/${section ? `#/${section}` : ""}`);
    const clientId = process.env.AUTH_KEYCLOAK_ID;
    if (clientId) url.searchParams.set("referrer", clientId);
    return url.toString();
  } catch {
    return null;
  }
}
