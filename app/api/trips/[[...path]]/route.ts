import { NextRequest } from "next/server";

import { proxyAuthenticatedApiRequest } from "@/app/api/_lib/authenticated-api-proxy";

type TripProxyContext = {
  params: Promise<{ path?: string[] }>;
};

async function proxyTripRequest(
  request: NextRequest,
  context: TripProxyContext,
): Promise<Response> {
  const { path = [] } = await context.params;
  const upstreamPath = path.length > 0 ? `/${path.map(encodeURIComponent).join("/")}` : "";
  return proxyAuthenticatedApiRequest(
    request,
    `/v1/trips${upstreamPath}`,
  );
}

export const GET = proxyTripRequest;
export const POST = proxyTripRequest;
export const PUT = proxyTripRequest;
export const PATCH = proxyTripRequest;
export const DELETE = proxyTripRequest;
