import { proxySegments } from "@/app/api/_lib/path-proxy";

type Context = { params: Promise<{ path: string[] }> };

async function proxy(request: Request, context: Context) {
  const { path } = await context.params;
  return proxySegments(request, "/v1/social", path);
}

export const GET = proxy;
export const PUT = proxy;
export const DELETE = proxy;
