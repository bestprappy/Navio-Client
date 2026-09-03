"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CircleAlert, RotateCcw } from "lucide-react";

import { Logo } from "@/components/logo";
import { buttonVariants } from "@/components/ui/button.variants";
import { cn } from "@/lib/utils";

type AuthPageErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export function AuthPageError({ error, reset }: AuthPageErrorProps) {
  useEffect(() => {
    console.error("AuthPageError rendered authentication fallback.", {
      digest: error.digest,
      message: error.message,
    });
  }, [error]);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-background via-secondary/30 to-primary/10 p-4 sm:p-6">
      <section className="flex w-full max-w-md flex-col items-center rounded-3xl border border-border/70 bg-card p-6 text-center shadow-xl sm:p-8">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
          <Logo className="size-6" />
        </span>
        <CircleAlert
          className="mt-8 size-8 text-destructive"
          aria-hidden="true"
        />
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-foreground">
          Sign-in could not load
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          We could not start secure authentication. Please retry, or return to
          Navio and try again in a moment.
        </p>
        <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className={cn(buttonVariants({ size: "lg" }), "flex-1")}
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            Try again
          </button>
          <Link
            href="/"
            className={cn(
              buttonVariants({ size: "lg", variant: "outline" }),
              "flex-1",
            )}
          >
            Back to Navio
          </Link>
        </div>
      </section>
    </main>
  );
}
