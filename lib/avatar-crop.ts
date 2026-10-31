/**
 * Crop maths for profile photos (square) and banners (wide).
 *
 * Everything is measured in viewport units: the crop viewport is 1 wide and
 * `1 / aspect` tall (1 x 1 for a photo). The image is first scaled to cover the
 * viewport, then multiplied by `zoom`. `offsetX`/`offsetY` move the image centre
 * away from the viewport centre, also in viewport units, so the same state
 * renders identically at any on-screen size.
 */

export type ImageSize = { width: number; height: number };

export type AvatarCrop = { zoom: number; offsetX: number; offsetY: number };

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 4;
/** Output edge in pixels. Navio shows avatars at most 128 CSS px, so this covers 4x displays. */
export const AVATAR_OUTPUT_SIZE = 512;
/** Files larger than this are refused before decoding, to keep the tab responsive. */
export const MAX_SOURCE_BYTES = 25 * 1024 * 1024;

export const INITIAL_CROP: AvatarCrop = { zoom: 1, offsetX: 0, offsetY: 0 };

/** Profile banners are three times as wide as they are tall. */
export const BANNER_ASPECT = 3;
export const BANNER_OUTPUT = { width: 1500, height: 500 } as const;

function displayedSize(image: ImageSize, zoom: number, aspect = 1) {
  const scale = Math.max(1 / image.width, 1 / aspect / image.height) * zoom;
  return { scale, width: image.width * scale, height: image.height * scale };
}

/** Keeps the zoom in range and the image covering the whole viewport. */
export function clampCrop(image: ImageSize, crop: AvatarCrop, aspect = 1): AvatarCrop {
  const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, crop.zoom));
  const shown = displayedSize(image, zoom, aspect);
  const maxX = (shown.width - 1) / 2;
  const maxY = (shown.height - 1 / aspect) / 2;
  return {
    zoom,
    offsetX: Math.min(maxX, Math.max(-maxX, crop.offsetX)),
    offsetY: Math.min(maxY, Math.max(-maxY, crop.offsetY)),
  };
}

/** Where to draw the image inside the viewport, as fractions of its width and height. */
export function imagePlacement(image: ImageSize, crop: AvatarCrop, aspect = 1) {
  const shown = displayedSize(image, crop.zoom, aspect);
  return {
    left: 0.5 + crop.offsetX - shown.width / 2,
    top: 0.5 + (crop.offsetY - shown.height / 2) * aspect,
    width: shown.width,
    height: shown.height * aspect,
  };
}

/** The rectangle of source pixels that the viewport currently shows. `size` is its width. */
export function cropSourceRect(image: ImageSize, crop: AvatarCrop, aspect = 1) {
  const { scale, width, height } = displayedSize(image, crop.zoom, aspect);
  const size = 1 / scale;
  return {
    x: (width / 2 - 0.5 - crop.offsetX) / scale,
    y: (height / 2 - 0.5 / aspect - crop.offsetY) / scale,
    size,
    width: size,
    height: size / aspect,
  };
}

export class AvatarImageError extends Error {}

/**
 * Decodes a picked file with its EXIF orientation applied. Browsers that cannot
 * read the format (HEIC outside Safari, for example) reject here, which is the
 * only reliable way to know.
 */
export async function decodeAvatarSource(file: File): Promise<ImageBitmap> {
  if (!file.type.startsWith("image/")) {
    throw new AvatarImageError("Choose an image file, such as a JPEG or PNG.");
  }
  if (file.size === 0 || file.size > MAX_SOURCE_BYTES) {
    throw new AvatarImageError("Choose a photo smaller than 25 MB.");
  }
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new AvatarImageError("This browser cannot open that image. Try a JPEG or PNG.");
  }
}

/**
 * Draws the cropped square onto a canvas and encodes it as JPEG. The result is
 * always 512 x 512 and well under the 5 MiB the profile service accepts, so a
 * 48-megapixel phone photo uploads as easily as a small one.
 */
export function renderAvatar(source: ImageBitmap, crop: AvatarCrop): Promise<File> {
  return renderCrop(source, crop, { width: AVATAR_OUTPUT_SIZE, height: AVATAR_OUTPUT_SIZE, fileName: "profile-photo.jpg" });
}

/** The banner equivalent: always 1500 x 500, well under the service's 5 MiB limit. */
export function renderBanner(source: ImageBitmap, crop: AvatarCrop): Promise<File> {
  return renderCrop(source, crop, { ...BANNER_OUTPUT, fileName: "profile-banner.jpg" });
}

async function renderCrop(
  source: ImageBitmap,
  crop: AvatarCrop,
  output: { width: number; height: number; fileName: string },
): Promise<File> {
  const aspect = output.width / output.height;
  const rect = cropSourceRect(source, crop, aspect);
  const canvas = document.createElement("canvas");
  canvas.width = output.width;
  canvas.height = output.height;
  const context = canvas.getContext("2d");
  if (!context) throw new AvatarImageError("Your browser could not prepare the image.");

  // JPEG has no transparency; a transparent PNG would otherwise turn black.
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, output.width, output.height);
  context.imageSmoothingQuality = "high";
  context.drawImage(source, rect.x, rect.y, rect.width, rect.height, 0, 0, output.width, output.height);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.88));
  if (!blob) throw new AvatarImageError("Your browser could not prepare the image.");
  return new File([blob], output.fileName, { type: "image/jpeg" });
}
