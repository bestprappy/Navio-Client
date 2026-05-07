"use client";

import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { useAtomValue } from "jotai";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { destinationValidationErrorAtom } from "./planner-setup.atoms";

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
  const destinationError = useAtomValue(destinationValidationErrorAtom);

  return (
    <div className="flex flex-col items-center gap-4 pt-2">
      <Button
        type="submit"
        size="lg"
        aria-invalid={Boolean(destinationError)}
        className={cn(
          "rounded-full px-8 shadow-md shadow-primary/25",
          destinationError && "shadow-destructive/20",
        )}
      >
        {primaryLabel}
      </Button>
      {destinationError ? (
        <p className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="size-4" />
          {destinationError}
        </p>
      ) : null}
      <Link
        href={secondaryHref}
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        {secondaryLabel}
      </Link>
    </div>
  );
}
