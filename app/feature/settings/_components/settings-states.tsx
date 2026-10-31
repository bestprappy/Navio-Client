"use client";

import Link from "next/link";
import { CircleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api-client";

export const SESSION_EXPIRED = new ApiError("Your session has expired. Sign in again to continue.", 401);

export function SettingsSkeleton({ title }: { title: string }) {
  return (
    <main aria-busy="true" aria-label={`Loading ${title}`} className="flex flex-col gap-6">
      <div className="border-b border-border pb-5">
        <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
        <Skeleton className="mt-2 h-4 w-72 max-w-full" />
      </div>
      {[0, 1, 2].map((row) => (
        <div key={row} className="grid gap-4 sm:grid-cols-[14rem_minmax(0,1fr)] sm:gap-8">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-24 w-full" />
        </div>
      ))}
    </main>
  );
}

type SettingsLoadErrorProps = { title: string; error: unknown; retrying: boolean; onRetry: () => void };

/** A failed load says what happened and offers the one action that can fix it. */
export function SettingsLoadError({ title, error, retrying, onRetry }: SettingsLoadErrorProps) {
  const expired = error instanceof ApiError && error.status === 401;
  return (
    <main className="flex flex-col gap-6">
      <h1 className="border-b border-border pb-5 text-2xl font-extrabold tracking-tight">{title}</h1>
      <div role="alert" className="rounded-[var(--card-radius-lg)] border border-border bg-card p-6">
        <CircleAlert aria-hidden="true" className="mb-3 size-6 text-destructive" />
        <h2 className="text-lg font-semibold">This page couldn&apos;t load</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {error instanceof Error ? error.message : "Try again in a moment."}
        </p>
        {expired ? (
          <Link href="/sign-in?callbackUrl=%2Fsettings%2Fprofile" className="mt-4 inline-flex min-h-11 items-center font-medium text-primary underline underline-offset-4">
            Sign in again
          </Link>
        ) : (
          <Button type="button" variant="outline" className="mt-4 h-10 px-5" disabled={retrying} onClick={onRetry}>
            {retrying ? "Retrying…" : "Try again"}
          </Button>
        )}
      </div>
    </main>
  );
}
