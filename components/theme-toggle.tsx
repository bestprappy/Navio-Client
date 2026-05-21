"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  showLabel?: boolean;
  className?: string;
}

export function ThemeToggle({ showLabel = false, className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setMounted(true), 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "relative inline-flex shrink-0 items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        className,
      )}
    >
      <span className="relative size-4 shrink-0">
        <Sun
          className="absolute inset-0 size-4 rotate-0 scale-100 transition-all duration-200 dark:-rotate-90 dark:scale-0"
          aria-hidden="true"
        />
        <Moon
          className="absolute inset-0 size-4 rotate-90 scale-0 transition-all duration-200 dark:rotate-0 dark:scale-100"
          aria-hidden="true"
        />
      </span>

      {showLabel && (
        <span>{isDark ? "Light mode" : "Dark mode"}</span>
      )}
    </button>
  );
}
