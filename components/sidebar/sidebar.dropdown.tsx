"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

type SidebarDropdownProps = {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  icon?: ReactNode;
  isActive?: boolean;
};

export default function SidebarDropdown({
  children,
  defaultOpen = false,
  icon,
  isActive = false,
  title,
}: SidebarDropdownProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        className={cn(
          "group flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring/30",
          isActive
            ? "bg-secondary text-secondary-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        {icon ? (
          <span className="flex size-5 items-center justify-center text-muted-foreground group-hover:text-foreground">
            {icon}
          </span>
        ) : null}
        <span className="min-w-0 flex-1 truncate text-left">{title}</span>
        <ChevronDown
          className={cn(
            "size-4 text-muted-foreground transition-transform group-hover:text-foreground",
            isOpen && "rotate-180",
          )}
        />
      </button>

      <div
        className={cn(
          "grid transition-all duration-200",
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <div className="ml-5 mt-1 flex flex-col gap-1 border-l border-border pl-3">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
