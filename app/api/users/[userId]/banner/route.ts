import { proxySegments } from "@/app/api/_lib/path-proxy";

type Context = { params: Promise<{ userId: string }> };

async function proxy(request: Request, context: Context) {
  const { userId } = await context.params;
  return proxySegments(request, "/v1/users", [userId, "banner"]);
}

export const GET = proxy;
