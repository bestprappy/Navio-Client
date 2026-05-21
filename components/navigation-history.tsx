"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export const LAST_NON_COMMUNITY_PATH_KEY = "navio:lastNonCommunityPath";

export function NavigationHistoryTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/community")) {
      return;
    }

    const query = searchParams?.toString();
    const fullPath = query ? `${pathname}?${query}` : pathname;
    window.sessionStorage.setItem(LAST_NON_COMMUNITY_PATH_KEY, fullPath);
  }, [pathname, searchParams]);

  return null;
}
