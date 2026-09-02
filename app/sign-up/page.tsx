import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";

import { auth, signIn } from "@/auth";
import { AuthCard } from "@/app/feature/auth/auth-card";
import { getSafeCallbackUrl } from "@/lib/auth-navigation";

export const metadata: Metadata = {
  title: "Create account - Navio",
  description: "Create a secure Navio account through Keycloak.",
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
  const callbackUrl = getSafeCallbackUrl(firstValue(params.callbackUrl), "/planner");
  const session = await auth();

  if (session?.user && !session.error) {
    redirect(callbackUrl);
  }

  async function register() {
    "use server";

    try {
      await signIn(
        "keycloak",
        { redirectTo: callbackUrl },
        { prompt: "create" },
      );
    } catch (error) {
      if (error instanceof AuthError) {
        redirect(`/sign-up?error=AuthenticationFailed&callbackUrl=${encodeURIComponent(callbackUrl)}`);
      }
      throw error;
    }
  }

  const hasError = Boolean(firstValue(params.error));
  return (
    <AuthCard
      action={register}
      alternateHref={`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`}
      alternateLabel="Already have an account? Sign in"
      description="Create your account to save plans, join communities, and contribute."
      errorMessage={hasError ? "Account creation could not be started. Please try again." : null}
      submitLabel="Create account with Keycloak"
      title="Start your Navio journey"
    />
  );
}
