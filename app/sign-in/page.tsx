import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AuthCard } from "@/app/feature/auth/auth-card";
import { startGoogleAuthentication } from "@/app/feature/auth/google-auth-action";
import { getSafeCallbackUrl } from "@/lib/auth-navigation";

export const metadata: Metadata = {
  title: "Log in - Navio",
  description: "Log in securely with Google to continue to Navio.",
};

type SignInPageProps = {
  searchParams: Promise<{
    callbackUrl?: string | string[];
    error?: string | string[];
  }>;
};

function firstValue(value?: string | string[]): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const callbackUrl = getSafeCallbackUrl(
    firstValue(params.callbackUrl),
    "/planner",
  );
  const session = await auth();

  if (session?.user && !session.error) {
    redirect(callbackUrl);
  }

  async function authenticate() {
    "use server";
    await startGoogleAuthentication(callbackUrl, "/sign-in");
  }

  return (
    <AuthCard.Root
      eyebrow="Welcome back"
      title="Log in to your account"
      description="Continue to your saved journeys, planning tools, and community activity."
    >
      <AuthCard.Error
        message={
          firstValue(params.error)
            ? "Sign-in could not be started. Please try again."
            : null
        }
      />
      <AuthCard.Action action={authenticate} label="Continue with Google" />
      <AuthCard.SecurityNote />
      <AuthCard.Footer
        prompt="Don’t have an account?"
        href={`/sign-up?callbackUrl=${encodeURIComponent(callbackUrl)}`}
        linkLabel="Sign up"
      />
    </AuthCard.Root>
  );
}
