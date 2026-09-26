import type { Metadata } from "next";
import { Suspense } from "react";

import { readAuth } from "@/auth";
import { isAdministrator } from "@/lib/navio-roles";

import { AdminPageHeader } from "../../feature/admin/_components/admin-page-header";
import { AdminLoadingRows } from "../../feature/admin/_components/admin-query-state";
import { AdminUsersWorkspace } from "../../feature/admin/_components/admin-users-workspace";

export const metadata: Metadata = {
  title: "Users - Admin - Navio",
};

export default async function AdminUsersPage() {
  const session = await readAuth();
  return (
    <AdminPageHeader title="Users" description="Look up an account, see its history, and ban or unban it.">
      {/* useSearchParams needs a Suspense boundary to render on the server. */}
      <Suspense fallback={<AdminLoadingRows rows={6} label="Loading accounts" />}>
        <AdminUsersWorkspace viewerIsAdmin={isAdministrator(session?.user?.roles)} />
      </Suspense>
    </AdminPageHeader>
  );
}
