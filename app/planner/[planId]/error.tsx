"use client";

import { useEffect } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button.variants";
import { cn } from "@/lib/utils";

type PlannerDetailErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function PlannerDetailError({
  error,
  reset,
}: PlannerDetailErrorProps) {
  useEffect(() => {
    console.error("PlannerDetailPage failed to render", {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <main className="min-h-screen px-6 py-16 sm:px-10">
      <section className="mx-auto flex max-w-3xl flex-col items-center gap-5 rounded-md border border-border bg-card px-6 py-12 text-center shadow-sm">
        <h1 className="text-3xl font-extrabold text-foreground">
          We could not open this plan
        </h1>
        <p className="max-w-xl text-sm text-muted-foreground">
          The planner placeholder hit an unexpected error. Try again or return
          to the setup screen.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            size="lg"
            onClick={reset}
          >
            Try again
          </Button>
          <Link
            href="/planner"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
          >
            Back to planner
          </Link>
        </div>
      </section>
    </main>
  );
}
