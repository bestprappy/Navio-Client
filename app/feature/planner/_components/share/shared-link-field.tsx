"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";

type CopyState = "idle" | "copied" | "failed";

/**
 * The published URL, selectable, with a copy button.
 *
 * <p>The URL is always rendered as real selectable text rather than hidden behind
 * the button: `navigator.clipboard` is unavailable on insecure origins and can be
 * refused by permissions, and an owner who cannot copy must still be able to read
 * and select their link.
 */
export function SharedLinkField({ url }: { url: string }) {
  const [copyState, setCopyState] = useState<CopyState>("idle");

  useEffect(() => {
    if (copyState === "idle") return;
    const timeoutId = window.setTimeout(() => setCopyState("idle"), 2_500);
    return () => window.clearTimeout(timeoutId);
  }, [copyState]);

  async function handleCopy() {
    try {
      if (!navigator.clipboard) throw new Error("Clipboard is unavailable.");
      await navigator.clipboard.writeText(url);
      setCopyState("copied");
    } catch (error) {
      console.error("Shared link could not be copied.", {
        component: "SharedLinkField",
        operation: "copyToClipboard",
        error: error instanceof Error ? error.message : "Unknown clipboard error",
      });
      setCopyState("failed");
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-2">
        <code className="min-w-0 flex-1 truncate px-1 text-sm text-foreground select-all">{url}</code>
        <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={handleCopy}>
          {copyState === "copied" ? (
            <Check className="size-4" aria-hidden="true" />
          ) : (
            <Copy className="size-4" aria-hidden="true" />
          )}
          {copyState === "copied" ? "Copied" : "Copy link"}
        </Button>
      </div>
      {/* Polite, not assertive: this confirms an action the owner just took. */}
      <p role="status" aria-live="polite" className="min-h-5 text-sm text-muted-foreground">
        {copyState === "copied" && "Link copied to your clipboard."}
        {copyState === "failed" && "Your browser blocked copying. Select the link above to copy it."}
      </p>
    </div>
  );
}
