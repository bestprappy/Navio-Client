import "server-only";

import { redirect } from "next/navigation";

import { signIn } from "@/auth";
import { getSafeCallbackUrl } from "@/lib/auth-navigation";

type GoogleAuthRoute = "/sign-in" | "/sign-up";

type RedirectSignal = {
  digest: string;
};

function isRedirectSignal(error: unknown): error is RedirectSignal {
  if (!error || typeof error !== "object" || !("digest" in error)) {
    return false;
  }

  const digest = (error as { digest?: unknown }).digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}

export async function startGoogleAuthentication(
  callbackUrl: string,
  errorRoute: GoogleAuthRoute,
) {
  const safeCallbackUrl = getSafeCallbackUrl(callbackUrl, "/planner");

  try {
    await signIn(
      "keycloak",
      { redirectTo: safeCallbackUrl },
      { kc_idp_hint: "google" },
    );
  } catch (error) {
    if (isRedirectSignal(error)) {
      throw error;
    }

    console.error("GoogleAuthAction failed to start OAuth authentication.", {
      error:
        error instanceof Error
          ? error.message
          : "Unknown authentication error",
      route: errorRoute,
    });
  }

  redirect(
    `${errorRoute}?error=AuthenticationFailed&callbackUrl=${encodeURIComponent(safeCallbackUrl)}`,
  );
}
