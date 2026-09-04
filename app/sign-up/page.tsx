import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AuthCard } from "@/app/feature/auth/auth-card";
import {
  startEmailAuthentication,
  startGoogleAuthentication,
} from "@/app/feature/auth/google-auth-action";
import { getSafeCallbackUrl } from "@/lib/auth-navigation";

export const metadata: Metadata = {
  title: "Create account - Navio",
  description: "Create your Navio account securely with email or Google.",
};

type SignUpPageProps = {
  searchParams: Promise<{
    callbackUrl?: string | string[];
    error?: string | string[];
  }>;
};

function firstValue(value?: string | string[]): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const params = await searchParams;
  const callbackUrl = getSafeCallbackUrl(
    firstValue(params.callbackUrl),
    "/planner",
  );
  const session = await auth();

  if (session?.user && !session.error) {
    redirect(callbackUrl);
  }

  async function registerWithGoogle() {
    "use server";
    await startGoogleAuthentication(callbackUrl, "/sign-up");
  }

  async function registerWithEmail() {
    "use server";
    await startEmailAuthentication(callbackUrl, "/sign-up");
  }

  return (
    <AuthCard.Root
      eyebrow="Get started"
      title="Create your account"
      description="Save EV journeys, build new routes, and take part in the Navio community."
    >
      <AuthCard.Error
        message={
          firstValue(params.error)
            ? "Account creation could not be started. Please try again."
            : null
        }
      />
      <AuthCard.Action
        action={registerWithEmail}
        label="Sign up with email & password"
        method="email"
      />
      <AuthCard.Divider />
      <AuthCard.Action
        action={registerWithGoogle}
        label="Continue with Google"
      />
      <AuthCard.SecurityNote mode="sign-up" />
      <AuthCard.Footer
        prompt="Already have an account?"
        href={`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`}
        linkLabel="Log in"
      />
    </AuthCard.Root>
  );
}
