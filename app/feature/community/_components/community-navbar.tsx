"use client";

import Image from "next/image";
import Link from "next/link";
import { Bell, Plus, Search, X } from "lucide-react";
import { useAtom } from "jotai";

import { communitySearchQueryAtom } from "./community-atoms";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Input } from "@/components/ui/input";

export function CommunityNavbar() {
  const [searchQuery, setSearchQuery] = useAtom(communitySearchQueryAtom);

  return (
    <header className="shrink-0 border-b border-border">
      <div className="flex h-18 items-center gap-3 px-4 lg:px-6">
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

        <div className="flex flex-1 items-center justify-center px-2 sm:px-4">
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
              <button
                type="button"
                aria-label="Clear community search"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Link
            href="/community/create"
            className="flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            aria-label="Create post or group"
          >
            <Plus className="size-4" aria-hidden="true" />
            Create
          </Link>

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
      </div>
    </header>
  );
}
