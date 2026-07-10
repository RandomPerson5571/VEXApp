import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

const INVENTORY_IMAGES_BUCKET = "inventory-images";
const SIGNED_URL_TTL_SECONDS = 60 * 60;

function isAbsoluteUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function normalizeStoragePath(value: string): string {
  const trimmed = value.trim().replace(/^\/+/, "");
  const bucketPrefix = `${INVENTORY_IMAGES_BUCKET}/`;

  if (trimmed.startsWith(bucketPrefix)) {
    return trimmed.slice(bucketPrefix.length);
  }

  return trimmed;
}

function extensionFromFileName(fileName: string, mimeType: string): string {
  const fromName = fileName.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]+$/.test(fromName)) return fromName;

  const fromType = mimeType.split("/")[1]?.toLowerCase();
  if (fromType === "jpeg") return "jpg";
  if (fromType && /^[a-z0-9+.-]+$/.test(fromType)) return fromType;

  return "jpg";
}

function getPublicUrlForPath(supabase: SupabaseClient, path: string): string {
  const { data } = supabase.storage
    .from(INVENTORY_IMAGES_BUCKET)
    .getPublicUrl(path);

  return data.publicUrl;
}

export async function resolveInventoryImageUrlsServer(
  supabase: SupabaseClient,
  imageUrls: readonly string[],
): Promise<(string | null)[]> {
  if (imageUrls.length === 0) return [];
  const resolved: (string | null)[] = new Array(imageUrls.length).fill(null);
  const storagePaths: { index: number; path: string }[] = [];

  imageUrls.forEach((imageUrl, index) => {
    if (!imageUrl) return;

    if (isAbsoluteUrl(imageUrl)) {
      resolved[index] = imageUrl;
      return;
    }

    storagePaths.push({
      index,
      path: normalizeStoragePath(imageUrl),
    });
  });

  if (storagePaths.length === 0) return resolved;

  const { data, error } = await supabase.storage
    .from(INVENTORY_IMAGES_BUCKET)
    .createSignedUrls(
      storagePaths.map(({ path }) => path),
      SIGNED_URL_TTL_SECONDS,
    );

  if (error || !data) {
    for (const { index, path } of storagePaths) {
      resolved[index] = getPublicUrlForPath(supabase, path);
    }
    return resolved;
  }

  for (let i = 0; i < storagePaths.length; i++) {
    const { index, path } = storagePaths[i];
    const signed = data[i];

    resolved[index] =
      signed?.signedUrl && !signed.error
        ? signed.signedUrl
        : getPublicUrlForPath(supabase, path);
  }

  return resolved;
}

export async function uploadInventoryImageServer(
  supabase: SupabaseClient,
  fileName: string,
  mimeType: string,
  fileBytes: Uint8Array,
): Promise<string> {
  if (!mimeType.startsWith("image/")) {
    throw new Error("File must be an image.");
  }
  const path = `${crypto.randomUUID()}.${extensionFromFileName(fileName, mimeType)}`;

  const { error } = await supabase.storage
    .from(INVENTORY_IMAGES_BUCKET)
    .upload(path, fileBytes, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return path;
}
