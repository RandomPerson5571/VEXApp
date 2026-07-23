"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Package, Plus } from "lucide-react";
import type { TeamInventoryItem } from "@stlvex/database/types";

import { useTeam, useUser } from "@/components/providers/UserProvider";
import {
  InventoryCard,
  InventoryFilters,
  InventoryStats,
} from "@/components/inventory/InventoryComponents";
import { InventoryItemModal } from "@/components/inventory/InventoryItemModal";
import { isGlobalAdmin } from "@/lib/auth/auth-guards";
import { isQueryInitiallyLoading } from "@/lib/hooks/use-query-loading";
import { useTeamInventoryMutations } from "@/lib/hooks/use-team-inventory-mutations";
import { useTeamInventory } from "@/lib/hooks/use-team-inventory";
import { uploadInventoryImage } from "@/lib/supabase/inventory-images";
import {
  type AvailabilityFilter,
  matchesAvailabilityFilter,
  matchesInventorySearch,
  summarizeInventory,
} from "@/lib/inventory/inventory-utils";

function filterInventory(
  items: ReturnType<typeof useTeamInventory>["data"],
  search: string,
  availabilityFilter: AvailabilityFilter,
  teamId: string,
) {
  const list = items ?? [];
  return list.filter(
    (item) =>
      matchesInventorySearch(item, search) &&
      matchesAvailabilityFilter(item, availabilityFilter, teamId),
  );
}

function InventoryFallback() {
  return (
    <div className="flex flex-1 items-center justify-center bg-slate-100 dark:bg-[#000000] p-8">
      <div className="w-full max-w-md rounded-2xl border border-slate-300 dark:border-[#1a1a1a] bg-white dark:bg-[#0a0a0a] p-8 text-center shadow-md">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-slate-800 bg-slate-900/60">
          <Package className="h-7 w-7 text-slate-400" />
        </div>
        <h1 className="text-xl font-black text-slate-100">No team assigned</h1>
        <p className="mt-2 text-sm text-slate-400">
          Join or select a team to view workshop inventory.
        </p>
      </div>
    </div>
  );
}

export function InventoryView() {
  const user = useUser();
  const team = useTeam();
  const teamId = team?.id ?? "";
  const isAdmin = isGlobalAdmin(user);
  const inventoryQuery = useTeamInventory();
  const { data: items = [], isError } = inventoryQuery;
  const isInitialLoading = isQueryInitiallyLoading(inventoryQuery);

  const resetForm = () => {
    setName("");
    setDescription("");
    setTotalStock("");
    setCheckoutLimit("");
    setImageFile(null);
    setExistingImageUrl(null);
    setFormError(undefined);
    setEditingItemId(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const { createMutation, updateMutation, deleteMutation } =
    useTeamInventoryMutations({
      teamId: team?.id,
      onCreateSuccess: closeModal,
      onUpdateSuccess: closeModal,
      onDeleteSuccess: closeModal,
    });
  const [search, setSearch] = useState("");
  const [availabilityFilter, setAvailabilityFilter] =
    useState<AvailabilityFilter>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [totalStock, setTotalStock] = useState("");
  const [checkoutLimit, setCheckoutLimit] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | undefined>();

  const isEditMode = editingItemId !== null;
  const isModalBusy =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  const openCreateModal = () => {
    resetForm();
    createMutation.reset();
    updateMutation.reset();
    deleteMutation.reset();
    setIsModalOpen(true);
  };

  const openEditModal = (item: TeamInventoryItem) => {
    if (!isAdmin) return;
    setEditingItemId(item.id);
    setName(item.name);
    setDescription(item.description ?? "");
    setTotalStock(String(item.totalStock));
    setCheckoutLimit(
      item.checkoutLimit === null || item.checkoutLimit === undefined
        ? ""
        : String(item.checkoutLimit),
    );
    setImageFile(null);
    setExistingImageUrl(item.imageUrl);
    setFormError(undefined);
    createMutation.reset();
    updateMutation.reset();
    deleteMutation.reset();
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isModalBusy) return;
    createMutation.reset();
    updateMutation.reset();
    deleteMutation.reset();
    closeModal();
  };

  const handleSubmitItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const stock = Number.parseInt(totalStock, 10);
    const limit =
      checkoutLimit.trim() === ""
        ? undefined
        : Number.parseInt(checkoutLimit, 10);

    if (!trimmedName || isModalBusy) return;
    if (!Number.isInteger(stock) || stock < 0) return;
    if (limit !== undefined && (!Number.isInteger(limit) || limit < 1)) return;

    setFormError(undefined);

    try {
      const imageUrl = imageFile
        ? await uploadInventoryImage(imageFile)
        : undefined;

      if (isEditMode && editingItemId) {
        await updateMutation.mutateAsync({
          itemId: editingItemId,
          name: trimmedName,
          description: description.trim() || undefined,
          totalStock: stock,
          checkoutLimit: limit,
          ...(imageUrl !== undefined ? { imageUrl } : {}),
        });
        return;
      }

      await createMutation.mutateAsync({
        name: trimmedName,
        description: description.trim() || undefined,
        totalStock: stock,
        checkoutLimit: limit,
        imageUrl,
      });
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : isEditMode
            ? "Failed to update inventory item."
            : "Failed to create inventory item.",
      );
    }
  };

  const handleDeleteItem = async () => {
    if (!editingItemId || isModalBusy) return;
    if (!window.confirm("Delete this inventory part?")) return;

    setFormError(undefined);

    try {
      await deleteMutation.mutateAsync(editingItemId);
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Failed to delete inventory item.",
      );
    }
  };

  const teamLabel = team ? `${team.name} (${team.number})` : "Your team";

  const filteredItems = useMemo(
    () => filterInventory(items, search, availabilityFilter, teamId),
    [items, search, availabilityFilter, teamId],
  );

  const summary = useMemo(
    () => summarizeInventory(items, teamId),
    [items, teamId],
  );

  if (!team) {
    return <InventoryFallback />;
  }

  return (
    <div className="relative flex-1 overflow-y-auto bg-white dark:bg-[#000000] px-8 py-6 font-sans dashboard-scroll">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(234,179,8,0.07),transparent_55%)]"
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
        <header className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-yellow-500/20 bg-yellow-500/10 shadow-[0_0_24px_rgba(234,179,8,0.12)]">
                  <Package className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-yellow-600 dark:text-yellow-400/80">
                    Workshop ops
                  </p>
                  <h1 className="text-[clamp(1.75rem,4vw,2.5rem)] font-black leading-none tracking-tight text-slate-900 dark:text-slate-100">
                    Inventory
                  </h1>
                </div>
              </div>
              <p className="mt-3 max-w-2xl text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-400">
                Track organization stock, sign-outs, and availability for {teamLabel}.
                Parts checked out by your team appear with borrower details.
              </p>
            </div>

            {isAdmin ? (
              <button
                type="button"
                onClick={openCreateModal}
                className="flex shrink-0 cursor-pointer items-center gap-1.5 self-start rounded-lg bg-yellow-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-yellow-500/15 transition hover:bg-yellow-500 motion-safe:active:scale-95 motion-reduce:transition-none"
              >
                <Plus className="h-4 w-4" />
                <span>Add Part</span>
              </button>
            ) : null}
          </div>
        </header>

        {isInitialLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="h-20 animate-pulse rounded-xl border border-slate-300 dark:border-[#1a1a1a] bg-slate-200 dark:bg-[#121212]/60"
                />
              ))}
            </div>
            <div className="h-28 animate-pulse rounded-2xl border border-slate-300 dark:border-[#1a1a1a] bg-slate-200 dark:bg-[#121212]/60" />
            <div className="grid gap-4 lg:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-48 animate-pulse rounded-2xl border border-[#1a1a1a] bg-slate-950/60"
                />
              ))}
            </div>
          </div>
        ) : isError ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-12 text-center">
            <AlertTriangle className="mx-auto mb-4 h-8 w-8 text-red-500 dark:text-red-400" />
            <h2 className="text-lg font-black text-slate-900 dark:text-slate-200">
              Unable to load inventory
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-500">
              Something went wrong while fetching parts. Please refresh and try again.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6 space-y-4">
              <InventoryStats items={items} teamId={teamId} />
              <InventoryFilters
                search={search}
                availabilityFilter={availabilityFilter}
                onSearchChange={setSearch}
                onAvailabilityChange={setAvailabilityFilter}
                resultCount={filteredItems.length}
              />
            </div>

            {filteredItems.length === 0 ? (
              <div className="rounded-2xl border border-slate-300 dark:border-[#1a1a1a] bg-slate-100 dark:bg-[#0a0a0a] p-12 text-center shadow-md">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-slate-400 dark:border-slate-800 bg-slate-200 dark:bg-[#121212]/60">
                  <Package className="h-7 w-7 text-slate-600 dark:text-slate-500" />
                </div>
                <h2 className="text-lg font-black text-slate-900 dark:text-slate-200">No parts found</h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-500">
                  {items.length === 0
                    ? isAdmin
                      ? "No inventory items yet. Add the first part to get started."
                      : "No inventory items have been added yet."
                    : "Try adjusting your search or availability filter."}
                </p>
                {items.length === 0 && isAdmin ? (
                  <button
                    type="button"
                    onClick={openCreateModal}
                    className="mt-5 inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-yellow-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-yellow-500/15 transition hover:bg-yellow-500 motion-safe:active:scale-95 motion-reduce:transition-none"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add First Part</span>
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="grid gap-4 pb-8 lg:grid-cols-2">
                {filteredItems.map((item, index) => (
                  <InventoryCard
                    key={item.id}
                    item={item}
                    teamId={teamId}
                    index={index}
                    onEdit={isAdmin ? () => openEditModal(item) : undefined}
                  />
                ))}
              </div>
            )}

            {summary.depleted > 0 ? (
              <div className="sticky bottom-4 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 backdrop-blur-md">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-400 motion-safe:animate-pulse" />
                <p className="text-xs font-bold text-red-200/90">
                  {summary.depleted} part{summary.depleted === 1 ? "" : "s"} fully
                  depleted — coordinate returns or reorder before the next build session.
                </p>
              </div>
            ) : null}
          </>
        )}
      </div>

      {isAdmin ? (
        <InventoryItemModal
          isOpen={isModalOpen}
          mode={isEditMode ? "edit" : "create"}
          name={name}
          description={description}
          totalStock={totalStock}
          checkoutLimit={checkoutLimit}
          imageFile={imageFile}
          existingImageUrl={existingImageUrl}
          onNameChange={setName}
          onDescriptionChange={setDescription}
          onTotalStockChange={setTotalStock}
          onCheckoutLimitChange={setCheckoutLimit}
          onImageFileChange={setImageFile}
          onClose={handleCloseModal}
          onSubmit={handleSubmitItem}
          onDelete={isEditMode ? handleDeleteItem : undefined}
          isSubmitting={
            createMutation.isPending || updateMutation.isPending
          }
          isDeleting={deleteMutation.isPending}
          error={formError}
        />
      ) : null}
    </div>
  );
}
