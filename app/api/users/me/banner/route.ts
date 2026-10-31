import { proxySegments } from "@/app/api/_lib/path-proxy";

function proxy(request: Request) {
  return proxySegments(request, "/v1/users/me/banner", []);
}

export const POST = proxy;
export const DELETE = proxy;
