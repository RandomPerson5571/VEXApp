export type DebouncedFunction<T extends (...args: never[]) => void> = ((
  ...args: Parameters<T>
) => void) & {
  cancel: () => void;
  flush: () => void;
};

/** Trailing-edge debounce with cancel and flush. */
export function debounce<T extends (...args: never[]) => void>(
  fn: T,
  delayMs: number,
): DebouncedFunction<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;

  const debounced = ((...args: Parameters<T>) => {
    lastArgs = args;

    if (timer) {
      clearTimeout(timer);
    }

    timer = setTimeout(() => {
      timer = null;
      const callArgs = lastArgs;
      lastArgs = null;

      if (callArgs) {
        fn(...callArgs);
      }
    }, delayMs);
  }) as DebouncedFunction<T>;

  debounced.cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }

    lastArgs = null;
  };

  debounced.flush = () => {
    if (!timer) {
      return;
    }

    clearTimeout(timer);
    timer = null;

    const callArgs = lastArgs;
    lastArgs = null;

    if (callArgs) {
      fn(...callArgs);
    }
  };

  return debounced;
}
