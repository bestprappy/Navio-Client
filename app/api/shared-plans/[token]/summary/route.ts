import { NextResponse } from "next/server";

import { fetchExplorePlanSummaryFromGateway } from "@/app/feature/explore/_components/shared-plans/explore-plans-server";

/**
 * One listed plan's Explore card, for community post attachments.
 *
 * <p>Answers only for plans listed on Explore right now, whose cards and tokens
 * the feed already serves to anyone; unlisted links get the same 404 as unknown
 * ones. The plan itself is still read only by its server-rendered pages.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
): Promise<Response> {
  const { token } = await context.params;
  const headers = { "Cache-Control": "no-store" };
  const result = await fetchExplorePlanSummaryFromGateway(token);

  if (result.status === "not-listed") {
    return NextResponse.json({ message: "This plan is not listed on Explore" }, { status: 404, headers });
  }
  if (result.status === "error") {
    return NextResponse.json({ message: "This plan could not be loaded" }, { status: result.httpStatus, headers });
  }
  return NextResponse.json(result.plan, { headers });
}
