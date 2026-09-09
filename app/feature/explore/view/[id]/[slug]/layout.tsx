import type { ReactNode } from "react";

import Image from "next/image";
import Link from "next/link";
import { Bell } from "lucide-react";

import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { getPlanById } from "../../../_components/data";
import { PlanMap } from "./_components/plan-map";

type ExplorePlanLayoutProps = {
  children: ReactNode;
  params: Promise<{
    id: string;
    slug: string;
  }>;
};

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Planner", href: "/planner" },
  { label: "Explore", href: "/explore" },
  { label: "Community", href: "/community" },
  { label: "Help", href: "/help" },
] as const;

export default async function ExplorePlanLayout({
  children,
  params,
}: ExplorePlanLayoutProps) {
  const { id } = await params;
  const plan = getPlanById(id);

  return (
    <div className="flex min-h-dvh flex-col bg-background lg:h-dvh lg:flex-row lg:overflow-hidden">
      <aside className="flex min-h-0 min-w-0 w-full flex-col border-r border-border bg-card/70 lg:w-1/2">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
              <Logo className="size-4" />
            </div>
            <span className="text-sm font-semibold text-foreground">Navio</span>
          </Link>
          <nav className="order-3 flex w-full items-center justify-between gap-1 overflow-x-auto text-sm text-muted-foreground">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full px-2 py-2 transition hover:bg-muted hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button
              type="button"
              aria-label="Notifications"
              className="relative flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <Bell className="size-4" aria-hidden="true" />
              <span
                className="absolute right-1.5 top-1.5 size-2 rounded-full bg-primary ring-2 ring-background"
                aria-hidden="true"
              />
            </button>
            <Link
              href="/profile"
              className="ml-0.5 flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-border"
              aria-label="Profile"
            >
              <Image
                src="https://images.unsplash.com/photo-1502685104226-ee32379fefbe?auto=format&fit=facearea&w=64&h=64"
                alt="User profile"
                width={36}
                height={36}
                className="h-full w-full object-cover"
              />
            </Link>
          </div>
        </div>
        <div className="min-h-0 min-w-0 flex-1 lg:overflow-y-auto lg:overscroll-contain">{children}</div>
      </aside>
      <section className="relative h-[45vh] w-full bg-muted/10 lg:h-auto lg:min-w-0 lg:w-1/2">
        <PlanMap plan={plan} />
      </section>
    </div>
  );
}
