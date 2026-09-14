"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { authPromptStore, guestWelcomeShownAtom, signInPromptAtom } from "@/components/sign-in-prompt";

type PlannerLayoutProps = {
  children: ReactNode;
};

export default function PlannerLayout({ children }: PlannerLayoutProps) {
  const { isAuthenticated, isAuthenticationLoading } = useRequireAuth();
  const pathname = usePathname();
  useEffect(() => {
    if (isAuthenticationLoading || isAuthenticated || authPromptStore.get(guestWelcomeShownAtom)) return;
    authPromptStore.set(guestWelcomeShownAtom, true);
    authPromptStore.set(signInPromptAtom, `${pathname}${window.location.search}`);
  }, [isAuthenticated, isAuthenticationLoading, pathname]);
  return children;
}
