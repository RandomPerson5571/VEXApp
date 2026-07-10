"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { ImagePlus, Package, Plus, X } from "lucide-react";

export function InventoryItemModal({
  isOpen,
  name,
  description,
  totalStock,
  imageFile,
  onNameChange,
  onDescriptionChange,
  onTotalStockChange,
  onImageFileChange,
  onClose,
  onSubmit,
  isSubmitting = false,
  error,
}: {
  isOpen: boolean;
  name: string;
  description: string;
  totalStock: string;
  imageFile: File | null;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onTotalStockChange: (value: string) => void;
  onImageFileChange: (file: File | null) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isSubmitting?: boolean;
  error?: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(imageFile);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [imageFile]);

  if (!isOpen) {
    return null;
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    if (file && !file.type.startsWith("image/")) {
      event.target.value = "";
      return;
    }

    onImageFileChange(file);
  };

  const clearImage = () => {
    onImageFileChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm select-none dark:bg-[#000]/70">
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 font-sans shadow-2xl dark:border-slate-900 dark:bg-[#090e18]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="inventory-item-modal-title"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(234,179,8,0.08),transparent_60%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.03] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />

        <div className="relative">
          <h3
            id="inventory-item-modal-title"
            className="mb-4 flex items-center gap-2 border-b border-slate-200 pb-3 text-md font-bold text-slate-900 dark:border-slate-900 dark:text-slate-100"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-yellow-500/20 bg-yellow-500/10 shadow-[0_0_16px_rgba(234,179,8,0.12)]">
              <Package className="h-4 w-4 text-yellow-500 dark:text-yellow-400" />
            </div>
            <span>Add Inventory Part</span>
          </h3>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1">
              <label
                htmlFor="inventory-name"
                className="block text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400"
              >
                Part Name
              </label>
              <input
                id="inventory-name"
                type="text"
                required
                placeholder="e.g. REV HD Hex Motor"
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 transition-[border-color,box-shadow] focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500/30 dark:border-slate-900 dark:bg-slate-950 dark:text-slate-200 dark:focus:border-yellow-500/40"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="inventory-stock"
                className="block text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400"
              >
                Total Stock
              </label>
              <input
                id="inventory-stock"
                type="number"
                required
                min={0}
                step={1}
                placeholder="0"
                value={totalStock}
                onChange={(e) => onTotalStockChange(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-900 transition-[border-color,box-shadow] focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500/30 dark:border-slate-900 dark:bg-slate-950 dark:text-slate-200 dark:focus:border-yellow-500/40"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="inventory-image"
                className="block text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400"
              >
                Part Image
                <span className="ml-1 font-semibold normal-case tracking-normal text-slate-500">
                  (optional)
                </span>
              </label>
              <div className="flex items-center gap-3">
                <label
                  htmlFor="inventory-image"
                  className="flex flex-1 cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-yellow-500/50 hover:bg-yellow-500/5 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:border-yellow-500/30"
                >
                  <ImagePlus className="h-4 w-4 shrink-0 text-yellow-600 dark:text-yellow-400" />
                  <span className="truncate">
                    {imageFile ? imageFile.name : "Choose image file"}
                  </span>
                </label>
                {imageFile ? (
                  <button
                    type="button"
                    onClick={clearImage}
                    disabled={isSubmitting}
                    aria-label="Remove image"
                    className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-500 disabled:opacity-50 dark:border-slate-900 dark:bg-slate-950 dark:hover:text-red-400"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
              <input
                ref={fileInputRef}
                id="inventory-image"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="sr-only"
              />
              {previewUrl ? (
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-900 dark:bg-slate-950">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Selected part preview"
                    className="h-28 w-full object-contain"
                  />
                </div>
              ) : null}
            </div>

            <div className="space-y-1">
              <label
                htmlFor="inventory-description"
                className="block text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400"
              >
                Description
                <span className="ml-1 font-semibold normal-case tracking-normal text-slate-500">
                  (optional)
                </span>
              </label>
              <textarea
                id="inventory-description"
                placeholder="SKU notes, compatible systems, storage location..."
                value={description}
                onChange={(e) => onDescriptionChange(e.target.value)}
                rows={3}
                className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 transition-[border-color,box-shadow] focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500/30 dark:border-slate-900 dark:bg-slate-950 dark:text-slate-200 dark:focus:border-yellow-500/40"
              />
            </div>

            {error ? (
              <p className="text-xs font-semibold text-red-500">{error}</p>
            ) : null}

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-3 dark:border-slate-900">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="cursor-pointer rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 hover:text-slate-900 disabled:opacity-50 dark:bg-[#0e1724] dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-yellow-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-yellow-500/15 transition hover:bg-yellow-500 disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5" />
                {isSubmitting ? "Adding..." : "Add Part"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
