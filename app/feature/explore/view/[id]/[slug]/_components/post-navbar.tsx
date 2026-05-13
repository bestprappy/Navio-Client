"use client";

import Link from "next/link";

import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Planner", href: "/planner" },
  { label: "Explore", href: "/explore" },
  { label: "Community", href: "/commu" },
  { label: "Help", href: "/help" },
] as const;

export function PostNavbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur">
      <nav
        className="grid h-14 grid-cols-[auto_1fr_auto] items-center px-6"
        aria-label="Post navigation"
      >
        <Link
          href="/"
          className="flex items-center gap-2 rounded-full border border-border bg-card/80 px-2.5 py-1 text-foreground transition hover:bg-card"
          aria-label="Navio home"
        >
          <Logo className="size-4" />
          <span className="text-sm font-semibold tracking-tight">Navio</span>
        </Link>

        <div className="flex items-center justify-center gap-3">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="rounded-full px-2.5 py-1 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/profile"
            className="flex size-9 items-center justify-center overflow-hidden rounded-full border border-border"
            aria-label="Profile"
          >
            <img
              src="https://images.unsplash.com/photo-1502685104226-ee32379fefbe?auto=format&fit=facearea&w=64&h=64"
              alt="User profile"
              className="h-full w-full object-cover"
            />
          </Link>
        </div>
      </nav>
    </header>
  );
}
