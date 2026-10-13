"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => undefined;

/**
 * False during server rendering and hydration, true after. Gate anything read
 * from browser storage behind it so the first client render matches the server.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
