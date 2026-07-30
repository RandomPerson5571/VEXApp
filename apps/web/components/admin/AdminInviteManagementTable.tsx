"use client";

import { useState, type CSSProperties } from "react";
import { AlertTriangle, Mail, Trash2 } from "lucide-react";

import { cn } from "@stlvex/ui";
import { Button } from "@stlvex/ui/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@stlvex/ui/components/table";

import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import {
  AdminEmptyState,
  AdminStatChip,
  AdminTableFrame,
  adminTableHeadClassName,
  adminTableRowClassName,
} from "./AdminPanelPrimitives";
import { formatTeamLabel, type AdminInviteRow } from "./admin-types";

type AdminInviteManagementTableProps = {
  invites: AdminInviteRow[];
  onInvitesDeleted: (inviteIds: string[]) => void;
  onError: (message: string | null) => void;
};

function formatExpiry(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function AdminInviteManagementTable({
  invites,
  onInvitesDeleted,
  onError,
}: AdminInviteManagementTableProps) {
  const [selectedInviteIds, setSelectedInviteIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const selectedCount = selectedInviteIds.size;
  const allSelected = invites.length > 0 && selectedCount === invites.length;
  const someSelected = selectedCount > 0 && !allSelected;
  const exhaustedCount = invites.filter(
    (invite) => invite.usesCount >= invite.maxUses,
  ).length;

  function toggleInviteSelection(inviteId: string, checked: boolean) {
    setSelectedInviteIds((current) => {
      const next = new Set(current);
      if (checked) next.add(inviteId);
      else next.delete(inviteId);
      return next;
    });
  }

  function toggleSelectAll(checked: boolean) {
    setSelectedInviteIds(
      checked ? new Set(invites.map((invite) => invite.id)) : new Set(),
    );
  }

  async function handleDeleteSelected() {
    const inviteIds = [...selectedInviteIds];
    if (inviteIds.length === 0) return;

    onError(null);
    setIsDeleting(true);

    try {
      const response = await fetch("/api/admin/delete-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteIds }),
      });

      const payload = (await response.json()) as {
        deletedInviteIds?: string[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to delete invites.");
      }

      onInvitesDeleted(payload.deletedInviteIds ?? inviteIds);
      setSelectedInviteIds(new Set());
      setShowDeleteConfirmation(false);
    } catch (deleteError) {
      onError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete invites.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <AdminStatChip icon={Mail} label={`${invites.length} invites`} />
        <AdminStatChip
          icon={Mail}
          label={`${exhaustedCount} exhausted`}
          variant={exhaustedCount > 0 ? "accent" : "default"}
        />
        {selectedCount > 0 ? (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={isDeleting}
            onClick={() => setShowDeleteConfirmation(true)}
            className="ml-auto"
          >
            <Trash2 className="size-3.5" />
            Delete {selectedCount}
          </Button>
        ) : null}
      </div>

      <AdminTableFrame>
        <Table className="min-w-[44rem]">
          <TableHeader>
            <TableRow className="border-[#1a1a1a] hover:bg-transparent">
              <TableHead className={cn(adminTableHeadClassName, "w-10 pr-0")}>
                <input
                  type="checkbox"
                  className="size-3.5 rounded border-slate-600 bg-slate-950 accent-red-500"
                  checked={allSelected}
                  ref={(element) => {
                    if (element) element.indeterminate = someSelected;
                  }}
                  onChange={(event) => toggleSelectAll(event.target.checked)}
                  disabled={invites.length === 0 || isDeleting}
                  aria-label="Select all invites"
                />
              </TableHead>
              <TableHead className={adminTableHeadClassName}>Code</TableHead>
              <TableHead className={adminTableHeadClassName}>Team</TableHead>
              <TableHead className={cn(adminTableHeadClassName, "w-[8rem]")}>
                Uses
              </TableHead>
              <TableHead className={adminTableHeadClassName}>Expires</TableHead>
              <TableHead className={adminTableHeadClassName}>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invites.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6}>
                  <AdminEmptyState
                    icon={Mail}
                    title="No invites"
                    description="Invite links created for teams will show up here for use tracking and deletion."
                  />
                </TableCell>
              </TableRow>
            ) : (
              invites.map((invite, index) => {
                const isSelected = selectedInviteIds.has(invite.id);
                const exhausted = invite.usesCount >= invite.maxUses;

                return (
                  <TableRow
                    key={invite.id}
                    className={cn(
                      adminTableRowClassName,
                      isDeleting && "opacity-60",
                      isSelected && "bg-red-500/5",
                    )}
                    style={{ animationDelay: `${index * 35}ms` } as CSSProperties}
                  >
                    <TableCell className="pr-0">
                      <input
                        type="checkbox"
                        className="size-3.5 rounded border-slate-600 bg-slate-950 accent-red-500"
                        checked={isSelected}
                        onChange={(event) =>
                          toggleInviteSelection(invite.id, event.target.checked)
                        }
                        disabled={isDeleting}
                        aria-label={`Select invite ${invite.id}`}
                      />
                    </TableCell>
                    <TableCell>
                      <code className="rounded bg-slate-950/60 px-1.5 py-0.5 font-mono text-[11px] text-slate-300">
                        {invite.id.slice(0, 8)}…
                      </code>
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-slate-200">
                      {formatTeamLabel(invite.team)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-bold tabular-nums",
                          exhausted
                            ? "border-[color:var(--site-accent)]/25 bg-[color:var(--site-accent)]/10 text-[color:var(--site-accent)]"
                            : "border-[#1a1a1a] bg-slate-950/40 text-slate-300",
                        )}
                      >
                        {invite.usesCount}/{invite.maxUses}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs font-medium text-slate-400">
                      {formatExpiry(invite.expiresAt)}
                    </TableCell>
                    <TableCell className="text-xs font-medium text-slate-400">
                      {formatExpiry(invite.createdAt)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </AdminTableFrame>

      <ConfirmationDialog
        isOpen={showDeleteConfirmation}
        title={
          selectedCount === 1
            ? "Delete this invite?"
            : `Delete ${selectedCount} invites?`
        }
        description={
          selectedCount === 1
            ? "Permanently delete this invite link? It will stop working immediately."
            : `Permanently delete ${selectedCount} invite links? They will stop working immediately.`
        }
        confirmLabel={selectedCount === 1 ? "Delete invite" : "Delete invites"}
        cancelLabel="Keep invites"
        variant="danger"
        pending={isDeleting}
        pendingLabel="Deleting…"
        icon={<AlertTriangle className="h-5 w-5 text-red-400" />}
        onClose={() => {
          if (!isDeleting) setShowDeleteConfirmation(false);
        }}
        onConfirm={() => {
          void handleDeleteSelected();
        }}
      />
    </div>
  );
}
