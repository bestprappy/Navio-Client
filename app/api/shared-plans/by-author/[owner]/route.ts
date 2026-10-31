import { proxySegments } from "@/app/api/_lib/path-proxy";

type Context = { params: Promise<{ owner: string }> };

async function proxy(request: Request, context: Context) {
  const { owner } = await context.params;
  return proxySegments(request, "/v1/shared-plans/by-author", [owner]);
}

export const GET = proxy;
