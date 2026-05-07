"use client";

import { useMemo } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider as JotaiProvider, useAtomValue } from "jotai";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Zap, Save, Share2, ChevronLeft } from "lucide-react";
import { activeRouteAtom } from "./home.atoms";
import { HomeSidebar } from "./home.sidebar";
import { HomePanel } from "./home.panel";

// Mapbox requires browser APIs — skip SSR
const HomeMap = dynamic(
  () => import("./home.map").then((m) => ({ default: m.HomeMap })),
  { ssr: false, loading: () => <MapSkeleton /> },
);

function MapSkeleton() {
  return (
    <div className="flex-1 h-full bg-muted/30 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <div className="w-8 h-8 rounded-full border-2 border-muted-foreground/30 border-t-primary animate-spin" />
        <span className="text-sm">Loading map…</span>
      </div>
    </div>
  );
}

function HomeHeader() {
  const route = useAtomValue(activeRouteAtom);

  return (
    <header className="flex items-center gap-4 px-4 h-14 border-b border-border bg-card shrink-0 z-10">
      <Link
        href="/"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
        aria-label="Back to Navio home"
      >
        <ChevronLeft className="w-4 h-4" />
        <div className="flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-primary" />
          <span className="font-bold text-foreground">Navio</span>
        </div>
      </Link>

      <div className="flex-1 min-w-0 flex items-center justify-center">
        <h1 className="text-sm font-semibold text-foreground truncate">
          {route.name}
        </h1>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Save className="w-3.5 h-3.5" />
          Save
        </button>
        <button
          type="button"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <Share2 className="w-3.5 h-3.5" />
          Share
        </button>
      </div>
    </header>
  );
}

function HomeLayout() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <HomeHeader />
      <div className="flex flex-1 overflow-hidden">
        <HomeSidebar />
        <HomeMap />
        <HomePanel />
      </div>
    </div>
  );
}

export function Home() {
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
      }),
    [],
  );

  return (
    <JotaiProvider>
      <QueryClientProvider client={queryClient}>
        <HomeLayout />
      </QueryClientProvider>
    </JotaiProvider>
  );
}
