"use client";

import type { ComponentProps, ReactNode } from "react";

import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type PageTabsBarProps = {
  "aria-label": string;
  children: ReactNode;
  className?: string;
};

/**
 * Underlined section tabs that sit on a full-width rule. The bar scrolls
 * sideways on narrow screens instead of wrapping, and the active underline
 * lands exactly on the rule. Use inside a `Tabs` root.
 */
function PageTabsBar({ children, className, ...props }: PageTabsBarProps) {
  return (
    <div className={cn("overflow-x-auto overscroll-x-contain border-b border-border [scrollbar-width:none]", className)}>
      <TabsList variant="line" aria-label={props["aria-label"]} className="h-11 gap-5 p-0">
        {children}
      </TabsList>
    </div>
  );
}

/** One tab in a `PageTabs.Bar`: content width, full bar height, underline on the rule. */
function PageTabsTrigger({ className, ...props }: ComponentProps<typeof TabsTrigger>) {
  return (
    <TabsTrigger
      className={cn(
        "h-full flex-none rounded-none border-0 px-1 group-data-horizontal/tabs:after:bottom-0 focus-visible:ring-inset",
        className,
      )}
      {...props}
    />
  );
}

export const PageTabs = { Bar: PageTabsBar, Trigger: PageTabsTrigger };
