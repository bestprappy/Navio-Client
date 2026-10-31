"use client";

import { signIn } from "next-auth/react";

/**
 * Keycloak application-initiated actions. Each one sends the traveller to
 * Keycloak, which asks them to sign in again when their session is older than
 * the realm allows, performs the change itself, then returns here. Navio never
 * sees or stores the password.
 */
export function startPasswordChange(returnTo = "/settings/security?updated=password") {
  return signIn("keycloak", { redirectTo: returnTo }, { kc_action: "UPDATE_PASSWORD" });
}

/** A fresh sign-in (always prompting), used before a sensitive action Navio performs itself. */
export function reauthenticate(returnTo: string) {
  return signIn("keycloak", { redirectTo: returnTo }, { prompt: "login", max_age: "0" });
}
