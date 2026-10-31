import { atom } from "jotai";

import type { NotificationItem } from "@/lib/validations/social";

export type NotificationToast = { item: NotificationItem };

/** Transient toasts for notifications that arrived while this tab was open. */
export const notificationToastsAtom = atom<NotificationToast[]>([]);

/** Adds arrivals once each, keeping a bounded backlog behind the visible stack. */
export const pushNotificationToastsAtom = atom(null, (get, set, arrivals: NotificationItem[]) => {
  if (arrivals.length === 0) return;
  const current = get(notificationToastsAtom);
  const known = new Set(current.map((toast) => toast.item.id));
  const added = arrivals.filter((item) => !known.has(item.id)).map((item) => ({ item }));
  set(notificationToastsAtom, [...added, ...current].slice(0, 20));
});

export const dismissNotificationToastAtom = atom(null, (get, set, id: string) => {
  set(notificationToastsAtom, get(notificationToastsAtom).filter((toast) => toast.item.id !== id));
});

export const clearNotificationToastsAtom = atom(null, (_get, set) => {
  set(notificationToastsAtom, []);
});
