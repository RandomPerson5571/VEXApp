"use client";

import { useCallback, useEffect, useRef } from "react";

import { debounce } from "@/lib/utils/debounce";

export function useDebouncedSaver<TPayload extends object>(
  delayMs: number,
  saveFn: (key: string, payload: TPayload) => Promise<void>,
) {
  const pendingRef = useRef(new Map<string, Partial<TPayload>>());
  const debouncersRef = useRef(
    new Map<string, ReturnType<typeof debounce<() => void>>>(),
  );
  const saveFnRef = useRef(saveFn);

  useEffect(() => {
    saveFnRef.current = saveFn;
  }, [saveFn]);

  useEffect(() => {
    const debouncers = debouncersRef.current;
    return () => {
      for (const debounced of debouncers.values()) {
        debounced.cancel();
      }
      debouncers.clear();
      pendingRef.current.clear();
    };
  }, []);

  return useCallback(
    (key: string, payload: Partial<TPayload>) => {
      const merged = {
        ...pendingRef.current.get(key),
        ...payload,
      } as Partial<TPayload>;
      pendingRef.current.set(key, merged);

      let debounced = debouncersRef.current.get(key);

      if (!debounced) {
        debounced = debounce(() => {
          const finalPayload = pendingRef.current.get(key) as TPayload | undefined;
          pendingRef.current.delete(key);

          if (!finalPayload) {
            return;
          }

          void saveFnRef.current(key, finalPayload);
        }, delayMs);

        debouncersRef.current.set(key, debounced);
      }

      debounced();
    },
    [delayMs],
  );
}
