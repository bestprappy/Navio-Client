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
 * Role and join date step aside on narrow screens rather than scrolling.
 */
export const AdminUsersTable = memo(function AdminUsersTable({
  users,
  selectedUserId,
  onOpenUser,
  caption,
}: AdminUsersTableProps) {
  return (
    <table className="w-full table-fixed border-collapse text-left text-sm">
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr className="border-b border-border text-xs text-muted-foreground">
          <th scope="col" className="py-2 pr-4 font-medium">Account</th>
          <th scope="col" className="hidden w-40 py-2 pr-4 font-medium md:table-cell">Role</th>
          <th scope="col" className="w-28 py-2 pr-4 font-medium">Status</th>
          <th scope="col" className="hidden w-32 py-2 font-medium sm:table-cell">Joined</th>
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
              className="cursor-pointer border-b border-border/70 transition-colors last:border-b-0 hover:bg-muted/60 data-selected:bg-sidebar-accent"
            >
              <td className="min-w-0 py-2.5 pr-4">
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
              <td className="hidden py-2.5 pr-4 md:table-cell"><StaffRoleTags roles={user.roles} /></td>
              <td className="py-2.5 pr-4"><UserStatusLabel status={user.status} /></td>
              <td className="hidden py-2.5 text-muted-foreground sm:table-cell">
                <time dateTime={user.createdAt}>{formatAdminDate(user.createdAt)}</time>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
});
