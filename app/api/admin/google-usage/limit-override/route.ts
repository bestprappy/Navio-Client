import { type NextRequest } from "next/server";
import { proxyAuthenticatedApiRequest } from "@/app/api/_lib/authenticated-api-proxy";

export async function PUT(request: NextRequest) {
  return proxyAuthenticatedApiRequest(request, "/v1/admin/ev/google-usage/limit-override");
}
