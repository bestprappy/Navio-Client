"use client";

import { useEffect } from "react";

import { leavesPage, UNSAVED_CHANGES_MESSAGE } from "@/lib/unsaved-changes";

/**
 * Warns before unsaved changes are lost: the browser's own prompt on reload,
 * close and external navigation, and a confirmation before an in-app link
 * leaves the page. The link check runs in the capture phase, ahead of the
 * Next.js Link handler, so cancelling it keeps the user on the page.
 *
 * The browser Back button is not intercepted; App Router offers no supported
 * way to block it.
 */
export function useUnsavedChangesGuard(dirty: boolean, message = UNSAVED_CHANGES_MESSAGE) {
  useEffect(() => {
    if (!dirty) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Required by older browsers to show the prompt; the text itself is ignored.
      event.returnValue = "";
    };

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      const target = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(target instanceof HTMLAnchorElement)) return;
      const leaving = leavesPage(
        { href: target.href, target: target.getAttribute("target"), download: target.hasAttribute("download") },
        { href: window.location.href },
      );
      if (leaving && !window.confirm(message)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty, message]);
}
