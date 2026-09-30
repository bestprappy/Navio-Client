import Link from "next/link";
import { ShieldAlert } from "lucide-react";

import { buttonVariants } from "@/components/ui/button.variants";

/** Shown to a signed-in account without a staff role. */
export function AdminAccessDenied() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-start gap-4 px-6 py-16">
      <ShieldAlert className="size-8 text-muted-foreground" aria-hidden="true" />
      <h1 className="text-2xl font-semibold">This area is for Navio staff</h1>
      <p className="text-muted-foreground">
        Your account is not a moderator or administrator. If you were just given a staff role,
        sign out and back in so Navio picks it up.
      </p>
      <Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>
        Back to your trips
      </Link>
    </div>
  );
}
