import { proxySegments } from "@/app/api/_lib/path-proxy";

function proxy(request: Request) {
  return proxySegments(request, "/v1/reports", []);
}

export const POST = proxy;
