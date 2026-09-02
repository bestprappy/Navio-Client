import { proxyAuthenticatedApiRequest } from "@/app/api/_lib/authenticated-api-proxy";

export function GET(request: Request) {
  return proxyAuthenticatedApiRequest(request, "/v1/users/me");
}

export function PATCH(request: Request) {
  return proxyAuthenticatedApiRequest(request, "/v1/users/me");
}
