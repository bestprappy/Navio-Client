"use client";

import { useAtom } from "jotai";
import { activeSidebarItem } from "../app/configs/constant";

const useSidebar = () => {
  const [activeSidebar, setActiveSidebar] = useAtom(activeSidebarItem);

  return { activeSidebar, setActiveSidebar };
};

export default useSidebar;
