"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bell, Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button.variants";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

type NavLink = {
  label: string;
  href: string;
};

const NAV_LINKS: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "Planner", href: "/planner" },
  { label: "Explore", href: "/explore" },
  { label: "Community", href: "/community" },
  { label: "Help", href: "/help" },
];

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/25 bg-background/70 backdrop-blur-xl backdrop-saturate-150 supports-backdrop-filter:bg-background/50">
      <nav
        className="container-max flex h-16 items-center justify-between"
        style={{ paddingInline: "var(--section-px)" }}
        aria-label="Main navigation"
      >
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-lg"
        >
          {/* Rounded to xl for consistent design language */}
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
            <Logo className="size-4" />
          </div>
          <span className="text-lg font-extrabold tracking-tight">Navio</span>
        </Link>

        {/* Desktop nav links */}
        <ul className="hidden list-none items-center gap-2 md:flex" role="list">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="rounded-full px-3 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Desktop actions */}
        <div className="hidden items-center gap-1 md:flex">
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
            className="ml-0.5 flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2"
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

        {/* Mobile menu toggle */}
        <Button
          className="md:hidden"
          variant="ghost"
          size="icon-sm"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          aria-label={
            isMenuOpen ? "Close navigation menu" : "Open navigation menu"
          }
          aria-expanded={isMenuOpen}
          aria-controls="mobile-nav"
        >
          {isMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </Button>
      </nav>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div
          id="mobile-nav"
          className="border-t border-border/40 bg-background/95 backdrop-blur-sm"
          role="navigation"
          aria-label="Mobile navigation"
        >
          <ul
            className="flex flex-col"
            style={{ paddingInline: "var(--section-px)", paddingBlock: "1rem" }}
            role="list"
          >
            {NAV_LINKS.map((link, index) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "block py-3 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-md",
                    // Divider between links — using border-b except last item
                    index < NAV_LINKS.length - 1 && "border-b border-border/30",
                  )}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="mt-4 flex flex-col gap-2 border-t border-border/40 pt-4">
              <Link
                href="/sign-in"
                className={cn(buttonVariants({ variant: "outline" }))}
                onClick={() => setIsMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className={cn(buttonVariants())}
                onClick={() => setIsMenuOpen(false)}
              >
                Get Started
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
