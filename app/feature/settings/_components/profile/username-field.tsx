"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, LoaderCircle, XCircle } from "lucide-react";

import { Input } from "@/components/ui/input";
import { checkUsername } from "@/lib/profile-api";
import { USERNAME_PATTERN } from "@/lib/validations/profile";
import { cn } from "@/lib/utils";

type UsernameFieldProps = {
  id: string;
  value: string;
  savedUsername: string | null;
  /** When the next change is allowed; null when it is allowed now. */
  changeAvailableAt: string | null;
  invalid: boolean;
  describedBy: string;
  onChange: (value: string) => void;
  onBlur: () => void;
};

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

/**
 * The @handle input. Checks availability with the server shortly after typing
 * stops, but only for a well-formed handle that differs from the saved one.
 */
export function UsernameField({ id, value, savedUsername, changeAvailableAt, invalid, describedBy, onChange, onBlur }: UsernameFieldProps) {
  const normalized = value.trim().replace(/^@/, "").toLowerCase();
  const candidate = useDebounced(normalized, 400);
  const locked = changeAvailableAt !== null;
  const shouldCheck = !locked && candidate !== (savedUsername ?? "") && USERNAME_PATTERN.test(candidate);

  const availability = useQuery({
    queryKey: ["username-availability", candidate],
    queryFn: ({ signal }) => checkUsername(candidate, signal),
    enabled: shouldCheck,
    staleTime: 30_000,
    retry: false,
  });

  const pending = shouldCheck && (availability.isFetching || candidate !== normalized);
  const result = shouldCheck && candidate === normalized ? availability.data : undefined;

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <span aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground">@</span>
        <Input
          id={id}
          value={value}
          disabled={locked}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={31}
          aria-invalid={invalid || result?.available === false || undefined}
          aria-describedby={`${describedBy} ${id}-availability`}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          className={cn("h-11 pl-7")}
        />
      </div>
      <p id={`${id}-availability`} aria-live="polite" className="flex min-h-5 items-center gap-1.5 text-sm">
        {locked ? (
          <span className="text-muted-foreground">
            You can change your username again on {new Date(changeAvailableAt).toLocaleDateString(undefined, { dateStyle: "long" })}.
          </span>
        ) : pending ? (
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <LoaderCircle aria-hidden="true" className="size-3.5 animate-spin motion-reduce:animate-none" />
            Checking…
          </span>
        ) : result?.available ? (
          <span className="flex items-center gap-1.5 text-success">
            <CheckCircle2 aria-hidden="true" className="size-3.5" />
            @{result.username} is available
          </span>
        ) : result && !result.available ? (
          <span className="flex items-center gap-1.5 text-destructive">
            <XCircle aria-hidden="true" className="size-3.5" />
            {result.message ?? "This username can't be used"}
          </span>
        ) : availability.isError && shouldCheck ? (
          <span className="text-muted-foreground">Availability couldn&apos;t be checked. It will be checked when you save.</span>
        ) : null}
      </p>
    </div>
  );
}
