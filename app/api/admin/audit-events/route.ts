import { NextResponse, type NextRequest } from "next/server";
import { proxyAuthenticatedApiRequest } from "@/app/api/_lib/authenticated-api-proxy";

export async function GET(request: NextRequest) {
  return proxyAuthenticatedApiRequest(request, "/v1/admin/audit-events");
}

export function POST() { return NextResponse.json({ message: "Not found." }, { status: 404 }); }
