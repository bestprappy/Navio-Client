import { createHash } from "node:crypto";

/** Server-owned receipt: one publication view per browser per UTC calendar day.
 * Keep account identity out of the key: signing in attaches a unique account to
 * the existing receipt without incrementing the browser's total again.
 */
export function dailyPublicationReadId(visitorId: string, resource: string, now = new Date()): string {
  const hex = createHash("sha256")
    .update(JSON.stringify(["navio-daily-read-v1", visitorId.toLowerCase(), resource, now.toISOString().slice(0, 10)]))
    .digest("hex").slice(0, 32).split("");
  hex[12] = "5";
  hex[16] = ((parseInt(hex[16], 16) & 3) | 8).toString(16);
  const id = hex.join("");
  return `${id.slice(0,8)}-${id.slice(8,12)}-${id.slice(12,16)}-${id.slice(16,20)}-${id.slice(20)}`;
}
