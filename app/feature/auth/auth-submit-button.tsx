"use client";

import { useState, type ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

type AuthSubmitButtonProps = {
  callbackUrl: string;
  errorRoute: "/sign-in" | "/sign-up";
  icon: ReactNode;
  label: string;
  method: "email" | "google";
};

export function AuthSubmitButton({
  callbackUrl,
  errorRoute,
  icon,
  label,
  method,
}: AuthSubmitButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function startAuthentication() {
    setPending(true);

    try {
      const authorizationParams =
        method === "google"
          ? { kc_idp_hint: "google" }
          : errorRoute === "/sign-up"
            ? { prompt: "create" }
            : undefined;

      await signIn(
        "keycloak",
        { redirectTo: callbackUrl },
        authorizationParams,
      );
    } catch (error) {
      console.error("AuthSubmitButton failed to start authentication.", {
        error:
          error instanceof Error
            ? error.message
            : "Unknown authentication error",
        method,
        route: errorRoute,
      });
      router.replace(
        `${errorRoute}?error=AuthenticationFailed&callbackUrl=${encodeURIComponent(callbackUrl)}`,
      );
    }
  }

  return (
    <button
      type="button"
      onClick={startAuthentication}
      disabled={pending}
      aria-disabled={pending}
      className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-border bg-card px-6 text-sm font-bold text-card-foreground shadow-sm transition hover:-translate-y-0.5 hover:bg-muted hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 disabled:cursor-wait disabled:opacity-70 disabled:hover:translate-y-0"
    >
      {pending ? (
        <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
      ) : (
        icon
      )}
      {pending ? "Connecting securely…" : label}
    </button>
  );
}
