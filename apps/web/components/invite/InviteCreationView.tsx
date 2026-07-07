"use client";

import { Check, Copy, Link2, Loader2, Lock } from "lucide-react";
import { useEffect, useState, useTransition } from "react";

import { createInviteLink } from "@/app/(dashboard)/invite/actions";
import { useTeam, useUser } from "@/components/providers/UserProvider";
import {
  canCreateInvites,
  isGlobalAdmin,
} from "@/lib/auth/auth-guards";
import { useUserPermissions } from "@/lib/auth/use-user-permissions";

import { InviteSettingsPanel } from "./InviteSettingsPanel";
import {
  DEFAULT_MAX_USES,
  getDefaultInviteExpiryValue,
} from "./invite-settings";

const fieldClassName =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 dark:border-slate-900 dark:bg-slate-950/80 dark:text-slate-200 dark:placeholder:text-slate-600";

const labelClassName =
  "text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-500";

type InviteTeamOption = {
  id: string;
  name: string;
  number: string;
};

type InviteCreationViewProps = {
  teams: InviteTeamOption[];
  lockTeamSelection: boolean;
};

export function InviteCreationView({
  teams,
  lockTeamSelection,
}: InviteCreationViewProps) {
  const user = useUser();
  const team = useTeam();
  const permissions = useUserPermissions(team?.id ?? undefined);
  const canCreate = canCreateInvites(permissions);
  const isAdmin = isGlobalAdmin(user);

  const [selectedTeamId, setSelectedTeamId] = useState(teams[0]?.id ?? "");
  const [maxUses, setMaxUses] = useState(DEFAULT_MAX_USES);
  const [expiresAt, setExpiresAt] = useState(getDefaultInviteExpiryValue);
  const [inviteLink, setInviteLink] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!teams.some((team) => team.id === selectedTeamId)) {
      setSelectedTeamId(teams[0]?.id ?? "");
    }
  }, [selectedTeamId, teams]);

  function resetGeneratedLink() {
    setInviteLink("");
    setError(null);
    setCopied(false);
  }

  function handleCreateLink() {
    resetGeneratedLink();

    startTransition(async () => {
      const result = await createInviteLink({
        teamId: selectedTeamId,
        maxUses,
        expiresAt,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setInviteLink(result.link);
    });
  }

  async function handleCopyLink() {
    if (!inviteLink) return;

    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy the link. Copy it manually instead.");
    }
  }

  const teamSelectDisabled =
    lockTeamSelection || teams.length <= 1 || isPending || !canCreate;
  const isTeamLocked = lockTeamSelection && !isAdmin;
  const selectedTeam =
    teams.find((entry) => entry.id === selectedTeamId) ?? teams[0] ?? null;

  return (
    <div className="flex flex-1 overflow-y-auto bg-slate-50 dashboard-scroll dark:bg-[#03070e]">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-8 py-10">
        <header className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500 motion-reduce:animate-none">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-blue-600/90 dark:text-blue-400/90">
            Team onboarding
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 dark:text-slate-100">
            Create invite link
          </h1>
          <p className="mt-2 max-w-md text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-400">
            Generate a shareable link so new members can join a team. Adjust usage
            limits and expiry before you create it.
          </p>
          {isAdmin ? (
            <p className="mt-2 text-[11px] font-semibold text-slate-600 dark:text-slate-500">
              As a platform administrator, you can create invites for any team.
            </p>
          ) : null}
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_24px_80px_-50px_rgba(37,99,235,0.35)] backdrop-blur-sm motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-700 motion-reduce:animate-none dark:border-slate-900/80 dark:bg-[#090e18]/80 dark:shadow-[0_24px_80px_-40px_rgba(37,99,235,0.45)]">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10">
              <Link2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">New invite</h2>
              <p className="text-[11px] font-medium text-slate-600 dark:text-slate-500">
                {lockTeamSelection
                  ? "Invite links are created for your team."
                  : "Choose a team, then create your link."}
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <p className={labelClassName}>Team</p>
              {isTeamLocked && selectedTeam ? (
                <>
                  <div
                    aria-label={`Team locked to ${selectedTeam.name}`}
                    className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3.5 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300 motion-reduce:animate-none dark:border-slate-800/90 dark:bg-slate-950/50"
                  >
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-blue-500/70 to-blue-600/25"
                    />
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
                          {selectedTeam.name}
                        </p>
                        <p className="mt-0.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                          Team {selectedTeam.number}
                        </p>
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                        <Lock className="h-3 w-3" aria-hidden="true" />
                        Locked
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3.5 py-3 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-500 motion-reduce:animate-none">
                    <Lock
                      className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400"
                      aria-hidden="true"
                    />
                    <p className="text-xs font-medium leading-relaxed text-amber-800 dark:text-amber-300/90">
                      As a team leader, invite links are scoped to your assigned
                      team. Platform administrators can create invites for any
                      team.
                    </p>
                  </div>
                </>
              ) : (
                <select
                  id="invite-team"
                  value={selectedTeamId}
                  disabled={teamSelectDisabled}
                  onChange={(event) => {
                    setSelectedTeamId(event.target.value);
                    resetGeneratedLink();
                  }}
                  className={fieldClassName}
                >
                  {teams.length === 0 ? (
                    <option value="">No teams available</option>
                  ) : (
                    teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name} ({team.number})
                      </option>
                    ))
                  )}
                </select>
              )}
            </div>

            <InviteSettingsPanel
              maxUses={maxUses}
              expiresAt={expiresAt}
              disabled={isPending || !canCreate}
              onMaxUsesChange={(value) => {
                setMaxUses(value);
                resetGeneratedLink();
              }}
              onExpiresAtChange={(value) => {
                setExpiresAt(value);
                resetGeneratedLink();
              }}
            />

            <div className="space-y-1.5">
              <label htmlFor="invite-link" className={labelClassName}>
                Invite link
              </label>
              <div className="flex gap-2">
                <input
                  id="invite-link"
                  type="text"
                  readOnly
                  value={inviteLink}
                  placeholder="Your invite link will appear here"
                  className={`${fieldClassName} flex-1`}
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  disabled={!inviteLink}
                  className="inline-flex shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40 motion-safe:hover:scale-[1.02] motion-reduce:transition-none dark:border-slate-900 dark:bg-slate-950/80 dark:text-slate-300 dark:hover:border-slate-800 dark:hover:text-slate-100"
                  aria-label="Copy invite link"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {error ? (
              <p className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-300">
                {error}
              </p>
            ) : null}

            <button
              type="button"
              onClick={handleCreateLink}
              disabled={
                !selectedTeamId || teams.length === 0 || isPending || !canCreate
              }
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60 motion-safe:hover:scale-[1.01] motion-reduce:transition-none"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating link...
                </>
              ) : (
                "Create link"
              )}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
