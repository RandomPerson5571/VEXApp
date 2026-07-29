"use client";

import { useEffect, useId, useState } from "react";

import { Modal } from "@/components/ui/Modal";
import type { ModerationOp } from "@stlvex/database/moderation-policy";

export type ModerationDialogAction = Extract<
  ModerationOp,
  "suppress" | "unsuppress" | "kick" | "ban" | "unban"
>;

const ACTION_COPY: Record<
  ModerationDialogAction,
  { title: string; confirm: string; description: string; danger: boolean }
> = {
  suppress: {
    title: "Timeout user",
    confirm: "Apply timeout",
    description: "Puts the account in read-only mode for the selected duration.",
    danger: false,
  },
  unsuppress: {
    title: "Lift timeout",
    confirm: "Lift timeout",
    description: "Restores full write access for this account.",
    danger: false,
  },
  kick: {
    title: "Kick from team",
    confirm: "Kick",
    description: "Removes this user from the team. They can rejoin with a new invite.",
    danger: true,
  },
  ban: {
    title: "Ban user",
    confirm: "Ban",
    description: "Blocks login and app access until unbanned.",
    danger: true,
  },
  unban: {
    title: "Unban user",
    confirm: "Unban",
    description: "Restores login access for this account.",
    danger: false,
  },
};

const TIMEOUT_HOURS = [
  { label: "1 hour", hours: 1 },
  { label: "24 hours", hours: 24 },
  { label: "7 days", hours: 168 },
] as const;

type ModerationActionDialogProps = {
  isOpen: boolean;
  action: ModerationDialogAction | null;
  targetName: string;
  pending?: boolean;
  onClose: () => void;
  onConfirm: (input: { reason: string; hours?: number }) => void;
};

export function ModerationActionDialog({
  isOpen,
  action,
  targetName,
  pending = false,
  onClose,
  onConfirm,
}: ModerationActionDialogProps) {
  const titleId = useId();
  const reasonId = useId();
  const [reason, setReason] = useState("");
  const [hours, setHours] = useState(24);

  useEffect(() => {
    if (isOpen) {
      setReason("");
      setHours(24);
    }
  }, [isOpen, action]);

  if (!action) return null;

  const copy = ACTION_COPY[action];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      closeDisabled={pending}
      role="alertdialog"
      aria-labelledby={titleId}
      className="w-full max-w-md p-6"
    >
      <div className="mb-4 space-y-1 border-b border-slate-200 pb-3 dark:border-[#1a1a1a]">
        <h3
          id={titleId}
          className="text-sm font-black tracking-tight text-slate-900 dark:text-slate-100"
        >
          {copy.title}
        </h3>
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
          {copy.description} Target: <span className="text-slate-900 dark:text-slate-200">{targetName}</span>
        </p>
      </div>

      {action === "suppress" ? (
        <label className="mb-3 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Duration
          <select
            value={hours}
            onChange={(event) => setHours(Number(event.target.value))}
            disabled={pending}
            className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 outline-none transition focus:border-orange-500/50 dark:border-[#1a1a1a] dark:bg-slate-950 dark:text-slate-100"
          >
            {TIMEOUT_HOURS.map((option) => (
              <option key={option.hours} value={option.hours}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <label
        htmlFor={reasonId}
        className="mb-4 block text-[11px] font-bold uppercase tracking-wider text-slate-500"
      >
        Reason <span className="font-semibold normal-case tracking-normal text-slate-400">(optional)</span>
        <textarea
          id={reasonId}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          disabled={pending}
          rows={3}
          placeholder="Optional context for the audit log"
          className="mt-1.5 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 outline-none transition focus:border-orange-500/50 dark:border-[#1a1a1a] dark:bg-slate-950 dark:text-slate-100"
        />
      </label>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={pending}
          className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-200 hover:scale-105 motion-reduce:transform-none disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#121212] dark:text-slate-400 dark:hover:bg-[#1a1a1a]"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            onConfirm({
              reason: reason.trim(),
              hours: action === "suppress" ? hours : undefined,
            })
          }
          className={`rounded-lg px-5 py-2 text-xs font-bold transition hover:scale-105 motion-reduce:transform-none disabled:cursor-not-allowed disabled:opacity-60 ${
            copy.danger
              ? "bg-red-600 text-white hover:bg-red-500 shadow-lg shadow-red-900/20"
              : "bg-orange-600 text-white hover:bg-orange-500 shadow-lg shadow-orange-900/20"
          }`}
        >
          {pending ? "Working..." : copy.confirm}
        </button>
      </div>
    </Modal>
  );
}
