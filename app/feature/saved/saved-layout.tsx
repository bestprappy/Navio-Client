"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { Navbar } from "@/components/navbar";

/** Saved-page navigation follows the document without covering the global navbar. */
export function SavedLayout({ header, navigation, children }: {
  header: ReactNode;
  navigation: ReactNode;
  children: ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);
  const navbar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = navbar.current;
    if (!element) return;
    const measure = () => root.current?.style.setProperty(
      "--saved-navbar-height", `${element.getBoundingClientRect().height}px`,
    );
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={root} style={{ "--saved-navbar-height": "4.0625rem" } as CSSProperties}>
      <div ref={navbar} className="sticky top-0 z-50"><Navbar /></div>
      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
        {header}
        <div className="grid items-start gap-6 md:grid-cols-[11rem_minmax(0,1fr)] lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-8">
          <aside className="sticky top-[calc(var(--saved-navbar-height)+1rem)] z-20 max-h-[calc(100dvh-var(--saved-navbar-height)-2rem)] self-start overflow-y-auto rounded-2xl border border-border/60 bg-card p-2">
            {navigation}
          </aside>
          <div className="min-w-0">{children}</div>
        </div>
      </main>
    </div>
  );
}
