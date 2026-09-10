import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { auth } from "@/auth";
import { Navbar } from "@/components/navbar";
import { getSignInHref } from "@/lib/auth-navigation";

export default async function SettingsLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user || session.error) {
    redirect(getSignInHref("/settings/profile"));
  }

  return (
    <div className="min-h-svh bg-background">
      <Navbar />
      {children}
    </div>
  );
}
