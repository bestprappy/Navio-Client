"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import { SignInPrompt } from "./sign-in-prompt";

type AuthSessionProviderProps = {
  children: ReactNode;
};

export function AuthSessionProvider({ children }: AuthSessionProviderProps) {
  return (
    <SessionProvider refetchInterval={60} refetchWhenOffline={false}>
      {children}
      <SignInPrompt />
    </SessionProvider>
  );
}
