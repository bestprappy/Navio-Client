import { NextResponse, type NextRequest } from "next/server";
import { proxyAuthenticatedApiRequest } from "@/app/api/_lib/authenticated-api-proxy";
import { CATALOG_ID_PATTERN } from "../../admin/vehicle-models/catalog-routes";

export async function GET(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await context.params;
  if (path.length > 1 || (path.length === 1 && !CATALOG_ID_PATTERN.test(path[0]))) return NextResponse.json({ message: "Not found." }, { status: 404 });
  return proxyAuthenticatedApiRequest(request, `/v1/vehicle-models${path.length ? `/${encodeURIComponent(path[0])}` : ""}`, { allowAnonymous: true });
}
