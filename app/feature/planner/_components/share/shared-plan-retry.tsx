"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function SharedPlanRetry() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-6">
      <h1 className="text-xl font-semibold">This plan could not be loaded</h1>
      <p className="text-sm text-muted-foreground">Navio could not reach the shared plan. Try loading it again.</p>
      <div className="flex gap-2">
        <Button disabled={pending} onClick={() => startTransition(() => router.refresh())}>{pending ? "Loading plan…" : "Try again"}</Button>
        <Button nativeButton={false} role="link" variant="outline" render={<Link href="/" />}>Go to Navio</Button>
      </div>
    </main>
  );
}
