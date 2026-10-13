"use client";

import { useMemo } from "react";
import { useSession } from "next-auth/react";
import { createStore, Provider } from "jotai";
import { GuideEditor } from "../admin/_components/guides/editor/guide-editor";
import { userGuideWorkspace } from "./user-guides-api";
import { Skeleton } from "@/components/ui/skeleton";

/** Draft state and editor selection belong to this account and guide, not the admin editor. */
export function UserGuideEditor({ guideId }: { guideId: string }) {
  const { data: session } = useSession();
  if (!session?.user?.id || session.error)
    return (
      <Skeleton
        role="status"
        aria-label="Loading your guide"
        className="h-full w-full"
      />
    );
  return (
    <AccountEditor
      key={`${session?.user?.id}:${guideId}`}
      userId={session?.user?.id ?? ""}
      guideId={guideId}
    />
  );
}
function AccountEditor({
  userId,
  guideId,
}: {
  userId: string;
  guideId: string;
}) {
  const store = useMemo(() => createStore(), []);
  const workspace = useMemo(() => userGuideWorkspace(userId), [userId]);
  return (
    <Provider store={store}>
      <GuideEditor guideId={guideId} workspace={workspace} />
    </Provider>
  );
}
