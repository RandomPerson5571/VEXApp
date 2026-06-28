"use client";

import { CheckCircle2 } from "lucide-react";
import Image from "next/image";

import DiscordIcon from "@/public/logos/discord-icon.svg";

import { linkDiscordAccount } from "./actions";

type DiscordLinkFormProps = {
  linkedDiscordId: string | null;
  message?: string | null;
  error?: string | null;
  embedded?: boolean;
  returnTo?: string;
};

const description =
  "Link your Discord account so team bots can verify your identity and assign server roles.";

export function DiscordLinkForm({
  linkedDiscordId,
  message,
  error,
  embedded = false,
  returnTo = "/settings/integrations",
}: DiscordLinkFormProps) {
  const isConnected = Boolean(linkedDiscordId);

  const connectButton = !isConnected ? (
    <form action={linkDiscordAccount} className="shrink-0">
      <input type="hidden" name="returnTo" value={returnTo} />
      <button
        type="submit"
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#5865F2] px-6 py-2 text-xs font-bold text-white transition hover:bg-[#4752C4] shadow-[0_0_20px_rgba(88,101,242,0.25)] hover:shadow-[0_0_24px_rgba(88,101,242,0.4)]"
      >
        Connect with Discord
      </button>
    </form>
  ) : null;

  const body = (
    <div className="flex flex-col gap-4">
      <div
        className={`flex flex-col gap-4 ${embedded ? "" : "sm:flex-row sm:items-center"}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 flex-1 min-w-0">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border bg-indigo-500/10 border-indigo-500/20">
            <Image src={DiscordIcon} alt="Discord" width={24} height={24} />
          </div>

          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-black text-slate-100">Discord</h3>
              <span
                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                  isConnected
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : "border-slate-800 bg-slate-900/80 text-slate-500"
                }`}
              >
                {isConnected ? "Connected" : "Not connected"}
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
          </div>
        </div>

        {!embedded && connectButton}
      </div>

      {isConnected ? (
        <div className="flex items-start gap-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3.5 py-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Linked Discord ID
            </p>
            <p className="mt-1 font-mono text-sm text-emerald-300 break-all">
              {linkedDiscordId}
            </p>
          </div>
        </div>
      ) : embedded ? (
        <p className="text-xs text-slate-500 leading-relaxed">
          Connect through OAuth so we can verify you own the account. Manual Discord
          IDs are not accepted.
        </p>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3.5 py-2.5 text-sm text-red-300">
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3.5 py-2.5 text-sm text-emerald-300">
          {message}
        </div>
      ) : null}

      {embedded ? connectButton : null}
    </div>
  );

  if (embedded) {
    return body;
  }

  return (
    <article className="group rounded-xl border border-slate-900 bg-slate-950/40 p-5 transition duration-200 hover:border-indigo-500/20">
      {body}
    </article>
  );
}
