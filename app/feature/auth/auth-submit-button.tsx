"use client";

import type { ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";

type AuthSubmitButtonProps = {
  icon: ReactNode;
  label: string;
};

export function AuthSubmitButton({ icon, label }: AuthSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-border bg-card px-6 text-sm font-bold text-card-foreground shadow-sm transition hover:-translate-y-0.5 hover:bg-muted hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 disabled:cursor-wait disabled:opacity-70 disabled:hover:translate-y-0"
    >
      {pending ? (
        <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
      ) : (
        icon
      )}
      {pending ? "Connecting securely…" : label}
    </button>
  );
}
