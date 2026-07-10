"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { debounce } from "@/lib/utils/debounce";

type UseDebouncedMutationOptions<TInput> = {
  delayMs: number;
  mutateFn: (input: TInput) => Promise<void>;
  applyOptimistic: (input: TInput) => void;
  onError?: (error: unknown, input: TInput) => void;
};

export function useDebouncedMutation<TInput>({
  delayMs,
  mutateFn,
  applyOptimistic,
  onError,
}: UseDebouncedMutationOptions<TInput>) {
  const [isPending, setIsPending] = useState(false);
  const latestInputRef = useRef<TInput | null>(null);
  const mutateFnRef = useRef(mutateFn);
  const onErrorRef = useRef(onError);

  mutateFnRef.current = mutateFn;
  onErrorRef.current = onError;

  const executeMutate = useCallback(async () => {
    const input = latestInputRef.current;
    if (input === null) {
      return;
    }

    latestInputRef.current = null;
    setIsPending(true);

    try {
      await mutateFnRef.current(input);
    } catch (error) {
      onErrorRef.current?.(error, input);
    } finally {
      setIsPending(false);
    }
  }, []);

  const debouncedExecuteRef = useRef(debounce(executeMutate, delayMs));

  useEffect(() => {
    debouncedExecuteRef.current.cancel();
    debouncedExecuteRef.current = debounce(executeMutate, delayMs);

    return () => {
      debouncedExecuteRef.current.cancel();
    };
  }, [delayMs, executeMutate]);

  const mutate = useCallback(
    (input: TInput) => {
      applyOptimistic(input);
      latestInputRef.current = input;
      debouncedExecuteRef.current();
    },
    [applyOptimistic],
  );

  const flush = useCallback(() => {
    debouncedExecuteRef.current.flush();
  }, []);

  const cancel = useCallback(() => {
    debouncedExecuteRef.current.cancel();
    latestInputRef.current = null;
  }, []);

  return { mutate, isPending, flush, cancel };
}
