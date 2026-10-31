import { proxySegments } from "@/app/api/_lib/path-proxy";

type Context = { params: Promise<{ token: string }> };

async function proxy(request: Request, context: Context) {
  const { token } = await context.params;
  return proxySegments(request, "/v1/shared-plans", [token, "author"]);
}

export const GET = proxy;
