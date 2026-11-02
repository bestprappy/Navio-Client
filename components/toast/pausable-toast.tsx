"use client";

import { useEffect, useRef, useState, type FocusEvent, type ReactNode } from "react";

type PausableToastProps = {
  /** Milliseconds on screen while nothing is holding the toast open. */
  lifetime: number;
  onExpire: () => void;
  children: ReactNode;
};

/**
 * Dismisses its toast after `lifetime`, paused while the pointer is over it, focus
 * is inside it, or the tab is hidden, so nobody loses a toast they are reading or
 * reaching with the keyboard. Resuming restarts the full lifetime. Sonner pauses on
 * hover only, so toasts are shown with an infinite Sonner duration and timed here.
 */
export function PausableToast({ lifetime, onExpire, children }: PausableToastProps) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(false);
  const expire = useRef(onExpire);

  useEffect(() => {
    expire.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    const sync = () => setHidden(document.hidden);
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  useEffect(() => {
    if (hovered || focused || hidden) return;
    const timer = setTimeout(() => expire.current(), lifetime);
    return () => clearTimeout(timer);
  }, [hovered, focused, hidden, lifetime]);

  return (
    <div
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event: FocusEvent<HTMLDivElement>) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
    >
      {children}
    </div>
  );
}
