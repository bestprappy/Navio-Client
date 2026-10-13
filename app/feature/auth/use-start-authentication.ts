"use client";

import { useCallback, useState } from "react";
import { signIn } from "next-auth/react";

export type AuthMode = "sign-in" | "sign-up";

type StartAuthenticationState = {
  failed: boolean;
  pending: boolean;
  start: () => Promise<void>;
};

/**
 * Sends the visitor to the Keycloak-hosted form. Passwords are only ever typed
 * there (see .deploy/keycloak/README.md), so this never collects credentials.
 */
export function useStartAuthentication(
  callbackUrl: string,
  mode: AuthMode,
): StartAuthenticationState {
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  const start = useCallback(async () => {
    setPending(true);
    setFailed(false);

    try {
      await signIn(
        "keycloak",
        { redirectTo: callbackUrl },
        mode === "sign-up" ? { prompt: "create" } : undefined,
      );
    } catch (error) {
      console.error("useStartAuthentication failed to start authentication.", {
        error:
          error instanceof Error
            ? error.message
            : "Unknown authentication error",
        mode,
      });
      setPending(false);
      setFailed(true);
    }
  }, [callbackUrl, mode]);

  return { failed, pending, start };
}
