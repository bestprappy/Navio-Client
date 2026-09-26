import { NextRequest, NextResponse } from "next/server";

import { fetchExplorePlansFromGateway } from "@/app/feature/explore/_components/shared-plans/explore-plans-server";

/**
 * The Explore feed, for the browser's "Show more".
 *
 * <p>GET on the collection only. Individual shared plans are deliberately not
 * proxied here: their pages fetch server-side, so no route on this origin
 * serves a token-addressed read.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const page = Number(request.nextUrl.searchParams.get("page") ?? "0");
  const size = Number(request.nextUrl.searchParams.get("size") ?? "12");
  if (!Number.isFinite(page) || !Number.isFinite(size)) {
    return NextResponse.json({ message: "Invalid page" }, { status: 400 });
  }

  const result = await fetchExplorePlansFromGateway(page, size);
  if (result.status === "error") {
    return NextResponse.json(
      { message: "Shared plans could not be loaded" },
      { status: result.httpStatus, headers: { "Cache-Control": "no-store" } },
    );
  }
  return NextResponse.json(result.page, { headers: { "Cache-Control": "no-store" } });
}
