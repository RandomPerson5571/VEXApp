"use client";

import { useState } from "react";
import { Box, ExternalLink, Link2, Loader2, Unlink } from "lucide-react";
import Image from "next/image";

import Fusion360 from "@/public/logos/fusion360-icon.svg";

import { IntegrationStatusBadge } from "./IntegrationStatusBadge";
import { PermissionToggle } from "./PermissionToggle";
import type { TeamFusionIntegration } from "./team-integration-types";

function truncateUrn(urn: string, maxLength = 42): string {
  if (urn.length <= maxLength) return urn;
  const head = urn.slice(0, 22);
  const tail = urn.slice(-14);
  return `${head}…${tail}`;
}

type FusionIntegrationPanelProps = {
  integration: TeamFusionIntegration | null;
  canManageIntegrations: boolean;
  onDisconnect: () => void;
  onActiveChange: (isActive: boolean) => void;
};

export function FusionIntegrationPanel({
  integration,
  canManageIntegrations,
  onDisconnect,
  onActiveChange,
}: FusionIntegrationPanelProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  const isConnected = integration !== null;

  async function handleConnect() {
    if (!canManageIntegrations || isConnecting) return;

    setIsConnecting(true);
    setConnectError(null);

    try {
      const response = await fetch("/api/team/fusion/connect");
      const data = (await response.json()) as {
        authorizeUrl?: string;
        error?: string;
      };

      if (response.ok && data.authorizeUrl) {
        window.location.href = data.authorizeUrl;
        return;
      }

      throw new Error(data.error ?? "Fusion integration is not configured.");
    } catch (error) {
      setConnectError(
        error instanceof Error ? error.message : "Failed to start Fusion connect.",
      );
      setIsConnecting(false);
    }
  }

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-900/80 bg-[#090e18]/80 p-5 shadow-md transition duration-300 hover:border-blue-500/15">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/[0.05] via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />

      <div className="relative space-y-4">
        <div className="flex items-start justify-between gap-3 border-b border-slate-900 pb-3.5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 transition-transform duration-300 group-hover:scale-105">
              <Image src={Fusion360.src} alt="Fusion 360" width={22} height={22} />
            </div>
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
                  Fusion 360 Project
                </h3>
                <IntegrationStatusBadge
                  connected={isConnected}
                  active={integration?.isActive}
                />
              </div>
              <p className="text-[10px] font-semibold leading-relaxed text-slate-500">
                Sync CAD milestones, design versions, and project updates from
                Autodesk Fusion.
              </p>
            </div>
          </div>

          {isConnected && canManageIntegrations ? (
            <button
              type="button"
              onClick={onDisconnect}
              className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-1.5 text-[10px] font-bold text-red-400 transition hover:border-red-500/30 hover:bg-red-500/15"
            >
              <Unlink className="h-3.5 w-3.5" />
              Disconnect
            </button>
          ) : null}
        </div>

        {isConnected && integration ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-slate-900 bg-slate-950/60 p-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-2.5">
                  <Box className="mt-0.5 h-4 w-4 shrink-0 text-blue-400/80" />
                  <div className="min-w-0 space-y-1">
                    <p className="text-[11px] font-bold text-slate-200">
                      {integration.projectName ?? "Unnamed project"}
                    </p>
                    <p
                      className="font-mono text-[9px] font-semibold text-slate-600"
                      title={integration.projectUrn}
                    >
                      {truncateUrn(integration.projectUrn)}
                    </p>
                  </div>
                </div>

                <a
                  href={`https://fusion360.autodesk.com/projects/${encodeURIComponent(integration.projectUrn)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center gap-1 rounded-md border border-slate-800 bg-slate-900/80 px-2 py-1 text-[9px] font-bold text-slate-400 transition hover:border-slate-700 hover:text-slate-200"
                >
                  Open
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              {integration.hookId ? (
                <div className="mt-3 border-t border-slate-900 pt-3 text-[9px] font-semibold text-slate-500">
                  Webhook hook · {integration.hookId.slice(0, 8)}…
                </div>
              ) : null}
            </div>

            {canManageIntegrations ? (
              <PermissionToggle
                label="Integration Active"
                description="Pause Fusion event delivery without removing the project link"
                enabled={integration.isActive}
                onToggle={() => onActiveChange(!integration.isActive)}
              />
            ) : null}
          </div>
        ) : canManageIntegrations ? (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => void handleConnect()}
              disabled={isConnecting}
              className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-800 bg-slate-950/80 py-2.5 text-xs font-bold text-slate-200 transition hover:border-blue-500/20 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isConnecting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Link2 className="h-3.5 w-3.5" />
              )}
              {isConnecting ? "Redirecting…" : "Connect Fusion Project"}
            </button>
            {connectError ? (
              <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-[10px] font-semibold text-red-400">
                {connectError}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="rounded-lg border border-slate-900 bg-slate-950/60 px-3 py-2.5 text-[10px] font-semibold text-slate-500">
            No Fusion project linked yet.
          </p>
        )}
      </div>
    </article>
  );
}
