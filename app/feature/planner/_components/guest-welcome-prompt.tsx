"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { authPromptStore, guestWelcomeShownAtom, signInPromptAtom } from "@/components/sign-in-prompt";

/** Shows the optional sign-in prompt once per session to guests entering planning routes. */
export function GuestWelcomePrompt() {
  const { isAuthenticated, isAuthenticationLoading } = useRequireAuth();
  const pathname = usePathname();
  useEffect(() => {
    if (isAuthenticationLoading || isAuthenticated || authPromptStore.get(guestWelcomeShownAtom)) return;
    authPromptStore.set(guestWelcomeShownAtom, true);
    authPromptStore.set(signInPromptAtom, `${pathname}${window.location.search}`);
  }, [isAuthenticated, isAuthenticationLoading, pathname]);
  return null;
}
