import { NextResponse, type NextRequest } from "next/server";
import { proxyAuthenticatedApiRequest } from "@/app/api/_lib/authenticated-api-proxy";
import { isAllowedCatalogRoute } from "../catalog-routes";

async function proxy(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await context.params;
  if (!isAllowedCatalogRoute(request.method, path)) return NextResponse.json({ message: "Not found." }, { status: 404 });
  return proxyAuthenticatedApiRequest(request, `/v1/admin/vehicle-models${path.length ? `/${path.map(encodeURIComponent).join("/")}` : ""}`);
}
export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
