import { createClient } from "@supabase/supabase-js";

import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

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

function createStorageClient() {
  return createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function getPublicUrlForPath(
  supabase: ReturnType<typeof createStorageClient>,
  path: string,
): string {
  const { data } = supabase.storage
    .from(INVENTORY_IMAGES_BUCKET)
    .getPublicUrl(path);

  return data.publicUrl;
}

/**
 * Resolves stored object paths (or existing URLs) to fetchable image URLs
 * using a single batched Storage request for all bucket paths.
 */
export async function resolveInventoryImageUrls(
  imageUrls: readonly (string | null | undefined)[],
): Promise<(string | null)[]> {
  if (imageUrls.length === 0) return [];

  const supabase = createStorageClient();
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
