/**
 * The three global Navio roles, as Keycloak puts them in `realm_access.roles`.
 *
 * These decide what the UI *shows*. They never authorize anything: every admin
 * request is re-checked by the API gateway and user-management-service, which
 * validate the token themselves. A user who edits their session only unlocks
 * screens whose requests will then be refused.
 */
export const NAVIO_ROLES = ["USER", "MODERATOR", "ADMIN"] as const;
export type NavioRole = (typeof NAVIO_ROLES)[number];

function isNavioRole(value: string): value is NavioRole {
  return (NAVIO_ROLES as readonly string[]).includes(value);
}

/**
 * Reads Navio roles from decoded access-token claims.
 *
 * Allowlisted, like the backend's `NavioRole.fromClaim`, so Keycloak's own
 * roles (`offline_access`, `default-roles-*`) never become a Navio role.
 */
export function readNavioRoles(claims: unknown): NavioRole[] {
  if (!claims || typeof claims !== "object") return [];
  const realmAccess = (claims as { realm_access?: unknown }).realm_access;
  if (!realmAccess || typeof realmAccess !== "object") return [];
  const roles = (realmAccess as { roles?: unknown }).roles;
  if (!Array.isArray(roles)) return [];

  const found = new Set<NavioRole>();
  for (const role of roles) {
    if (typeof role !== "string") continue;
    const normalized = role.trim().toUpperCase();
    if (isNavioRole(normalized)) found.add(normalized);
  }
  return NAVIO_ROLES.filter((role) => found.has(role));
}

/** Moderators and admins both reach the admin console; admins see more of it. */
export function canUseAdminConsole(roles: readonly NavioRole[] | undefined): boolean {
  return Boolean(roles?.includes("MODERATOR") || roles?.includes("ADMIN"));
}

export function isAdministrator(roles: readonly NavioRole[] | undefined): boolean {
  return Boolean(roles?.includes("ADMIN"));
}
