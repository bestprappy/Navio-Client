import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { readAuth } from "@/auth";
import SidebarWrapper from "@/components/sidebar/sidebar";
import { getSignInHref } from "@/lib/auth-navigation";
import { canUseAdminConsole } from "@/lib/navio-roles";

import { AdminAccessDenied } from "../feature/admin/_components/admin-access-denied";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Gate for the admin console.
 *
 * This decides whether the pages render. It does not protect data: every
 * request the pages make is authorized again by the gateway and
 * user-management-service from the access token itself.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await readAuth();
  if (!session?.user || session.error) {
    // The request proxy normally redirects first, with the exact return URL.
    redirect(getSignInHref("/admin"));
  }

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden md:flex-row">
      <SidebarWrapper />
      <main className="min-h-0 min-w-0 flex-1 overflow-auto">
        {canUseAdminConsole(session.user.roles) ? children : <AdminAccessDenied />}
      </main>
    </div>
  );
}
