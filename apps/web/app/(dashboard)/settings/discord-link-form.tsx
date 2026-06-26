"use client";

import { linkDiscordAccount } from "./actions";

type DiscordLinkFormProps = {
  linkedDiscordId: string | null;
  message?: string | null;
  error?: string | null;
};

export function DiscordLinkForm({
  linkedDiscordId,
  message,
  error,
}: DiscordLinkFormProps) {
  return (
    <div className="rounded-2xl border border-slate-900 bg-[#090e18]/80 p-5 space-y-4">
      {linkedDiscordId ? (
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Linked Discord account
          </p>
          <p className="font-mono text-sm text-emerald-300">{linkedDiscordId}</p>
        </div>
      ) : (
        <p className="text-sm text-slate-400">
          Connect your Discord account through OAuth so we can verify you own it.
          Manual Discord IDs are not accepted.
        </p>
      )}

      {error ? <div className="text-sm text-red-300">{error}</div> : null}
      {message ? <div className="text-sm text-emerald-300">{message}</div> : null}

      {!linkedDiscordId ? (
        <form action={linkDiscordAccount}>
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Connect with Discord
          </button>
        </form>
      ) : null}
    </div>
  );
}
