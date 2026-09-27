"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

import {
  AdminApiError, moderationReasonSchema, REASON_MAX_LENGTH, roleLabel,
  type AdminUserDetail,
} from "./admin-api";
import { useChangeUserRole } from "./admin-queries";

type ManagedRole = "MODERATOR" | "ADMIN";
type RoleAction = { role: ManagedRole; kind: "grant" | "revoke" };

export function RoleManagementPanel({ account, viewerIsOwner }: {
  account: AdminUserDetail;
  viewerIsOwner: boolean;
}) {
  const [action, setAction] = useState<RoleAction | null>(null);
  const [reason, setReason] = useState("");
  const [validationError, setValidationError] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const changeRole = useChangeUserRole();

  if (account.status === "deleted" || account.roles.includes("OWNER")) return null;

  const roles: ManagedRole[] = viewerIsOwner ? ["ADMIN", "MODERATOR"] : ["MODERATOR"];
  const title = action
    ? `${action.kind === "grant" ? "Grant" : "Remove"} ${roleLabel(action.role).toLowerCase()} role?`
    : "Change role";

  function submit() {
    if (!action) return;
    const parsed = moderationReasonSchema.safeParse(reason);
    if (!parsed.success) {
      setValidationError(parsed.error.issues[0]?.message ?? "Enter a reason.");
      return;
    }
    setValidationError("");
    changeRole.mutate({ userId: account.id, role: action.role, action: action.kind, reason: parsed.data }, {
      onSuccess: () => {
        setAnnouncement(`${roleLabel(action.role)} role ${action.kind === "grant" ? "granted" : "removed"} for ${account.displayName}.`);
        setAction(null);
      },
    });
  }

  return (
    <section className="flex flex-col gap-3" aria-label="Manage roles">
      <p role="status" aria-live="polite" className="sr-only">{announcement}</p>
      <h3 className="text-sm font-semibold">Manage roles</h3>
      {!account.rolesVerified ? (
        <p className="text-sm text-muted-foreground">Role changes are unavailable until the sign-in service confirms this account&apos;s roles.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {roles.map((role) => {
            const kind = account.roles.includes(role) ? "revoke" : "grant";
            return (
              <Button key={role} type="button" variant="outline" size="sm" onClick={() => {
                setReason("");
                setValidationError("");
                changeRole.reset();
                setAction({ role, kind });
              }}>
                {kind === "grant" ? `Grant ${roleLabel(role).toLowerCase()}` : `Remove ${roleLabel(role).toLowerCase()}`}
              </Button>
            );
          })}
        </div>
      )}
      <Dialog open={Boolean(action)} onOpenChange={(open) => { if (!open && !changeRole.isPending) setAction(null); }}>
        <DialogContent showCloseButton={!changeRole.isPending} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              {action?.kind === "grant"
                ? `${account.displayName} will receive the ${action ? roleLabel(action.role).toLowerCase() : "selected"} role. They may need to sign in again to see it.`
                : `${account.displayName} will lose this role. Existing access tokens may remain valid briefly.`}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <label htmlFor="role-change-reason" className="text-sm font-medium">Reason</label>
            <Textarea id="role-change-reason" value={reason} onChange={(event) => setReason(event.target.value)}
              maxLength={REASON_MAX_LENGTH} rows={3} autoFocus disabled={changeRole.isPending}
              aria-invalid={Boolean(validationError)} aria-describedby={validationError ? "role-change-error" : undefined} />
            {validationError ? <p id="role-change-error" className="text-sm text-destructive">{validationError}</p> : null}
          </div>
          {changeRole.error ? (
            <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {changeRole.error instanceof AdminApiError ? changeRole.error.message : "Navio did not confirm the role change. Refresh the account before trying again."}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" disabled={changeRole.isPending} onClick={() => setAction(null)}>Cancel</Button>
            <Button type="button" disabled={changeRole.isPending} onClick={submit}>
              {changeRole.isPending ? "Saving…" : action?.kind === "grant" ? "Grant role" : "Remove role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
