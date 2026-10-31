import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { readAuth as auth } from "@/auth";
import { Navbar } from "@/components/navbar";
import { SettingsNav } from "@/app/feature/settings/_components/settings-nav";
import { getSignInHref } from "@/lib/auth-navigation";

export default async function SettingsLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user || session.error) {
    redirect(getSignInHref("/settings/profile"));
  }

  return (
    <div className="min-h-svh bg-background">
      <Navbar />
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-6 sm:px-6 md:grid-cols-[15rem_minmax(0,1fr)] md:gap-10 md:py-10">
        <div className="sticky top-16 z-10 -mx-4 min-w-0 bg-background/95 px-4 pt-2 backdrop-blur md:static md:mx-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
          <SettingsNav />
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
