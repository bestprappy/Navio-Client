import { proxyAuthenticatedApiRequest } from "@/app/api/_lib/authenticated-api-proxy";

export function PATCH(request: Request) {
  return proxyAuthenticatedApiRequest(request, "/v1/users/me/preferences");
}
