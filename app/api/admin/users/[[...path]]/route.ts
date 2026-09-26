import { NextResponse, type NextRequest } from "next/server";

import { proxyAuthenticatedApiRequest } from "@/app/api/_lib/authenticated-api-proxy";

import { isAllowedAdminUsersRoute } from "../admin-users-routes";

type AdminUsersProxyContext = {
  params: Promise<{ path?: string[] }>;
};

async function proxyAdminUsersRequest(
  request: NextRequest,
  context: AdminUsersProxyContext,
): Promise<Response> {
  const { path = [] } = await context.params;
  if (!isAllowedAdminUsersRoute(request.method, path)) {
    return NextResponse.json({ message: "Not found." }, { status: 404 });
  }
  const upstreamPath = path.length > 0 ? `/${path.map(encodeURIComponent).join("/")}` : "";
  return proxyAuthenticatedApiRequest(request, `/v1/admin/users${upstreamPath}`);
}

export const GET = proxyAdminUsersRequest;
export const POST = proxyAdminUsersRequest;
