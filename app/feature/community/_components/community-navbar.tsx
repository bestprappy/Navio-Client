"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Plus, Search, X } from "lucide-react";
import { useAtom } from "jotai";

import { communitySearchQueryAtom } from "./community-atoms";
import { AuthActions } from "@/components/auth-actions";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MOBILE_LINKS = [
  { href: "/", label: "Home" },
  { href: "/community", label: "Feed" },
  { href: "/community/discovery", label: "Discover groups" },
] as const;

export function CommunityNavbar() {
  const [searchQuery, setSearchQuery] = useAtom(communitySearchQueryAtom);
  const pathname = usePathname();

  return (
    <header className="z-10 shrink-0 border-b border-border bg-card/95">
      <div className="flex min-h-18 flex-wrap items-center gap-3 px-4 py-3 lg:px-6">
        <Link
          href="/community"
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 md:flex-none"
          aria-label="Navio Communities home"
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
            <Logo className="size-4" />
          </div>

          <div className="flex min-w-0 items-center gap-2">
            <span className="text-lg font-bold leading-none tracking-tight sm:text-xl">
              <span className="text-primary">N</span>avio
            </span>
            <span className="hidden text-sm font-medium text-muted-foreground lg:inline">
              Community
            </span>
          </div>
        </Link>

        <div className="order-last flex min-w-0 basis-full items-center justify-center md:order-none md:flex-1 md:basis-auto md:px-4">
          <div className="relative w-full max-w-2xl">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search posts and communities"
              className="h-11 rounded-xl border-input bg-background pl-10 pr-10 focus-visible:bg-background"
              aria-label="Search communities"
            />
            {searchQuery ? (
              <Button
                type="button"
                aria-label="Clear community search"
                variant="ghost"
                size="icon-sm"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <X className="size-4" aria-hidden="true" />
              </Button>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            nativeButton={false}
            render={<Link href="/community/discovery" />}
            aria-label="Discover communities"
          >
            <Compass className="size-4" aria-hidden="true" />
          </Button>
          <Button
            nativeButton={false}
            render={<Link href="/community/create" />}
            variant="outline"
            aria-label="Create post"
          >
            <Plus className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Create</span>
          </Button>

          <ThemeToggle />
          <AuthActions compact />
        </div>
      </div>
      <nav aria-label="Community navigation" className="flex gap-1 px-4 pb-2 md:hidden">
        {MOBILE_LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            aria-current={pathname === href ? "page" : undefined}
            className={cn(
              "rounded-lg px-3 py-2 text-xs font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              pathname === href ? "bg-primary/10 text-primary" : "text-muted-foreground",
            )}
          >
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
