import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";

import { auth, signIn } from "@/auth";
import { AuthCard } from "@/app/feature/auth/auth-card";
import { getSafeCallbackUrl } from "@/lib/auth-navigation";

export const metadata: Metadata = {
  title: "Sign in - Navio",
  description: "Sign in securely to plan trips and interact with Navio.",
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
  const callbackUrl = getSafeCallbackUrl(firstValue(params.callbackUrl), "/planner");
  const session = await auth();

  if (session?.user && !session.error) {
    redirect(callbackUrl);
  }

  async function authenticate() {
    "use server";

    try {
      await signIn("keycloak", { redirectTo: callbackUrl });
    } catch (error) {
      if (error instanceof AuthError) {
        redirect(`/sign-in?error=AuthenticationFailed&callbackUrl=${encodeURIComponent(callbackUrl)}`);
      }
      throw error;
    }
  }

  const hasError = Boolean(firstValue(params.error));
  return (
    <AuthCard
      action={authenticate}
      alternateHref={`/sign-up?callbackUrl=${encodeURIComponent(callbackUrl)}`}
      alternateLabel="New to Navio? Create an account"
      description="Continue to your saved trips, planning tools, and community actions."
      errorMessage={hasError ? "Sign-in could not be completed. Please try again." : null}
      submitLabel="Continue with Keycloak"
      title="Welcome back"
    />
  );
}
