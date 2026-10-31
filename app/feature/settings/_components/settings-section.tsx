import type { ReactNode } from "react";
import { Globe2, Lock } from "lucide-react";

import { cn } from "@/lib/utils";

/** The page title and one-line purpose of a settings section. */
export function SettingsHeader({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
      <div className="min-w-0">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">{title}</h1>
        <p className="mt-1 max-w-prose text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </header>
  );
}

type SettingsGroupProps = {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Rendered beside the title, such as a visibility badge. */
  aside?: ReactNode;
};

/**
 * One group of related settings. Groups are separated by space and a hairline,
 * not boxed into cards, so the page reads as one document.
 */
export function SettingsGroup({ title, description, children, className, aside }: SettingsGroupProps) {
  return (
    <section className={cn("grid gap-4 py-7 first:pt-6 sm:grid-cols-[14rem_minmax(0,1fr)] sm:gap-8", className)}>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {aside}
        </div>
        {description ? <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p> : null}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

/** Says plainly whether a field appears on the public profile. Icon plus text, never colour alone. */
export function VisibilityBadge({ visibility }: { visibility: "public" | "private" }) {
  const isPublic = visibility === "public";
  const Icon = isPublic ? Globe2 : Lock;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        isPublic ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
      )}
    >
      <Icon aria-hidden="true" className="size-3" />
      {isPublic ? "Public" : "Only you"}
    </span>
  );
}
