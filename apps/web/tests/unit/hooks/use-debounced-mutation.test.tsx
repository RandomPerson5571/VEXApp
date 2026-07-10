// @vitest-environment happy-dom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useDebouncedMutation } from "@/lib/hooks/use-debounced-mutation";

function DebouncedMutationProbe({
  applyOptimistic,
  mutateFn,
  onReady,
}: {
  applyOptimistic: (input: string) => void;
  mutateFn: (input: string) => Promise<void>;
  onReady: (api: ReturnType<typeof useDebouncedMutation<string>>) => void;
}) {
  const api = useDebouncedMutation({
    delayMs: 300,
    applyOptimistic,
    mutateFn,
  });

  onReady(api);
  return null;
}

describe("useDebouncedMutation", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.useFakeTimers();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.useRealTimers();
  });

  it("applies optimistic updates immediately and mutates once after the delay", async () => {
    const applyOptimistic = vi.fn();
    const mutateFn = vi.fn().mockResolvedValue(undefined);
    let api: ReturnType<typeof useDebouncedMutation<string>> | null = null;

    await act(async () => {
      root.render(
        <DebouncedMutationProbe
          applyOptimistic={applyOptimistic}
          mutateFn={mutateFn}
          onReady={(nextApi) => {
            api = nextApi;
          }}
        />,
      );
    });

    expect(api).not.toBeNull();

    await act(async () => {
      api!.mutate("first");
      api!.mutate("second");
    });

    expect(applyOptimistic).toHaveBeenCalledTimes(2);
    expect(mutateFn).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(300);
      await Promise.resolve();
    });

    expect(mutateFn).toHaveBeenCalledTimes(1);
    expect(mutateFn).toHaveBeenCalledWith("second");
  });
});
