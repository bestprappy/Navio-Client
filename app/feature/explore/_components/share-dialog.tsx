"use client";

import type { ReactNode, RefObject } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { Plan } from "./data";

type ShareDialogContextValue = {
  open: boolean;
  plan: Plan | null;
  onClose: () => void;
  closeButtonRef: RefObject<HTMLButtonElement | null>;
};

const ShareDialogContext = createContext<ShareDialogContextValue | null>(null);

function useShareDialogContext() {
  const context = useContext(ShareDialogContext);
  if (!context) {
    throw new Error("ShareDialog components must be used within Root.");
  }
  return context;
}

type ShareDialogRootProps = {
  open: boolean;
  plan: Plan | null;
  onClose: () => void;
  children: ReactNode;
};

function ShareDialogRoot({
  open,
  plan,
  onClose,
  children,
}: ShareDialogRootProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const value = useMemo(
    () => ({ open, plan, onClose, closeButtonRef }),
    [open, plan, onClose],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <ShareDialogContext.Provider value={value}>
      {children}
    </ShareDialogContext.Provider>
  );
}

function ShareDialogOverlay() {
  const { onClose } = useShareDialogContext();

  return (
    <div
      className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
      role="presentation"
      onClick={onClose}
    />
  );
}

function ShareDialogContent({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="w-full max-w-xl rounded-3xl border border-border bg-card p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Share this plan"
      >
        {children}
      </div>
    </div>
  );
}

function ShareDialogHeader() {
  const { onClose, closeButtonRef } = useShareDialogContext();

  return (
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold text-foreground">Share this plan</h2>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close share dialog"
        ref={closeButtonRef}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-lg text-muted-foreground transition hover:text-foreground cursor-pointer"
      >
        x
      </button>
    </div>
  );
}

function ShareDialogPreview() {
  const { plan } = useShareDialogContext();

  if (!plan) {
    return null;
  }

  return (
    <div
      className="mt-4 h-40 w-full rounded-2xl bg-cover bg-center"
      style={{ backgroundImage: `url(${plan.imageUrl})` }}
      aria-label={plan.title}
    />
  );
}

function ShareDialogLink() {
  const { plan } = useShareDialogContext();
  const [copied, setCopied] = useState(false);

  const planUrl = plan
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/explore/view/${plan.id}`
    : "";

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(planUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("ShareDialog copy", error);
    }
  }, [planUrl]);

  return (
    <div className="mt-4 flex items-center gap-3 rounded-2xl border border-border bg-muted/40 p-3">
      <span className="flex-1 truncate text-sm text-muted-foreground">
        {planUrl || "Share link will appear here"}
      </span>
      <button
        type="button"
        onClick={handleCopy}
        className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground cursor-pointer"
      >
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}

function ShareDialogInvite() {
  return (
    <div className="mt-3 rounded-2xl border border-border bg-muted/30 px-3 py-2">
      <input
        type="text"
        placeholder="Invite by email or user"
        className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
      />
    </div>
  );
}

function ShareDialogActions() {
  return (
    <div className="mt-4 flex items-center justify-center gap-6 text-xs text-muted-foreground">
      <button
        type="button"
        className="font-medium hover:text-foreground cursor-pointer"
      >
        Facebook
      </button>
      <button
        type="button"
        className="font-medium hover:text-foreground cursor-pointer"
      >
        X (Twitter)
      </button>
      <button
        type="button"
        className="font-medium hover:text-foreground cursor-pointer"
      >
        Copy ID
      </button>
    </div>
  );
}

export const ShareDialog = Object.assign(ShareDialogRoot, {
  Root: ShareDialogRoot,
  Overlay: ShareDialogOverlay,
  Content: ShareDialogContent,
  Header: ShareDialogHeader,
  Preview: ShareDialogPreview,
  Link: ShareDialogLink,
  Invite: ShareDialogInvite,
  Actions: ShareDialogActions,
});
