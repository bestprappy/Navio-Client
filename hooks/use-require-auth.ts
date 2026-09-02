"use client";

import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback } from "react";

import { getSignInHref } from "@/lib/auth-navigation";

export function useRequireAuth() {
  const { status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const requireAuth = useCallback(
    (action: () => void) => {
      if (status === "authenticated") {
        action();
        return true;
      }

      if (status === "unauthenticated") {
        const callbackUrl = `${pathname}${window.location.search}`;
        router.push(getSignInHref(callbackUrl));
      }

      return false;
    },
    [pathname, router, status],
  );

  return {
    isAuthenticationLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    requireAuth,
  };
}
