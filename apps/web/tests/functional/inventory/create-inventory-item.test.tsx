// @vitest-environment happy-dom

import type { FormEvent } from "react";
import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { InventoryItemModal } from "@/components/inventory/InventoryItemModal";
import type { CreateInventoryItemPayload } from "@/lib/queries/inventory";

function CreateInventoryHarness({
  onCreate,
  initialError,
  initialName = "",
  initialDescription = "",
  initialTotalStock = "",
  initialImageFile = null,
}: {
  onCreate: (payload: CreateInventoryItemPayload) => void;
  initialError?: string;
  initialName?: string;
  initialDescription?: string;
  initialTotalStock?: string;
  initialImageFile?: File | null;
}) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [totalStock, setTotalStock] = useState(initialTotalStock);
  const [imageFile, setImageFile] = useState<File | null>(initialImageFile);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(initialError);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const stock = Number.parseInt(totalStock, 10);

    if (!trimmedName || isSubmitting) return;
    if (!Number.isInteger(stock) || stock < 0) return;

    setIsSubmitting(true);
    onCreate({
      name: trimmedName,
      description: description.trim() || undefined,
      totalStock: stock,
    });
    setIsSubmitting(false);
    setError(undefined);
  };

  return (
    <InventoryItemModal
      isOpen
      name={name}
      description={description}
      totalStock={totalStock}
      imageFile={imageFile}
      onNameChange={setName}
      onDescriptionChange={setDescription}
      onTotalStockChange={setTotalStock}
      onImageFileChange={setImageFile}
      onClose={() => undefined}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      error={error}
    />
  );
}

describe("inventory item creation UI", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("submits trimmed create payload when the admin fills the form", async () => {
    const onCreate = vi.fn();

    await act(async () => {
      root.render(
        <CreateInventoryHarness
          onCreate={onCreate}
          initialName="  REV HD Hex Motor  "
          initialDescription="  Green cartridge  "
          initialTotalStock="4"
        />,
      );
    });

    const submitButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Add Part"),
    );

    await act(async () => {
      submitButton?.click();
    });

    expect(onCreate).toHaveBeenCalledWith({
      name: "REV HD Hex Motor",
      description: "Green cartridge",
      totalStock: 4,
    });
  });

  it("updates image file state when an image is selected", async () => {
    const onCreate = vi.fn();
    const file = new File(["image-bytes"], "motor.png", { type: "image/png" });

    await act(async () => {
      root.render(<CreateInventoryHarness onCreate={onCreate} />);
    });

    const fileInput = container.querySelector(
      "#inventory-image",
    ) as HTMLInputElement;

    await act(async () => {
      Object.defineProperty(fileInput, "files", {
        configurable: true,
        value: [file],
      });
      fileInput.dispatchEvent(new Event("change", { bubbles: true }));
    });

    expect(container.textContent).toContain("motor.png");
  });

  it("does not submit when stock is invalid", async () => {
    const onCreate = vi.fn();

    await act(async () => {
      root.render(
        <CreateInventoryHarness
          onCreate={onCreate}
          initialName="Motor"
          initialTotalStock="-1"
        />,
      );
    });

    const submitButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Add Part"),
    );

    await act(async () => {
      submitButton?.click();
    });

    expect(onCreate).not.toHaveBeenCalled();
  });

  it("shows API errors returned from the create mutation", async () => {
    await act(async () => {
      root.render(
        <CreateInventoryHarness
          onCreate={() => undefined}
          initialError="Name is required."
        />,
      );
    });

    expect(container.textContent).toContain("Name is required.");
  });
});
