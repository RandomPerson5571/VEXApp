import { throwIfRateLimited } from "@/lib/queries/api-response";

/**
 * Resolves stored object paths (or existing URLs) to fetchable image URLs
 * through the rate-limited Next.js API route.
 */
export async function resolveInventoryImageUrls(
  imageUrls: readonly (string | null | undefined)[],
): Promise<(string | null)[]> {
  if (imageUrls.length === 0) return [];

  const paths = imageUrls.map((imageUrl) => imageUrl ?? "");
  const response = await fetch("/api/inventory/signed-urls", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paths }),
  });

  throwIfRateLimited(response);

  if (!response.ok) {
    throw new Error("Failed to resolve inventory image URLs.");
  }

  const body = (await response.json()) as { urls?: (string | null)[] };
  return body.urls ?? paths.map(() => null);
}

/** Uploads an image via the rate-limited Next.js API route. */
export async function uploadInventoryImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("File must be an image.");
  }

  const formData = new FormData();
  formData.set("file", file);

  const response = await fetch("/api/inventory/upload", {
    method: "POST",
    body: formData,
  });

  throwIfRateLimited(response);

  const body = (await response.json()) as { path?: string; error?: string };

  if (!response.ok) {
    throw new Error(body.error ?? "Failed to upload image.");
  }

  if (!body.path) {
    throw new Error("Failed to upload image.");
  }

  return body.path;
}
