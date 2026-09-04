"use client";

import { useState, type ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

type AuthSubmitButtonProps = {
  callbackUrl: string;
  errorRoute: "/sign-in" | "/sign-up";
  icon: ReactNode;
  label: string;
  method: "email" | "google";
  tone: "primary" | "secondary";
};

export function AuthSubmitButton({
  callbackUrl,
  errorRoute,
  icon,
  label,
  method,
  tone,
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
      setPending(false);
      router.replace(
        `${errorRoute}?error=AuthenticationFailed&callbackUrl=${encodeURIComponent(callbackUrl)}`,
      );
    }
  }

  return (
    <Button
      type="button"
      size="lg"
      variant={tone === "primary" ? "default" : "outline"}
      onClick={startAuthentication}
      disabled={pending}
      className="h-12 w-full gap-3 rounded-xl px-6 text-sm font-semibold disabled:cursor-wait"
    >
      {pending ? (
        <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
      ) : (
        icon
      )}
      {pending ? "Connecting securely…" : label}
    </Button>
  );
}
