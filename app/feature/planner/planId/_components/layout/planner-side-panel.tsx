"use client";

import type { ReactNode } from "react";
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
} from "react";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PlannerSidePanelContextValue = {
  title: ReactNode;
  titleId: string;
  onBack: () => void;
};

const PlannerSidePanelContext =
  createContext<PlannerSidePanelContextValue | null>(null);

function usePlannerSidePanelContext() {
  const context = useContext(PlannerSidePanelContext);

  if (!context) {
    throw new Error(
      "PlannerSidePanel compound components must be rendered inside PlannerSidePanel.Root.",
    );
  }

  return context;
}

type PlannerSidePanelRootProps = {
  open: boolean;
  title: ReactNode;
  ariaLabel: string;
  children: ReactNode;
  onBack: () => void;
  className?: string;
};

function getFirstFocusableElement(panel: HTMLElement): HTMLElement | null {
  return panel.querySelector<HTMLElement>(
    [
      "button:not([disabled])",
      "[href]",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      "[tabindex]:not([tabindex='-1'])",
    ].join(","),
  );
}

function PlannerSidePanelRoot({
  open,
  title,
  ariaLabel,
  children,
  onBack,
  className,
}: PlannerSidePanelRootProps) {
  const panelRef = useRef<HTMLElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const contextValue = useMemo<PlannerSidePanelContextValue>(
    () => ({ title, titleId, onBack }),
    [onBack, title, titleId],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    returnFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const focusFrame = window.requestAnimationFrame(() => {
      if (!panelRef.current) {
        return;
      }

      getFirstFocusableElement(panelRef.current)?.focus();
    });

    return () => {
      window.cancelAnimationFrame(focusFrame);

      if (returnFocusRef.current?.isConnected) {
        returnFocusRef.current.focus({ preventScroll: true });
      }
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <PlannerSidePanelContext.Provider value={contextValue}>
      <aside
        ref={panelRef}
        aria-label={ariaLabel}
        aria-labelledby={titleId}
        className={cn(
          "flex h-full w-[30%] min-w-0 flex-col border-l border-border bg-background text-foreground shadow-2xl outline-none animate-in slide-in-from-right-6 duration-200",
          className,
        )}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.stopPropagation();
            onBack();
          }
        }}
      >
        {children}
      </aside>
    </PlannerSidePanelContext.Provider>
  );
}

type PlannerSidePanelHeaderProps = {
  children?: ReactNode;
  className?: string;
};

function PlannerSidePanelHeader({
  children,
  className,
}: PlannerSidePanelHeaderProps) {
  const { title, titleId, onBack } = usePlannerSidePanelContext();

  return (
    <header
      className={cn(
        "flex min-h-14 items-center gap-3 border-b border-border bg-card px-4 py-3",
        className,
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="shrink-0 rounded-sm"
        aria-label="Back to planner"
        onClick={onBack}
      >
        <ArrowLeft className="size-5" aria-hidden="true" />
      </Button>

      <h2
        id={titleId}
        className="min-w-0 flex-1 truncate text-lg font-bold leading-tight text-foreground"
      >
        {title}
      </h2>

      {children}
    </header>
  );
}

type PlannerSidePanelBodyProps = {
  children: ReactNode;
  className?: string;
};

function PlannerSidePanelBody({
  children,
  className,
}: PlannerSidePanelBodyProps) {
  return (
    <div
      className={cn(
        "scrollbar-hide min-h-0 flex-1 overflow-y-auto",
        className,
      )}
    >
      {children}
    </div>
  );
}

type PlannerSidePanelFooterProps = {
  children: ReactNode;
  className?: string;
};

function PlannerSidePanelFooter({
  children,
  className,
}: PlannerSidePanelFooterProps) {
  return (
    <footer className={cn("border-t border-border bg-background", className)}>
      {children}
    </footer>
  );
}

export const PlannerSidePanel = Object.assign(PlannerSidePanelRoot, {
  Root: PlannerSidePanelRoot,
  Header: PlannerSidePanelHeader,
  Body: PlannerSidePanelBody,
  Footer: PlannerSidePanelFooter,
});
