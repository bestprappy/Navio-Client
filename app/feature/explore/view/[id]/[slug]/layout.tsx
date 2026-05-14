import type { ReactNode } from "react";

import Link from "next/link";

import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { PlanMap } from "./_components/plan-map";

type ExplorePlanLayoutProps = {
  children: ReactNode;
};

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Planner", href: "/planner" },
  { label: "Explore", href: "/explore" },
  { label: "Community", href: "/commu" },
  { label: "Help", href: "/help" },
] as const;

export default function ExplorePlanLayout({
  children,
}: ExplorePlanLayoutProps) {
  return (
    <div className="flex h-screen flex-col bg-background lg:flex-row">
      <aside className="flex w-full min-h-0 flex-col border-r border-border bg-card/70 lg:w-1/2">
        <div className="flex items-center justify-between gap-4 border-b border-border/60 px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
              <Logo className="size-4" />
            </div>
            <span className="text-sm font-semibold text-foreground">Navio</span>
          </Link>
          <nav className="hidden items-center gap-2 text-sm text-muted-foreground md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full px-3 py-1 transition hover:bg-muted hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <ThemeToggle />
            <Link
              href="/profile"
              className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-border"
              aria-label="Profile"
            >
              <img
                src="https://images.unsplash.com/photo-1502685104226-ee32379fefbe?auto=format&fit=facearea&w=64&h=64"
                alt="User profile"
                className="h-full w-full object-cover"
              />
            </Link>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </aside>
      <section className="relative flex w-full bg-muted/10 lg:w-1/2">
        <PlanMap />
      </section>
    </div>
  );
}
