import { NextResponse, type NextRequest } from "next/server";
import { proxyAuthenticatedApiRequest } from "@/app/api/_lib/authenticated-api-proxy";
import { isAllowedPublicGuideRoute } from "../../admin/guides/guide-routes";

export async function GET(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await context.params;
  if (!isAllowedPublicGuideRoute(request.method, path)) return NextResponse.json({ message: "Not found." }, { status: 404 });
  return proxyAuthenticatedApiRequest(request, `/v1/guides${path.length ? `/${encodeURIComponent(path[0])}` : ""}`, { allowAnonymous: true });
}
