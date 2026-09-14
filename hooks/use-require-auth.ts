"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback } from "react";

import { useSetAtom } from "jotai";
import { authPromptStore, signInPromptAtom } from "@/components/sign-in-prompt";

export function useRequireAuth() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const showPrompt = useSetAtom(signInPromptAtom, { store: authPromptStore });
  const isAuthenticated = status === "authenticated" && !!session?.user && !session.error;

  const requireAuth = useCallback(
    (action: () => void) => {
      if (isAuthenticated) {
        action();
        return true;
      }

      if (status !== "loading") {
        const callbackUrl = `${pathname}${window.location.search}`;
        showPrompt(callbackUrl);
      }

      return false;
    },
    [pathname, showPrompt, status, isAuthenticated],
  );

  return {
    isAuthenticationLoading: status === "loading",
    isAuthenticated,
    requireAuth,
  };
}
