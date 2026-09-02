import Link from "next/link";
import { Compass, ShieldCheck } from "lucide-react";

import { Logo } from "@/components/logo";
import { buttonVariants } from "@/components/ui/button.variants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type AuthCardProps = {
  action: () => Promise<void>;
  alternateHref: string;
  alternateLabel: string;
  description: string;
  errorMessage?: string | null;
  submitLabel: string;
  title: string;
};

export function AuthCard({
  action,
  alternateHref,
  alternateLabel,
  description,
  errorMessage,
  submitLabel,
  title,
}: AuthCardProps) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-4 sm:p-6">
      <Card className="w-full max-w-md border-border/70 shadow-lg">
        <CardHeader className="items-center text-center">
          <Link
            href="/"
            className="mb-2 flex items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            aria-label="Navio home"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
              <Logo className="size-5" />
            </span>
            <span className="text-xl font-extrabold tracking-tight">Navio</span>
          </Link>
          <CardTitle className="text-2xl font-extrabold tracking-tight">
            {title}
          </CardTitle>
          <CardDescription className="max-w-sm leading-6">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {errorMessage ? (
            <p
              className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
              role="alert"
            >
              {errorMessage}
            </p>
          ) : null}

          <form action={action}>
            <button
              type="submit"
              className={cn(buttonVariants({ size: "lg" }), "w-full")}
            >
              <Compass className="size-4" aria-hidden="true" />
              {submitLabel}
            </button>
          </form>

          <div className="flex items-start gap-2 rounded-lg bg-muted p-3 text-sm text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            <p>
              Authentication is handled by Navio Keycloak. Your password is
              never sent to or stored by the Navio web client.
            </p>
          </div>

          <Link
            href={alternateHref}
            className="self-center rounded-md text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            {alternateLabel}
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
