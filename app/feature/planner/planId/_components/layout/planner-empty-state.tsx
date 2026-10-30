import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "@/lib/utils";

type SlotProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Empty state for a planner section: a short invitation on the left and a
 * faint preview of what the section looks like once filled on the right.
 * Stacks vertically when the section is narrow.
 */
function Root({ children, className }: SlotProps) {
  return (
    <div
      className={cn(
        "@container/empty min-w-0 rounded-lg border border-border bg-card text-card-foreground shadow-xs",
        className,
      )}
    >
      <div className="flex flex-col gap-5 p-5 @lg/empty:flex-row @lg/empty:items-center @lg/empty:gap-8 @lg/empty:p-6">
        {children}
      </div>
    </div>
  );
}

function Body({ children, className }: SlotProps) {
  return (
    <div className={cn("flex min-w-0 flex-1 flex-col items-start gap-2", className)}>
      {children}
    </div>
  );
}

type TitleProps = SlotProps & { as?: "h2" | "h3" | "h4" | "p" };

function Title({ as: Tag = "h3", children, className }: TitleProps) {
  return (
    <Tag className={cn("text-base font-semibold leading-snug text-foreground", className)}>
      {children}
    </Tag>
  );
}

function Description({ children, className }: SlotProps) {
  return (
    <p className={cn("max-w-prose text-sm leading-6 text-muted-foreground", className)}>
      {children}
    </p>
  );
}

function Action({ children, className }: SlotProps) {
  return <div className={cn("pt-2", className)}>{children}</div>;
}

/** Decorative sketch of the filled section. Hidden from assistive technology. */
function Preview({ children, className, ...props }: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      {...props}
      aria-hidden="true"
      className={cn(
        "pointer-events-none w-full shrink-0 select-none rounded-md border border-dashed border-border bg-muted/40 p-3 @lg/empty:w-60",
        className,
      )}
    >
      {children}
    </div>
  );
}

export const PlannerEmptyState = { Root, Body, Title, Description, Action, Preview };
