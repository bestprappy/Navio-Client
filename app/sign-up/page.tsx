import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { readAuth as auth } from "@/auth";
import { AuthRedirect } from "@/app/feature/auth/auth-redirect";
import { getSafeCallbackUrl } from "@/lib/auth-navigation";

export const metadata: Metadata = {
  title: "Create account - Navio",
  description: "Create a Navio account to plan and save EV trips.",
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
    "/dashboard",
  );
  const session = await auth();

  if (session?.user && !session.error) {
    redirect(callbackUrl);
  }

  return (
    <AuthRedirect
      callbackUrl={callbackUrl}
      errorMessage={
        firstValue(params.error)
          ? "Navio could not finish creating your account. Try again."
          : null
      }
      mode="sign-up"
    />
  );
}
