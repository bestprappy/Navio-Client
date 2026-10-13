/** Saves generated content through the browser's normal download flow. */
export function downloadFile(content: BlobPart, fileName: string, type: string): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.rel = "noopener";
  document.body.append(link);
  link.click();
  link.remove();
  // Some browsers start reading the blob after click() returns.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** A file-system-safe name part: letters and digits from any script, joined by dashes. */
export function toFileNameSlug(value: string, fallback: string): string {
  const slug = value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug || fallback;
}
