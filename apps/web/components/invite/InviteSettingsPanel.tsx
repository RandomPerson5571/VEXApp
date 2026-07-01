"use client";

import { CalendarClock, Users } from "lucide-react";

const fieldClassName =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-900 dark:bg-slate-950/80 dark:text-slate-200 dark:placeholder:text-slate-600";

const labelClassName =
  "text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-500";

type InviteSettingsPanelProps = {
  maxUses: number;
  expiresAt: string;
  disabled?: boolean;
  onMaxUsesChange: (value: number) => void;
  onExpiresAtChange: (value: string) => void;
};

export function InviteSettingsPanel({
  maxUses,
  expiresAt,
  disabled = false,
  onMaxUsesChange,
  onExpiresAtChange,
}: InviteSettingsPanelProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-900/70 dark:bg-slate-950/35">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white dark:border-slate-800/80 dark:bg-slate-950/60">
          <CalendarClock className="h-4 w-4 text-slate-600 dark:text-slate-400" />
        </div>
        <div>
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">Link settings</h3>
          <p className="text-[11px] font-medium text-slate-600 dark:text-slate-500">
            Control usage limits and when the invite expires.
          </p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="invite-max-uses" className={labelClassName}>
            Max uses
          </label>
          <div className="relative">
            <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
            <input
              id="invite-max-uses"
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              value={maxUses}
              disabled={disabled}
              onChange={(event) => {
                const next = Number.parseInt(event.target.value, 10);
                onMaxUsesChange(Number.isNaN(next) ? 1 : Math.max(1, next));
              }}
              className={`${fieldClassName} pl-9`}
            />
          </div>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-600">
            Number of sign-ups this link can support.
          </p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="invite-expires-at" className={labelClassName}>
            Expiry date
          </label>
          <input
            id="invite-expires-at"
            type="datetime-local"
            value={expiresAt}
            disabled={disabled}
            onChange={(event) => onExpiresAtChange(event.target.value)}
            className={`${fieldClassName} [color-scheme:light] dark:[color-scheme:dark]`}
          />
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-600">
            The link stops working after this date and time.
          </p>
        </div>
      </div>
    </div>
  );
}
