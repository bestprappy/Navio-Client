"use client";

import Link from "next/link";
import { Compass, Plus, Search, X } from "lucide-react";
import { useAtom } from "jotai";

import { communitySearchQueryAtom } from "./community-atoms";
import { AuthActions } from "@/components/auth-actions";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function CommunityNavbar() {
  const [searchQuery, setSearchQuery] = useAtom(communitySearchQueryAtom);

  return (
    <header className="shrink-0 border-b border-border">
      <div className="flex min-h-18 flex-wrap items-center gap-2 px-4 py-3 sm:flex-nowrap lg:px-6">
        <Link
          href="/community"
          className="flex shrink-0 items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          aria-label="Navio Communities home"
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
            <Logo className="size-4" />
          </div>

          <div className="hidden flex-row gap-2 sm:flex">
            <h1 className="text-2xl font-extrabold leading-none tracking-tight">
              <span className="text-primary">N</span>avio
            </h1>
            <span className="text-lg font-medium text-muted-foreground">
              Community
            </span>
          </div>
        </Link>

        <div className="order-last flex w-full min-w-0 items-center justify-center sm:order-none sm:flex-1 sm:px-4">
          <div className="relative w-full max-w-2xl">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search communities, posts, or topics..."
              className="h-11 rounded-full bg-muted pl-10 pr-10 focus-visible:bg-background"
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

        <div className="ml-auto flex shrink-0 items-center gap-1">
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
            Create
          </Button>

          <ThemeToggle />
          <AuthActions compact />
        </div>
      </div>
    </header>
  );
}
