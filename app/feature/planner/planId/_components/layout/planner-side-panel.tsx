"use client";

import type { CSSProperties, ReactNode } from "react";
import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import styles from "./planner-workspace.module.css";
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

const evDrawerWidthAtom = atomWithStorage("navio:ev-drawer-width", 30);
const clampWidth = (value: number) => Math.max(24, Math.min(55, Number.isFinite(value) ? value : 30));

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
  resizable?: boolean;
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
  resizable = false,
}: PlannerSidePanelRootProps) {
  const [width, setWidth] = useAtom(evDrawerWidthAtom);
  const percent = clampWidth(width);
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
        data-resizable={resizable || undefined}
        style={resizable ? { "--details-width": `${percent}%` } as CSSProperties : undefined}
        className={cn(
          "absolute inset-y-0 right-0 z-30 flex h-full w-full max-w-md min-w-0 flex-col border-l border-border bg-background text-foreground shadow-2xl outline-none animate-in slide-in-from-right-6 duration-200",
          className,
        )}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.stopPropagation();
            onBack();
          }
        }}
      >
        {resizable && <div role="separator" tabIndex={0} aria-label="Resize EV drawer" aria-orientation="vertical" aria-valuemin={24} aria-valuemax={55} aria-valuenow={Math.round(percent)} className={styles.detailsDivider}
          onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); event.preventDefault(); }}
          onPointerMove={(event) => { if (!event.currentTarget.hasPointerCapture(event.pointerId)) return; const rect = panelRef.current?.parentElement?.getBoundingClientRect(); if (rect) setWidth(clampWidth((rect.right - event.clientX) / rect.width * 100)); }}
          onPointerUp={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}
          onDoubleClick={() => setWidth(30)}
          onKeyDown={(event) => { if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); setWidth(clampWidth(percent + (event.key === "ArrowLeft" ? 2 : -2))); } else if (event.key === "Home" || event.key === "End") { event.preventDefault(); setWidth(event.key === "Home" ? 24 : 55); } }}
        ><span /></div>}
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
