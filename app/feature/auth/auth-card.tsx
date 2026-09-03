import type { PropsWithChildren } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import { AuthSubmitButton } from "./auth-submit-button";
import { Logo } from "@/components/logo";

type AuthCardRootProps = PropsWithChildren<{
  description: string;
  eyebrow: string;
  title: string;
}>;

type AuthCardActionProps = {
  action: () => Promise<void>;
  label: string;
};

type AuthCardErrorProps = {
  message?: string | null;
};

type AuthCardFooterProps = {
  href: string;
  linkLabel: string;
  prompt: string;
};

function GoogleMark() {
  return (
    <svg
      aria-hidden="true"
      className="size-5 shrink-0"
      viewBox="0 0 24 24"
      focusable="false"
    >
      <path
        fill="#4285F4"
        d="M21.6 12.227c0-.709-.064-1.391-.182-2.045H12v3.868h5.382a4.6 4.6 0 0 1-1.995 3.018v2.51h3.231c1.891-1.742 2.982-4.306 2.982-7.351Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.964-.895 6.618-2.423l-3.231-2.509c-.896.6-2.041.955-3.387.955-2.605 0-4.81-1.759-5.6-4.123H3.059v2.591A9.997 9.997 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.4 13.9A6.014 6.014 0 0 1 6.086 12c0-.659.114-1.3.314-1.9V7.509H3.059A9.996 9.996 0 0 0 2 12c0 1.614.386 3.141 1.059 4.491L6.4 13.9Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.977c1.468 0 2.786.505 3.823 1.496l2.868-2.868C16.959 2.991 14.695 2 12 2a9.997 9.997 0 0 0-8.941 5.509L6.4 10.1c.79-2.364 2.995-4.123 5.6-4.123Z"
      />
    </svg>
  );
}

function AuthCardRoot({
  children,
  description,
  eyebrow,
  title,
}: AuthCardRootProps) {
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-gradient-to-br from-background via-secondary/30 to-primary/10 p-4 sm:p-6">
      <div
        aria-hidden="true"
        className="absolute -left-24 top-16 size-64 rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-24 -right-20 size-72 rounded-full bg-accent/10 blur-3xl"
      />

      <section className="relative flex w-full max-w-lg flex-col rounded-3xl border border-border/70 bg-card/95 p-6 shadow-xl backdrop-blur sm:p-8">
        <Link
          href="/"
          className="mb-8 inline-flex w-fit items-center gap-2 rounded-lg text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to Navio
        </Link>

        <div className="mb-8 flex items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
            <Logo className="size-6" />
          </span>
          <div>
            <p className="text-lg font-extrabold tracking-tight text-foreground">
              Navio
            </p>
            <p className="text-sm text-muted-foreground">
              EV journeys, made simple
            </p>
          </div>
        </div>

        <header className="mb-8">
          <p className="mb-2 text-sm font-bold uppercase tracking-wider text-primary">
            {eyebrow}
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground sm:text-base">
            {description}
          </p>
        </header>

        <div className="flex flex-col gap-5">{children}</div>
      </section>
    </main>
  );
}

function AuthCardAction({ action, label }: AuthCardActionProps) {
  return (
    <form action={action}>
      <AuthSubmitButton icon={<GoogleMark />} label={label} />
    </form>
  );
}

function AuthCardError({ message }: AuthCardErrorProps) {
  if (!message) {
    return null;
  }

  return (
    <p
      className="rounded-xl bg-destructive/10 p-4 text-sm font-medium text-destructive"
      role="alert"
    >
      {message}
    </p>
  );
}

function AuthCardSecurityNote() {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-muted p-4 text-sm text-muted-foreground">
      <ShieldCheck
        className="mt-0.5 size-5 shrink-0 text-primary"
        aria-hidden="true"
      />
      <p className="leading-6">
        Secure OAuth 2.0 sign-in. Your Google password always stays with Google.
      </p>
    </div>
  );
}

function AuthCardFooter({ href, linkLabel, prompt }: AuthCardFooterProps) {
  return (
    <p className="text-center text-sm text-muted-foreground">
      {prompt}{" "}
      <Link
        href={href}
        className="rounded-md font-bold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
      >
        {linkLabel}
      </Link>
    </p>
  );
}

export const AuthCard = {
  Action: AuthCardAction,
  Error: AuthCardError,
  Footer: AuthCardFooter,
  Root: AuthCardRoot,
  SecurityNote: AuthCardSecurityNote,
};
