"use client";

import { useId, useState } from "react";
import { Ban, Info, ShieldCheck, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";

import { staffRoles, type AdminUserDetail, type ModerationAction, type ModerationResult } from "./admin-api";
import { formatAdminDate, formatAdminDateTime } from "./admin-format";
import { AdminErrorState, AdminLoadingRows } from "./admin-query-state";
import { useAdminUser } from "./admin-queries";
import { ModerationDialog } from "./moderation-dialog";
import { ModerationHistory } from "./moderation-history";
import { StaffRoleTags } from "./staff-role-tags";
import { UserStatusLabel } from "./user-status-label";

type AdminUserDrawerProps = {
  userId: string | null;
  viewerIsAdmin: boolean;
  onClose: () => void;
};

/**
 * Account context and moderation for one user, as a side sheet.
 *
 * Open state is the `user` URL parameter, owned by the caller, so a drawer can
 * be linked to and survives a refresh.
 */
export function AdminUserDrawer({ userId, viewerIsAdmin, onClose }: AdminUserDrawerProps) {
  const titleId = useId();

  return (
    <Sheet open={Boolean(userId)} onOpenChange={(open) => { if (!open) onClose(); }}>
        <SheetContent
          aria-labelledby={titleId}
          showCloseButton={false}
          className="gap-0 bg-card text-card-foreground outline-none data-[side=right]:w-full data-[side=right]:sm:max-w-md motion-reduce:transition-none"
        >
          <SheetDescription className="sr-only">Account details and moderation history.</SheetDescription>
          <div className="flex items-center justify-between border-b border-border px-6 py-3">
            <p className="text-sm font-medium text-muted-foreground">Account</p>
            <SheetClose render={<Button variant="ghost" size="icon-sm" aria-label="Close account details" />}>
              <XIcon aria-hidden="true" />
            </SheetClose>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
            {userId ? <DrawerBody key={userId} userId={userId} titleId={titleId} viewerIsAdmin={viewerIsAdmin} /> : null}
          </div>
        </SheetContent>
    </Sheet>
  );
}

type DrawerBodyProps = {
  userId: string;
  titleId: string;
  viewerIsAdmin: boolean;
};

function DrawerBody({ userId, titleId, viewerIsAdmin }: DrawerBodyProps) {
  const user = useAdminUser(userId);
  const historyHeadingId = useId();
  const [announcement, setAnnouncement] = useState("");

  if (user.isPending) {
    return (
      <>
        <SheetTitle id={titleId} className="sr-only">Loading account</SheetTitle>
        <AdminLoadingRows rows={4} label="Loading account" />
      </>
    );
  }
  if (user.isError) {
    return (
      <>
        <SheetTitle id={titleId} className="mb-4 text-lg font-semibold">Account unavailable</SheetTitle>
        <AdminErrorState error={user.error} onRetry={() => user.refetch()} isRetrying={user.isFetching} />
      </>
    );
  }

  const account = user.data;
  // Announced from the server's answer, not the button pressed.
  const handleCompleted = (result: ModerationResult) => {
    setAnnouncement(result.status === "suspended"
      ? `${account.displayName} is banned.`
      : `${account.displayName} is unbanned.`);
  };

  return (
    <div className="flex flex-col gap-8">
      <p role="status" aria-live="polite" className="sr-only">{announcement}</p>

      <AccountStanding account={account} titleId={titleId} />

      <ModerationControl account={account} viewerIsAdmin={viewerIsAdmin} onCompleted={handleCompleted} />

      <section aria-labelledby={`${titleId}-details`} className="flex flex-col gap-3">
        <h3 id={`${titleId}-details`} className="text-sm font-semibold">Details</h3>
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Roles</dt>
          <dd className="flex flex-col gap-1">
            <StaffRoleTags roles={account.roles} />
            {!account.rolesVerified ? (
              <span className="text-xs text-muted-foreground">
                The sign-in service did not respond, so these are the last roles Navio recorded.
              </span>
            ) : null}
          </dd>
          <dt className="text-muted-foreground">Joined</dt>
          <dd><time dateTime={account.createdAt}>{formatAdminDate(account.createdAt)}</time></dd>
          <dt className="text-muted-foreground">Last changed</dt>
          <dd><time dateTime={account.updatedAt}>{formatAdminDateTime(account.updatedAt)}</time></dd>
          {account.deletedAt ? (
            <>
              <dt className="text-muted-foreground">Deleted</dt>
              <dd><time dateTime={account.deletedAt}>{formatAdminDateTime(account.deletedAt)}</time></dd>
            </>
          ) : null}
        </dl>
      </section>

      <section aria-labelledby={historyHeadingId} className="flex flex-col gap-3">
        <h3 id={historyHeadingId} className="text-sm font-semibold">History</h3>
        <ModerationHistory userId={account.id} headingId={historyHeadingId} />
      </section>
    </div>
  );
}

/** Name, status in words, and — when banned — who banned them and why. */
function AccountStanding({ account, titleId }: { account: AdminUserDetail; titleId: string }) {
  const suspension = account.activeSuspension;
  return (
    <header className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <SheetTitle id={titleId} className="text-xl font-semibold leading-tight text-balance">
          {account.displayName}
        </SheetTitle>
        <p className="break-all text-sm text-muted-foreground">{account.email}</p>
      </div>
      <UserStatusLabel status={account.status} className="text-base" />
      {suspension ? (
        <div className="flex flex-col gap-1 rounded-lg border-l-4 border-destructive bg-destructive/5 px-4 py-3 text-sm">
          <p>
            Banned {formatAdminDate(suspension.startsAt)} by{" "}
            <span className="font-medium">{suspension.bannedByDisplayName ?? "a former staff member"}</span>
            {suspension.endsAt ? `, until ${formatAdminDateTime(suspension.endsAt)}` : ", with no end date"}.
          </p>
          <p className="text-foreground/90">&ldquo;{suspension.reason}&rdquo;</p>
        </div>
      ) : null}
    </header>
  );
}

type ModerationControlProps = {
  account: AdminUserDetail;
  viewerIsAdmin: boolean;
  onCompleted: (result: ModerationResult) => void;
};

function ModerationControl({ account, viewerIsAdmin, onCompleted }: ModerationControlProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  // Refetches can change account.status while the write is still settling.
  // Keep the confirmed action stable until its dialog has closed.
  const [dialogAction, setDialogAction] = useState<ModerationAction>("ban");

  if (account.status === "deleted") {
    return <Notice>This account was deleted, so it cannot be banned or unbanned.</Notice>;
  }
  // Mirrors the backend rule so a moderator is told up front rather than
  // refused after writing a reason. The backend still enforces it.
  if (staffRoles(account.roles).length > 0 && !viewerIsAdmin) {
    return <Notice>Only an administrator can ban or unban a staff account.</Notice>;
  }

  const action: ModerationAction = account.status === "suspended" ? "unban" : "ban";
  return (
    <div>
      <Button
        variant={action === "ban" ? "destructive" : "outline"}
        size="lg"
        className="w-full sm:w-auto"
        onClick={() => {
          setDialogAction(action);
          setDialogOpen(true);
        }}
      >
        {action === "ban" ? <Ban aria-hidden="true" /> : <ShieldCheck aria-hidden="true" />}
        {action === "ban" ? "Ban account" : "Unban account"}
      </Button>
      <ModerationDialog
        action={dialogAction}
        user={account}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCompleted={onCompleted}
      />
    </div>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2 rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      {children}
    </p>
  );
}
