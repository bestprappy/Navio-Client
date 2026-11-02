"use client";

import Link from "next/link";
import { cva } from "class-variance-authority";
import { Bell, CircleAlert, CircleCheck, ExternalLink, Info, TriangleAlert, X, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ToastTone = "notification" | "error" | "warning" | "success" | "info";

export type ToastAction = {
  label: string;
  onClick: () => void;
};

export type ToastCardProps = {
  tone: ToastTone;
  title: string;
  description?: string | null;
  /** Replaces the tone's icon, for example with the avatar of who the toast is about. */
  media?: ReactNode;
  /** Makes the toast's content a link. Opening it also dismisses the toast. */
  href?: string | null;
  /** Opens `href` in a new tab, for pages where leaving could lose unsaved work. */
  newTab?: boolean;
  onOpen?: () => void;
  /** One follow-up, such as "Try again". Using it also dismisses the toast. */
  action?: ToastAction;
  onDismiss: () => void;
};

/** The tone sets one accent; the border, tint and icon disc all derive from it, so a new tone is one line. */
const toastCardVariants = cva(
  "flex w-(--width) max-w-full items-center gap-2 rounded-2xl border border-(--toast-accent) bg-[color-mix(in_oklab,var(--toast-accent)_14%,var(--popover))] py-3 pr-2 pl-3.5 text-popover-foreground shadow-lg",
  {
    variants: {
      tone: {
        notification: "[--toast-accent:var(--notification)] [--toast-on-accent:var(--notification-foreground)]",
        error: "[--toast-accent:var(--destructive)] [--toast-on-accent:var(--destructive-foreground)]",
        warning: "[--toast-accent:var(--warning)] [--toast-on-accent:var(--warning-foreground)]",
        success: "[--toast-accent:var(--success)] [--toast-on-accent:var(--success-foreground)]",
        info: "[--toast-accent:var(--info)] [--toast-on-accent:var(--info-foreground)]",
      },
    },
  },
);

const TONE_ICONS: Record<ToastTone, LucideIcon> = {
  notification: Bell,
  error: CircleAlert,
  warning: TriangleAlert,
  success: CircleCheck,
  info: Info,
};

/** One toast. Status is carried by the icon and the wording as well as the colour. */
export function ToastCard({ tone, title, description, media, href, newTab = false, onOpen, action, onDismiss }: ToastCardProps) {
  const Icon = TONE_ICONS[tone];

  const content = (
    <>
      {media ?? (
        <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-(--toast-accent) text-(--toast-on-accent)">
          <Icon className="size-4.5" />
        </span>
      )}
      <span className="min-w-0 flex-1 break-words">
        <span className="block text-sm font-semibold text-foreground">{title}</span>
        {description ? <span className="mt-0.5 line-clamp-2 block text-sm text-muted-foreground">{description}</span> : null}
        {href && newTab ? <span className="sr-only">(opens in a new tab)</span> : null}
      </span>
      {href && newTab ? <ExternalLink aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" /> : null}
    </>
  );
  const contentClassName = "flex min-w-0 flex-1 items-center gap-3 text-left";
  const linkClassName = cn(contentClassName, "rounded-xl hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50");
  const open = () => {
    onOpen?.();
    onDismiss();
  };

  return (
    <div role={tone === "error" ? "alert" : "status"} data-tone={tone} className={toastCardVariants({ tone })}>
      {href && newTab ? (
        <a href={href} target="_blank" rel="noopener" onClick={open} className={linkClassName}>
          {content}
        </a>
      ) : href ? (
        <Link href={href} onClick={open} className={linkClassName}>
          {content}
        </Link>
      ) : (
        <div className={contentClassName}>{content}</div>
      )}
      {action ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="shrink-0 font-semibold hover:bg-foreground/10"
          onClick={() => {
            action.onClick();
            onDismiss();
          }}
        >
          {action.label}
        </Button>
      ) : null}
      <Button type="button" variant="ghost" size="icon-sm" aria-label="Dismiss" className="shrink-0 text-muted-foreground hover:bg-foreground/10" onClick={onDismiss}>
        <X aria-hidden="true" />
      </Button>
    </div>
  );
}
