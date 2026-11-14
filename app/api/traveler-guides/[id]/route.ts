import { NextResponse, type NextRequest } from "next/server";
import { proxyAuthenticatedApiRequest } from "@/app/api/_lib/authenticated-api-proxy";
import { GUIDE_ID_PATTERN } from "@/app/api/admin/guides/guide-routes";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!GUIDE_ID_PATTERN.test(id)) return NextResponse.json({ message: "Not found." }, { status: 404 });
  return proxyAuthenticatedApiRequest(request, `/v1/traveler-guides/${encodeURIComponent(id)}`, { allowAnonymous: true });
}
