"use client";

import { useMemo, useState } from "react";
import {
  Ban,
  Clock,
  LogOut,
  MoreHorizontal,
  ShieldOff,
  TimerReset,
} from "lucide-react";
import type { UserRole } from "@stlvex/database/types";
import {
  canModerateTarget,
  type ModerationOp,
} from "@stlvex/database/moderation-policy";

import { useUser } from "@/components/providers/UserProvider";
import { isUserBanned, isUserSuppressed } from "@/lib/auth/moderation";
import {
  ModerationActionDialog,
  type ModerationDialogAction,
} from "./ModerationActionDialog";

export type ModerationSubject = {
  id: string;
  name: string;
  role: UserRole;
  isAdmin: boolean;
  teamId: string | null;
  suppressedUntil: string | Date | null;
  bannedAt: string | Date | null;
};

type MemberModerationMenuProps = {
  subject: ModerationSubject;
  onComplete?: (result: {
    action: ModerationDialogAction;
    suppressedUntil?: string | null;
    bannedAt?: string | null;
    removedFromTeam?: boolean;
  }) => void;
  /** Compact inline buttons for table rows */
  variant?: "menu" | "inline";
};

const ACTION_META: {
  op: ModerationDialogAction;
  label: string;
  icon: typeof Clock;
  className: string;
  when: (s: ModerationSubject) => boolean;
}[] = [
  {
    op: "suppress",
    label: "Timeout",
    icon: Clock,
    className: "text-amber-500 hover:bg-amber-500/10",
    when: (s) => !isUserBanned(s) && !isUserSuppressed(s),
  },
  {
    op: "unsuppress",
    label: "Lift timeout",
    icon: TimerReset,
    className: "text-emerald-500 hover:bg-emerald-500/10",
    when: (s) => !isUserBanned(s) && isUserSuppressed(s),
  },
  {
    op: "kick",
    label: "Kick",
    icon: LogOut,
    className: "text-orange-500 hover:bg-orange-500/10",
    when: (s) => !isUserBanned(s) && Boolean(s.teamId),
  },
  {
    op: "ban",
    label: "Ban",
    icon: Ban,
    className: "text-red-500 hover:bg-red-500/10",
    when: (s) => !isUserBanned(s),
  },
  {
    op: "unban",
    label: "Unban",
    icon: ShieldOff,
    className: "text-emerald-400 hover:bg-emerald-500/10",
    when: (s) => isUserBanned(s),
  },
];

const ENDPOINTS: Record<ModerationDialogAction, string> = {
  suppress: "/api/moderation/suppress",
  unsuppress: "/api/moderation/unsuppress",
  kick: "/api/moderation/kick",
  ban: "/api/moderation/ban",
  unban: "/api/moderation/unban",
};

export function MemberModerationMenu({
  subject,
  onComplete,
  variant = "inline",
}: MemberModerationMenuProps) {
  const actor = useUser();
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState<ModerationDialogAction | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const available = useMemo(() => {
    const actorProfile = {
      id: actor.profile.id,
      isAdmin: actor.profile.isAdmin,
      role: actor.profile.role,
      teamId: actor.profile.teamId,
    };
    const target = {
      id: subject.id,
      isAdmin: subject.isAdmin,
      role: subject.role,
      teamId: subject.teamId,
    };

    return ACTION_META.filter((item) => {
      if (!item.when(subject)) return false;
      return canModerateTarget(actorProfile, target, item.op as ModerationOp);
    });
  }, [actor.profile, subject]);

  if (available.length === 0) {
    return null;
  }

  async function runAction(input: { reason: string; hours?: number }) {
    if (!action) return;
    setPending(true);
    setError(null);

    try {
      const body: Record<string, unknown> = {
        userId: subject.id,
        reason: input.reason || undefined,
      };
      if (action === "suppress") {
        body.hours = input.hours ?? 24;
      }

      const response = await fetch(ENDPOINTS[action], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await response.json()) as {
        error?: string;
        suppressedUntil?: string | null;
        bannedAt?: string | null;
      };

      if (!response.ok) {
        setError(data.error ?? "Action failed.");
        return;
      }

      onComplete?.({
        action,
        suppressedUntil: data.suppressedUntil,
        bannedAt: data.bannedAt,
        removedFromTeam: action === "kick" || action === "ban",
      });
      setOpen(false);
      setAction(null);
    } catch {
      setError("Network error.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <div
        className={
          variant === "inline"
            ? "inline-flex items-center justify-end gap-1"
            : "relative inline-flex"
        }
      >
        {variant === "menu" ? (
          <button
            type="button"
            aria-label={`Moderation actions for ${subject.name}`}
            onClick={() => setOpen((value) => !value)}
            className="rounded-lg p-1.5 text-slate-400 transition hover:scale-105 hover:bg-slate-100 hover:text-slate-700 motion-reduce:transform-none dark:hover:bg-[#121212] dark:hover:text-slate-200"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        ) : null}

        <div
          className={
            variant === "menu"
              ? open
                ? "absolute right-0 top-full z-20 mt-1 flex min-w-[10rem] flex-col gap-0.5 rounded-lg border border-slate-200 bg-white p-1 shadow-lg dark:border-[#1a1a1a] dark:bg-[#0a0a0a]"
                : "hidden"
              : "inline-flex flex-wrap items-center justify-end gap-1"
          }
        >
          {available.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.op}
                type="button"
                title={item.label}
                aria-label={`${item.label} ${subject.name}`}
                onClick={() => {
                  setAction(item.op);
                  setError(null);
                  setOpen(false);
                }}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-bold transition hover:scale-105 motion-reduce:transform-none ${item.className}`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <ModerationActionDialog
        isOpen={action !== null}
        action={action}
        targetName={subject.name}
        pending={pending}
        onClose={() => {
          if (pending) return;
          setAction(null);
          setError(null);
        }}
        onConfirm={runAction}
      />

      {error ? (
        <p className="mt-1 text-right text-[10px] font-semibold text-red-500">
          {error}
        </p>
      ) : null}
    </>
  );
}
