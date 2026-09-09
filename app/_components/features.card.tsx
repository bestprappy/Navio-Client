import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type FeatureCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
};

export function FeatureCard({
  icon: Icon,
  title,
  description,
  className,
}: FeatureCardProps) {
  return (
    <article
      className={cn(
        "flex min-h-52 flex-col gap-4 rounded-lg bg-card p-6",
        "shadow-sm ring-1 ring-foreground/8",
        "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:ring-foreground/14",
        className,
      )}
    >
      <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/12">
        <Icon className="size-5 text-primary" aria-hidden="true" />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-base font-semibold leading-snug text-foreground">
          {title}
        </h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
    </article>
  );
}
