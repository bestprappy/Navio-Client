import Link from "next/link";

import { buttonVariants } from "@/components/ui/button.variants";
import { cn } from "@/lib/utils";

type PlannerSetupActionsProps = {
  primaryLabel: string;
  secondaryLabel: string;
  secondaryHref: string;
};

export function PlannerSetupActions({
  primaryLabel,
  secondaryLabel,
  secondaryHref,
}: PlannerSetupActionsProps) {
  return (
    <div className="flex flex-col items-center gap-4 pt-2">
      <button
        type="button"
        className={cn(
          buttonVariants({ size: "lg" }),
          "rounded-full px-8 shadow-md shadow-primary/25",
        )}
      >
        {primaryLabel}
      </button>
      <Link
        href={secondaryHref}
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        {secondaryLabel}
      </Link>
    </div>
  );
}
