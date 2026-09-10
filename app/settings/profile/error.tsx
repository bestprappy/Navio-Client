"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ProfileError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error("Profile settings could not render.", { component: "ProfileSettings", name: error.name });
  }, [error]);

  return (
    <main className="mx-auto max-w-xl px-6 py-16 text-center">
      <h1 className="text-xl font-semibold">Your profile could not be displayed</h1>
      <p className="mt-3 text-sm text-muted-foreground">Please try again. Your saved details will be kept.</p>
      <Button className="mt-6 h-11 px-5" onClick={reset}>Try again</Button>
    </main>
  );
}
