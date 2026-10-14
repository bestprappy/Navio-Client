"use client";

import { createContext, useContext } from "react";

export const PlannerScrollPanelContext = createContext("planner-scroll-panel");
export const usePlannerScrollPanelId = () => useContext(PlannerScrollPanelContext);
