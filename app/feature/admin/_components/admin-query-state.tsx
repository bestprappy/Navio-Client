"use client";

import { RotateCw, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { AdminApiError } from "./admin-api";

type AdminErrorStateProps = {
  error: Error;
  onRetry: () => void;
  isRetrying?: boolean;
  className?: string;
};

/**
 * A failed load, with a retry.
 *
 * Failed requests are never shown as empty lists or zero counts: a moderator
 * reading "0 banned accounts" would take it as a fact.
 */
export function AdminErrorState({ error, onRetry, isRetrying = false, className }: AdminErrorStateProps) {
  const message = error instanceof AdminApiError
    ? error.message
    : "Something went wrong while loading this. Try again.";
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm sm:flex-row sm:items-center",
        className,
      )}
    >
      <TriangleAlert className="size-5 shrink-0 text-destructive" aria-hidden="true" />
      <p className="flex-1 text-foreground">{message}</p>
      <Button variant="outline" size="sm" onClick={onRetry} disabled={isRetrying}>
        <RotateCw className={cn(isRetrying && "animate-spin motion-reduce:animate-none")} aria-hidden="true" />
        Try again
      </Button>
    </div>
  );
}

type AdminLoadingRowsProps = {
  rows?: number;
  label: string;
};

export function AdminLoadingRows({ rows = 5, label }: AdminLoadingRowsProps) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-2">
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-11 w-full" />
      ))}
    </div>
  );
}
