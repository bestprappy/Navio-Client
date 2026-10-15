import type { ReactNode } from "react";

/** A server-rendered shell; only the interactive reader needs a client boundary. */
export function PlaceReaderViewport({
  navigation,
  children,
}: {
  navigation: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden">
      <div className="max-h-[70dvh] shrink-0 overflow-y-auto">{navigation}</div>
      <main className="flex min-h-0 flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
