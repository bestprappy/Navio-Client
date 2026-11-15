import {
  COMMUNITY_PICTURE_TYPES,
  validateCommunityPicture,
} from "./community-picture-input";

/** Mirrors PostService.MAX_PICTURES. */
export const POST_PICTURE_LIMIT = 10;
/** Leaves room under the 21 MiB request limit for the post itself. */
export const POST_PICTURES_TOTAL_BYTES = 20 * 1024 * 1024;

/** The service rejects anything over 4096 px per side or 12 megapixels. */
const MAX_SIDE = 3072;
const MAX_PIXELS = 12_000_000;
/** Pictures this small and within the pixel limits upload untouched. */
const SHRINK_ABOVE_BYTES = 2 * 1024 * 1024;
const JPEG_QUALITY = 0.86;

export type PostPicture = {
  /** Stable across reorders, used as the React key. */
  id: string;
  file: File;
};

export type PreparedPictures = {
  pictures: PostPicture[];
  /** A sentence for the first rejected file, or "" when every file was added. */
  error: string;
};

function pictureId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function fitWithin(width: number, height: number): { width: number; height: number } {
  const sideScale = Math.min(1, MAX_SIDE / Math.max(width, height));
  const pixelScale = Math.min(1, Math.sqrt(MAX_PIXELS / (width * height)));
  const scale = Math.min(sideScale, pixelScale);
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

/**
 * Downscales large photos in the browser so phone pictures fit the service's
 * pixel and size limits. Orientation from the photo's metadata is applied.
 * Returns the original file whenever shrinking is unnecessary or unsupported.
 */
async function shrinkIfLarge(file: File): Promise<File> {
  if (typeof createImageBitmap !== "function" || typeof document === "undefined") return file;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    // Not decodable here; the service gives the authoritative answer.
    return file;
  }
  try {
    const target = fitWithin(bitmap.width, bitmap.height);
    const resized = target.width !== bitmap.width || target.height !== bitmap.height;
    if (!resized && file.size <= SHRINK_ABOVE_BYTES) return file;
    const canvas = document.createElement("canvas");
    canvas.width = target.width;
    canvas.height = target.height;
    const context = canvas.getContext("2d");
    if (!context) return file;
    context.drawImage(bitmap, 0, 0, target.width, target.height);
    const type = file.type === "image/png" ? "image/png" : "image/jpeg";
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, type, type === "image/jpeg" ? JPEG_QUALITY : undefined),
    );
    if (!blob || (!resized && blob.size >= file.size)) return file;
    return new File([blob], file.name, { type, lastModified: file.lastModified });
  } catch (error) {
    console.warn("Could not shrink a post picture; uploading the original.", {
      component: "PostPictureFiles",
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return file;
  } finally {
    bitmap.close();
  }
}

function totalBytes(pictures: readonly PostPicture[]): number {
  return pictures.reduce((sum, picture) => sum + picture.file.size, 0);
}

/**
 * Validates and prepares newly chosen files against what is already attached.
 * Accepted files keep their chosen order; the first problem is reported.
 */
export async function preparePostPictures(
  chosen: readonly File[],
  existing: readonly PostPicture[],
): Promise<PreparedPictures> {
  const room = POST_PICTURE_LIMIT - existing.length;
  if (room <= 0) {
    return { pictures: [], error: `A post can have up to ${POST_PICTURE_LIMIT} pictures.` };
  }
  let error = chosen.length > room
    ? `Only ${room} more ${room === 1 ? "picture fits" : "pictures fit"}; a post can have up to ${POST_PICTURE_LIMIT}.`
    : "";
  const accepted: PostPicture[] = [];
  let bytes = totalBytes(existing);

  for (const original of chosen.slice(0, room)) {
    // Size is checked after shrinking, so a large photo still gets its chance.
    if (!COMMUNITY_PICTURE_TYPES.includes(original.type) || original.size === 0) {
      error ||= `${original.name}: Choose a PNG or JPEG picture.`;
      continue;
    }
    const file = await shrinkIfLarge(original);
    const problem = validateCommunityPicture(file);
    if (problem) {
      error ||= `${original.name}: ${problem}`;
      continue;
    }
    if (bytes + file.size > POST_PICTURES_TOTAL_BYTES) {
      error ||= "Pictures can add up to 20 MB per post. Remove one to add more.";
      continue;
    }
    bytes += file.size;
    accepted.push({ id: pictureId(), file });
  }
  return { pictures: accepted, error };
}

/** Moves the picture at `from` to `to`, leaving the list unchanged for out-of-range indexes. */
export function movePicture<T>(items: readonly T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return [...items];
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}
