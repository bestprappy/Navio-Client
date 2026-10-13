"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { CircleAlert, LoaderCircle, RotateCcw } from "lucide-react";

import { useStartAuthentication, type AuthMode } from "./use-start-authentication";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button.variants";
import { cn } from "@/lib/utils";

type AuthRedirectProps = {
  callbackUrl: string;
  /** Set when Auth.js returned here with an error; the redirect then waits for the visitor. */
  errorMessage?: string | null;
  mode: AuthMode;
};

const COPY: Record<AuthMode, { failed: string; pending: string; retry: string }> = {
  "sign-in": {
    failed: "Navio could not open the log-in page. Check your connection and try again.",
    pending: "Opening log in…",
    retry: "Try logging in again",
  },
  "sign-up": {
    failed: "Navio could not open the sign-up page. Check your connection and try again.",
    pending: "Opening sign up…",
    retry: "Try signing up again",
  },
};

/**
 * /sign-in and /sign-up have no form of their own: the form lives on the
 * Keycloak `navio` theme. This screen is only visible for the moment it takes
 * to hand over, or when that hand-over fails.
 */
export function AuthRedirect({ callbackUrl, errorMessage, mode }: AuthRedirectProps) {
  const { failed, pending, start } = useStartAuthentication(callbackUrl, mode);
  const started = useRef(false);
  const copy = COPY[mode];
  const message = pending ? null : (errorMessage ?? (failed ? copy.failed : null));

  useEffect(() => {
    // An error from Auth.js must not trigger another automatic redirect, or a
    // misconfigured provider would loop forever.
    if (errorMessage || started.current) {
      return;
    }
    started.current = true;
    void start();
  }, [errorMessage, start]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background p-6 text-center">
      <Logo className="size-10" />

      {message ? (
        <div className="flex max-w-sm flex-col items-center gap-6">
          <div role="alert" className="flex flex-col items-center gap-3">
            <CircleAlert className="size-6 text-destructive" aria-hidden="true" />
            <p className="text-sm leading-6 text-foreground">{message}</p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row">
            {/* h-11 matches the link below: Button's own "lg" size is shorter than buttonVariants' "lg". */}
            <Button type="button" size="lg" onClick={() => void start()} className="h-11 sm:flex-1">
              <RotateCcw className="size-4" aria-hidden="true" />
              {copy.retry}
            </Button>
            <Link
              href="/"
              className={cn(buttonVariants({ size: "lg", variant: "outline" }), "sm:flex-1")}
            >
              Back to Navio
            </Link>
          </div>
        </div>
      ) : (
        <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
          <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
          {copy.pending}
        </p>
      )}
    </main>
  );
}
