"use client";

import { memo } from "react";

import { type AdminUserSummary } from "./admin-api";
import { formatAdminDate } from "./admin-format";
import { StaffRoleTags } from "./staff-role-tags";
import { UserStatusLabel } from "./user-status-label";

type AdminUsersTableProps = {
  users: AdminUserSummary[];
  selectedUserId: string | null;
  onOpenUser: (userId: string) => void;
  caption: string;
};

/**
 * Accounts as a table. The name is the row's button, so the table stays a
 * table for screen readers and keyboard users reach each account with Tab.
 * The role remains visible on narrow screens; status and join date move into
 * the account drawer when space is tight.
 */
export const AdminUsersTable = memo(function AdminUsersTable({
  users,
  selectedUserId,
  onOpenUser,
  caption,
}: AdminUsersTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
    <table className="w-full table-fixed border-collapse text-left text-sm">
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
          <th scope="col" className="w-[62%] px-4 py-3 font-medium md:w-[42%]">Account</th>
          <th scope="col" className="w-[38%] px-3 py-3 font-medium md:w-[22%]">Role</th>
          <th scope="col" className="hidden w-[17%] px-3 py-3 font-medium md:table-cell">Status</th>
          <th scope="col" className="hidden w-[19%] px-3 py-3 font-medium md:table-cell">Joined</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => {
          const selected = user.id === selectedUserId;
          return (
            <tr
              key={user.id}
              data-selected={selected || undefined}
              onClick={() => onOpenUser(user.id)}
              className="cursor-pointer border-b border-border/70 last:border-b-0 hover:bg-muted/60 data-selected:bg-sidebar-accent"
            >
              <td className="min-w-0 px-4 py-3">
                <button
                  type="button"
                  aria-haspopup="dialog"
                  aria-current={selected || undefined}
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpenUser(user.id);
                  }}
                  className="flex w-full min-w-0 flex-col items-start rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="w-full truncate font-medium text-foreground">{user.displayName}</span>
                  <span className="w-full truncate text-xs text-muted-foreground">{user.email}</span>
                </button>
              </td>
              <td className="px-3 py-3"><StaffRoleTags roles={user.roles} /></td>
              <td className="hidden px-3 py-3 md:table-cell"><UserStatusLabel status={user.status} /></td>
              <td className="hidden px-3 py-3 text-muted-foreground md:table-cell">
                <time dateTime={user.createdAt}>{formatAdminDate(user.createdAt)}</time>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
    </div>
  );
});
