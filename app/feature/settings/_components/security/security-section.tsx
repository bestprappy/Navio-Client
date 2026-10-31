"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, ExternalLink, KeyRound, LoaderCircle, LogOut, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useViewer } from "@/hooks/use-social";
import { ApiError } from "@/lib/api-client";
import { reauthenticate, startPasswordChange } from "@/lib/keycloak-actions";
import { getSecurityOverview, signOutEverywhere } from "@/lib/profile-api";
import { SettingsGroup, SettingsHeader } from "../settings-section";

const PROVIDER_NAMES: Record<string, string> = { google: "Google" };
const CONFIRM_PARAM = "confirm";
const CONFIRM_SIGN_OUT = "sign-out-everywhere";

function relativeTime(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

/**
 * Settings > Security. Passwords and linked sign-in providers are managed by
 * Keycloak through its own re-authenticating flows; this page only shows how
 * the account signs in and starts those flows. Nothing here is ever public.
 */
export function SecuritySection({ accountUrl }: { accountUrl: string | null }) {
  const viewer = useViewer();
  const params = useSearchParams();
  const returnedToConfirm = params.get(CONFIRM_PARAM) === CONFIRM_SIGN_OUT;
  const passwordUpdated = params.get("updated") === "password";
  // Returning from a fresh sign-in reopens the confirmation the traveller started.
  const [confirmOpen, setConfirmOpen] = useState(returnedToConfirm);

  const overview = useQuery({
    queryKey: ["account-security"],
    queryFn: ({ signal }) => getSecurityOverview(signal),
    enabled: viewer.signedIn,
    staleTime: 60_000,
  });

  const revoke = useMutation({
    mutationFn: signOutEverywhere,
    onSuccess: () => void signOut({ redirectTo: "/sign-in" }),
    onError: (error) => console.error("Sign out everywhere failed.", { component: "SecuritySection", error }),
  });
  const needsFreshSignIn = revoke.error instanceof ApiError && revoke.error.code === "reauthentication_required";

  const data = overview.data;
  const providers = data?.linkedProviders.map((id) => PROVIDER_NAMES[id] ?? id) ?? [];
  const externalOnly = !!data?.available && !data.passwordSet && providers.length > 0;

  return (
    <main className="flex flex-col">
      <SettingsHeader title="Security" description="How you sign in to Navio. Only you can see this page, and none of it appears on your profile." />

      {passwordUpdated ? (
        <p role="status" className="mt-6 flex items-center gap-2 rounded-md bg-success/10 px-4 py-3 text-sm text-success">
          <CheckCircle2 aria-hidden="true" className="size-4" />
          You&apos;re back from your sign-in account. If you changed your password, use it the next time you sign in.
        </p>
      ) : null}

      <div className="divide-y divide-border">
        <SettingsGroup title="Sign-in methods" description="Managed by your Navio sign-in account (Keycloak).">
          {overview.isPending ? (
            <div className="flex flex-col gap-2"><Skeleton className="h-5 w-56" /><Skeleton className="h-5 w-40" /></div>
          ) : !data || !data.available ? (
            <p role="alert" className="text-sm text-muted-foreground">
              Your sign-in details couldn&apos;t be loaded right now. You can still manage them in your sign-in account.
            </p>
          ) : (
            <ul role="list" className="flex flex-col gap-2 text-sm">
              <li className="flex items-center gap-2">
                <KeyRound aria-hidden="true" className="size-4 text-muted-foreground" />
                {data.passwordSet ? "Password" : "No password set"}
              </li>
              {providers.map((provider) => (
                <li key={provider} className="flex items-center gap-2">
                  <CheckCircle2 aria-hidden="true" className="size-4 text-success" />
                  Signs in with {provider}
                </li>
              ))}
              {relativeTime(data.authenticatedAt) ? (
                <li className="text-muted-foreground">This session signed in {relativeTime(data.authenticatedAt)}</li>
              ) : null}
            </ul>
          )}
        </SettingsGroup>

        <SettingsGroup
          title="Password"
          description={externalOnly
            ? `You sign in with ${providers.join(" and ")}. You can add a password to also sign in with your email.`
            : "You'll be asked to confirm it's you before choosing a new password."}
        >
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" className="h-10 px-4" onClick={() => void startPasswordChange()}>
              <KeyRound aria-hidden="true" />
              {externalOnly ? "Add a password" : "Change password"}
            </Button>
            {accountUrl ? (
              <a href={accountUrl} className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline">
                Open sign-in account
                <ExternalLink aria-hidden="true" className="size-3.5" />
              </a>
            ) : null}
          </div>
        </SettingsGroup>

        <SettingsGroup title="Sign out everywhere" description="Ends every session on every device, including this one. Use it if you signed in on a shared computer or think someone else has access.">
          <Button type="button" variant="outline" className="h-10 px-4" onClick={() => { revoke.reset(); setConfirmOpen(true); }}>
            <LogOut aria-hidden="true" />
            Sign out of all devices
          </Button>
        </SettingsGroup>
      </div>

      <Dialog open={confirmOpen} onOpenChange={(open) => { if (!revoke.isPending) setConfirmOpen(open); }}>
        <DialogContent className="gap-5 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sign out of all devices?</DialogTitle>
            <DialogDescription>
              Every Navio session ends, including this one. You&apos;ll need to sign in again everywhere.
            </DialogDescription>
          </DialogHeader>
          {needsFreshSignIn ? (
            <p role="alert" className="flex items-start gap-2 text-sm text-foreground">
              <ShieldAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-warning" />
              {returnedToConfirm
                ? "Your sign-in still isn't recent enough. Use your sign-in account to end other sessions instead."
                : "For your security, sign in again first. You'll come straight back here."}
            </p>
          ) : revoke.error ? (
            <p role="alert" className="text-sm text-destructive">{revoke.error.message}</p>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" className="h-10 px-5" disabled={revoke.isPending} onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            {needsFreshSignIn && !returnedToConfirm ? (
              <Button type="button" className="h-10 px-5" onClick={() => void reauthenticate(`/settings/security?${CONFIRM_PARAM}=${CONFIRM_SIGN_OUT}`)}>
                Sign in again
              </Button>
            ) : (
              <Button type="button" variant="destructive" className="h-10 px-5" disabled={revoke.isPending || (needsFreshSignIn && returnedToConfirm)} onClick={() => revoke.mutate()}>
                {revoke.isPending ? <LoaderCircle aria-hidden="true" className="animate-spin motion-reduce:animate-none" /> : null}
                Sign out everywhere
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
