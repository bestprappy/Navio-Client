/**
 * Where a vehicle image may come from. Mirrors the server's VehicleImagePaths:
 * a bundled asset, a photo an admin uploaded to the catalog, or an HTTPS URL.
 */
const BUNDLED_IMAGE = /^\/images\/vehicles\/[a-z0-9-]+\.(png|webp)$/;
const UPLOADED_IMAGE = /^\/api\/vehicle-models\/images\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export const isBundledVehicleImage = (url: string) => BUNDLED_IMAGE.test(url);
export const isUploadedVehicleImage = (url: string) => UPLOADED_IMAGE.test(url);

/** True when the image can be rendered: a known local path, or any HTTPS URL. */
export function isRenderableVehicleImage(url: string | null | undefined): url is string {
  if (!url) return false;
  return isBundledVehicleImage(url) || isUploadedVehicleImage(url) || url.startsWith("https://");
}
