"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

type BudgetModalShellProps = {
  title: string;
  children: ReactNode;
  leadingAction?: ReactNode;
  panelClassName?: string;
  onClose: () => void;
};

export function BudgetModalShell({
  title,
  children,
  leadingAction,
  panelClassName,
  onClose,
}: BudgetModalShellProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/55 px-4 py-8">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        aria-label="Close budget modal"
      />
      <div
        className={cn(
          "relative w-full max-w-md rounded-md bg-card p-7 text-card-foreground shadow-2xl",
          panelClassName,
        )}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="mb-5 grid grid-cols-[2rem_1fr_2rem] items-center">
          <div>{leadingAction}</div>
          <h3 className="text-center text-xl font-bold text-foreground">{title}</h3>
          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-border"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
