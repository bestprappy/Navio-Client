"use client";

import Link from "next/link";
import { atom, getDefaultStore, useAtom } from "jotai";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button.variants";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getSignInHref } from "@/lib/auth-navigation";

// Keep the global prompt shared with isolated planner stores.
export const authPromptStore = getDefaultStore();
export const signInPromptAtom = atom<string | null>(null);

export function SignInPrompt() {
  const [callbackUrl, setCallbackUrl] = useAtom(signInPromptAtom, { store: authPromptStore });
  const { data: session, status } = useSession();
  const signedIn = status === "authenticated" && !!session?.user && !session.error;
  return (
    <Dialog open={callbackUrl !== null && !signedIn} onOpenChange={(open) => { if (!open) setCallbackUrl(null); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sign in to continue</DialogTitle>
          <DialogDescription>
            Sign in or create an account to plan trips, save Explore posts,
            and join community discussions.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setCallbackUrl(null)}>Cancel</Button>
          <Link href={getSignInHref(callbackUrl ?? "/dashboard")} className={buttonVariants()} onClick={() => setCallbackUrl(null)}>
            Sign in / Sign up
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
