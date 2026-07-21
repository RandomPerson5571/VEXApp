"use client";

import { useEffect, useState } from "react";

import { resolveInventoryImageUrls } from "@/lib/supabase/inventory-images";

function isAbsoluteUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

const resolvedCache = new Map<string, string | null>();

type PendingResolve = {
  path: string;
  resolve: (url: string | null) => void;
};

let pendingBatch: PendingResolve[] = [];
let batchTimer: ReturnType<typeof setTimeout> | null = null;

function flushBatch() {
  batchTimer = null;
  const batch = pendingBatch;
  pendingBatch = [];

  if (batch.length === 0) return;

  const paths = batch.map((entry) => entry.path);

  void resolveInventoryImageUrls(paths).then((resolved) => {
    batch.forEach((entry, index) => {
      const url = resolved[index] ?? null;
      resolvedCache.set(entry.path, url);
      entry.resolve(url);
    });
  });
}

function scheduleBatch() {
  if (batchTimer !== null) return;
  batchTimer = setTimeout(flushBatch, 0);
}

function resolveImageUrl(path: string): Promise<string | null> {
  if (isAbsoluteUrl(path)) {
    resolvedCache.set(path, path);
    return Promise.resolve(path);
  }

  const cached = resolvedCache.get(path);
  if (cached !== undefined) {
    return Promise.resolve(cached);
  }

  return new Promise((resolve) => {
    pendingBatch.push({ path, resolve });
    scheduleBatch();
  });
}

function getCachedImageUrl(rawUrl: string | null | undefined): string | null {
  if (!rawUrl) return null;
  if (isAbsoluteUrl(rawUrl)) return rawUrl;
  return resolvedCache.get(rawUrl) ?? null;
}

function needsResolution(rawUrl: string | null | undefined): boolean {
  if (!rawUrl) return false;
  if (isAbsoluteUrl(rawUrl)) return false;
  return !resolvedCache.has(rawUrl);
}

/** Lazily resolves a stored inventory image path to a fetchable URL (batched per tick). */
export function useInventoryImageUrl(rawUrl: string | null | undefined) {
  const [url, setUrl] = useState(() => getCachedImageUrl(rawUrl));
  const [isLoading, setIsLoading] = useState(() => needsResolution(rawUrl));
  const [trackedRawUrl, setTrackedRawUrl] = useState(rawUrl);

  if (rawUrl !== trackedRawUrl) {
    setTrackedRawUrl(rawUrl);
    setUrl(getCachedImageUrl(rawUrl));
    setIsLoading(needsResolution(rawUrl));
  }

  useEffect(() => {
    if (!needsResolution(rawUrl)) {
      return;
    }

    let cancelled = false;

    void resolveImageUrl(rawUrl!).then((resolved) => {
      if (cancelled) return;
      setUrl(resolved);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [rawUrl]);

  return { url, isLoading };
}
