import { atom } from "jotai";

export const activeSidebarItem = atom<string>("/");
export const sidebarCollapsedAtom = atom<boolean>(false);
