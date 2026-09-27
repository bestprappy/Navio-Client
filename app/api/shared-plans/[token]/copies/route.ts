import { NextRequest } from "next/server";

import { proxyAuthenticatedApiRequest } from "@/app/api/_lib/authenticated-api-proxy";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ token: string }> },
): Promise<Response> {
  const { token } = await context.params;
  return proxyAuthenticatedApiRequest(
    request,
    `/v1/shared-plans/${encodeURIComponent(token)}/copies`,
  );
}
