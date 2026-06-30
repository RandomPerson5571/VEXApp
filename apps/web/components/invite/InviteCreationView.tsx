"use client";

import { Check, Copy, Link2, Loader2 } from "lucide-react";
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
  "w-full rounded-lg border border-slate-900 bg-slate-950/80 px-3 py-2.5 text-xs font-semibold text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20";

const labelClassName =
  "text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500";

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

  return (
    <div className="flex flex-1 overflow-y-auto dashboard-scroll">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-8 py-10">
        <header className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500 motion-reduce:animate-none">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-blue-400/90">
            Team onboarding
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-100">
            Create invite link
          </h1>
          <p className="mt-2 max-w-md text-sm font-medium leading-relaxed text-slate-400">
            Generate a shareable link so new members can join a team. Adjust usage
            limits and expiry before you create it.
          </p>
          {isAdmin ? (
            <p className="mt-2 text-[11px] font-semibold text-slate-500">
              As a platform administrator, you can create invites for any team.
            </p>
          ) : null}
        </header>

        <section className="rounded-2xl border border-slate-900/80 bg-[#090e18]/80 p-6 shadow-[0_24px_80px_-40px_rgba(37,99,235,0.45)] backdrop-blur-sm motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-700 motion-reduce:animate-none">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10">
              <Link2 className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">New invite</h2>
              <p className="text-[11px] font-medium text-slate-500">
                {lockTeamSelection
                  ? "Invite links are created for your team."
                  : "Choose a team, then create your link."}
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="invite-team" className={labelClassName}>
                Team
              </label>
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
                  className="inline-flex shrink-0 items-center justify-center rounded-lg border border-slate-900 bg-slate-950/80 px-3 text-slate-300 transition hover:border-slate-800 hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-40 motion-safe:hover:scale-[1.02] motion-reduce:transition-none"
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
              <p className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs font-semibold text-red-300">
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
