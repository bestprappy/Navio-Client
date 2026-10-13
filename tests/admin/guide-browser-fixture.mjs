import { registerHooks } from "node:module";
import { randomUUID } from "node:crypto";
registerHooks({ resolve(specifier, context, next) {
  return next(!context.parentURL?.includes("/node_modules/") && specifier.startsWith(".") && !/\.(ts|tsx|js|mjs|json)$/.test(specifier) ? `${specifier}.ts` : specifier, context);
} });
const { BANGKOK_ADMIN_GUIDE } = await import("../../app/feature/admin/_components/guides/data.ts");
const { guideOutline } = await import("../../app/feature/admin/_components/guides/guide-model.ts");
export const SEED_ID = "8f2b6c1e-5d3a-4c7b-9e1f-2a6d4b8c0e01";
export const seed = { ...BANGKOK_ADMIN_GUIDE, id: SEED_ID };
export const library = new Map([[SEED_ID, structuredClone(seed)]]);

export function responseFor(guide) {
  const { id, status, version, createdAt, updatedAt, publishedAt, updatedByName, categories, lists, places, body, ...fields } = guide;
  return { id, status, version, createdAt, updatedAt, publishedAt, updatedByName, createdByName: "Test Admin", guide: { ...fields, content: { categories, lists, places, body } } };
}

export async function installGuideRoutes(context) {
  await context.route("**/api/admin/guides**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const parts = url.pathname.replace("/api/admin/guides", "").split("/").filter(Boolean);
    const method = request.method();
    const json = (value, status = 200) => route.fulfill({ json: value, status });
    if (!parts.length && method === "GET") {
      const content = [...library.values()].map((guide) => ({ ...guide, destinationProvider: guide.destination.provider, destinationPlaceId: guide.destination.providerPlaceId, placeCount: guideOutline(guide).reduce((sum, section) => sum + section.places.length, 0) }));
      return json({ content, number: 0, totalPages: 1, totalElements: content.length });
    }
    if (!parts.length && method === "POST") {
      const fields = request.postDataJSON().guide;
      if ([...library.values()].some((guide) => guide.destination.providerPlaceId === fields.destination.providerPlaceId)) return json({ message: "Destination already has a guide" }, 409);
      const { content, ...rest } = fields;
      const stamp = new Date().toISOString();
      const guide = { ...rest, ...content, id: randomUUID(), status: "DRAFT", version: 0, createdAt: stamp, updatedAt: stamp, publishedAt: null, updatedByName: "Test Admin" };
      library.set(guide.id, guide);
      return json(responseFor(guide), 201);
    }
    const guide = library.get(parts[0]);
    if (!guide) return json({ message: "Guide not found" }, 404);
    if (method === "GET") return json(responseFor(guide));
    const body = method === "DELETE" ? { expectedVersion: Number(url.searchParams.get("expectedVersion")) } : request.postDataJSON();
    if (body.expectedVersion !== guide.version) return json({ message: "Changed by another admin" }, 409);
    if (method === "DELETE") { library.delete(guide.id); return route.fulfill({ status: 204 }); }
    if (method === "PUT") {
      const { content, ...fields } = body.guide;
      Object.assign(guide, fields, content);
    } else if (parts[1] === "publish") {
      if (!guideOutline(guide).some((section) => section.places.length)) return json({ message: "Add at least one place before publishing" }, 422);
      guide.status = "PUBLISHED"; guide.publishedAt = new Date().toISOString();
    } else if (parts[1] === "unpublish") { guide.status = "DRAFT"; guide.publishedAt = null; }
    guide.version++; guide.updatedAt = new Date().toISOString();
    return json(responseFor(guide));
  });
}
