"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, Search, X } from "lucide-react";
import { useAtom, useSetAtom } from "jotai";

import { communitySearchQueryAtom, createCommunityOpenAtom } from "./community-atoms";
import { COMMUNITY_NAV, isCommunityNavActive } from "../community-sidebar";
import { AuthActions } from "@/components/auth-actions";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { cn } from "@/lib/utils";

export function CommunityNavbar() {
  const [searchQuery, setSearchQuery] = useAtom(communitySearchQueryAtom);
  const openCreate = useSetAtom(createCommunityOpenAtom);
  const { requireAuth } = useRequireAuth();
  const pathname = usePathname();

  return (
    <header className="z-10 shrink-0 border-b border-border bg-card">
      <div className="flex min-h-16 flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 lg:px-6">
        <Link
          href="/community"
          className="flex shrink-0 items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Navio Community home"
        >
          <span className="flex size-9 items-center justify-center rounded-full bg-primary/12 ring-1 ring-primary/25">
            <Logo className="size-4.5" />
          </span>
          <span className="hidden items-baseline gap-1.5 sm:flex">
            <span className="text-lg font-extrabold leading-none tracking-tight">
              <span className="text-primary">N</span>avio
            </span>
            <span className="text-sm font-semibold text-muted-foreground">community</span>
          </span>
        </Link>

        <div className="order-last flex min-w-0 basis-full justify-center sm:order-none sm:flex-1 sm:basis-auto">
          <div className="relative w-full max-w-xl">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search Navio community"
              className="h-10 rounded-full border-transparent bg-muted pl-10 pr-10 focus-visible:border-ring focus-visible:bg-background"
              aria-label="Search posts and communities"
            />
            {searchQuery ? (
              <Button
                type="button"
                aria-label="Clear search"
                variant="ghost"
                size="icon-sm"
                onClick={() => setSearchQuery("")}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full"
              >
                <X aria-hidden="true" />
              </Button>
            ) : null}
          </div>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:ml-0">
          <Button
            nativeButton={false}
            render={<Link href="/community/create" />}
            variant="ghost"
            className="h-10 rounded-full px-3 font-semibold"
            aria-label="Create post"
          >
            <Plus className="size-5" aria-hidden="true" />
            <span className="hidden sm:inline">Create</span>
          </Button>
          <ThemeToggle />
          <AuthActions compact />
        </div>
      </div>

      <nav aria-label="Community sections" className="flex gap-1 overflow-x-auto px-3 pb-2 md:hidden">
        {COMMUNITY_NAV.map(({ href, title, icon: Icon }) => {
          const active = isCommunityNavActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active ? "bg-primary/12 text-primary" : "text-muted-foreground hover:bg-muted",
              )}
            >
              <Icon className="size-3.5" aria-hidden="true" />
              {title}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => requireAuth(() => openCreate(true))}
          aria-label="Create a community"
          className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Plus className="size-3.5" aria-hidden="true" />
          Community
        </button>
      </nav>
    </header>
  );
}
