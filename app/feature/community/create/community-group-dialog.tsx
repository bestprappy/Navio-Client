"use client";

import { useSetAtom } from "jotai";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { cn } from "@/lib/utils";
import { createCommunityOpenAtom } from "../_components/community-atoms";

/** Opens the create-community wizard mounted in the community layout. */
export function CommunityGroupDialog({
  variant = "default",
  className,
}: {
  variant?: "default" | "outline";
  className?: string;
}) {
  const openCreate = useSetAtom(createCommunityOpenAtom);
  const { requireAuth, isAuthenticationLoading } = useRequireAuth();
  return (
    <Button
      variant={variant}
      disabled={isAuthenticationLoading}
      onClick={() => requireAuth(() => openCreate(true))}
      className={cn("rounded-full font-bold", className)}
    >
      <Plus aria-hidden="true" />
      Create a community
    </Button>
  );
}
