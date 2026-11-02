"use client";

import type { ReactElement } from "react";
import { toast } from "sonner";

import { PausableToast } from "./pausable-toast";
import { ToastCard, type ToastCardProps, type ToastTone } from "./toast-card";

type ToastTiming = {
  /** Reusing an id replaces that toast instead of stacking another. */
  id?: string | number;
  /** Milliseconds on screen; hover, keyboard focus and a hidden tab pause it. */
  duration?: number;
};

export type NotifyOptions = Omit<ToastCardProps, "tone" | "onDismiss"> & ToastTiming;

/** Problems and things from other people stay longer than confirmations. */
const DEFAULT_DURATIONS: Record<ToastTone, number> = {
  notification: 8000,
  error: 8000,
  warning: 6000,
  info: 5000,
  success: 4000,
};

/** `PausableToast` does the timing, so Sonner's own timer stays off. */
function present(content: (dismiss: () => void) => ReactElement, id: ToastTiming["id"], lifetime: number) {
  return toast.custom(
    (toastId) => {
      const dismiss = () => toast.dismiss(toastId);
      return <PausableToast lifetime={lifetime} onExpire={dismiss}>{content(dismiss)}</PausableToast>;
    },
    { id, duration: Number.POSITIVE_INFINITY },
  );
}

function show(tone: ToastTone, { id, duration, ...card }: NotifyOptions) {
  return present((dismiss) => <ToastCard tone={tone} {...card} onDismiss={dismiss} />, id, duration ?? DEFAULT_DURATIONS[tone]);
}

/**
 * The app's one way to show a toast, from anywhere on the client:
 *
 *   notify.success({ title: "Plan saved" });
 *   notify.error({ title: "Plan not saved", description: "Check your connection.", action: { label: "Try again", onClick: save } });
 *
 * Renders in the bottom-right through the `<Toaster />` in the root layout.
 */
export const notify = {
  notification: (options: NotifyOptions) => show("notification", options),
  error: (options: NotifyOptions) => show("error", options),
  warning: (options: NotifyOptions) => show("warning", options),
  success: (options: NotifyOptions) => show("success", options),
  info: (options: NotifyOptions) => show("info", options),
  /** For a toast whose content needs hooks. Render a `ToastCard` and pass `dismiss` as its `onDismiss`. */
  render: (content: (dismiss: () => void) => ReactElement, { id, duration }: ToastTiming = {}) =>
    present(content, id, duration ?? DEFAULT_DURATIONS.notification),
  dismiss: (id?: string | number) => toast.dismiss(id),
};
