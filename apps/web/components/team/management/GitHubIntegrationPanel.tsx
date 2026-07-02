"use client";

import { useState } from "react";
import {
  ExternalLink,
  GitBranch,
  Link2,
  Unlink,
  Webhook,
} from "lucide-react";
import Image from "next/image";

import Github from "@/public/logos/github-icon.svg";

import { IntegrationStatusBadge } from "./IntegrationStatusBadge";
import { PermissionToggle } from "./PermissionToggle";
import {
  MOCK_GITHUB_REPOS,
  type TeamGitHubIntegration,
} from "./team-integration-types";
import { TEAM_FIELD_CLASS_NAME } from "./team-management-types";

type GitHubIntegrationPanelProps = {
  integration: TeamGitHubIntegration | null;
  onConnect: (repositoryFullName: string) => void;
  onDisconnect: () => void;
  onActiveChange: (isActive: boolean) => void;
};

export function GitHubIntegrationPanel({
  integration,
  onConnect,
  onDisconnect,
  onActiveChange,
}: GitHubIntegrationPanelProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState(MOCK_GITHUB_REPOS[0].fullName);
  const [customRepo, setCustomRepo] = useState("");

  const isConnected = integration !== null;
  const useCustomRepo = selectedRepo === "__custom__";

  function handleConnect(event: React.FormEvent) {
    event.preventDefault();
    const fullName = useCustomRepo ? customRepo.trim() : selectedRepo;
    if (!fullName) return;

    onConnect(fullName);
    setIsConnecting(false);
    setCustomRepo("");
  }

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-900/80 bg-[#090e18]/80 p-5 shadow-md transition duration-300 hover:border-slate-800/90">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-slate-500/[0.04] via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />

      <div className="relative space-y-4">
        <div className="flex items-start justify-between gap-3 border-b border-slate-900 pb-3.5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-500/20 bg-slate-500/10 transition-transform duration-300 group-hover:scale-105">
              <Image src={Github.src} alt="GitHub" width={22} height={22} />
            </div>
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
                  GitHub Repository
                </h3>
                <IntegrationStatusBadge
                  connected={isConnected}
                  active={integration?.isActive}
                />
              </div>
              <p className="text-[10px] font-semibold leading-relaxed text-slate-500">
                Link a repository to receive push and pull request events in your
                team hub.
              </p>
            </div>
          </div>

          {isConnected ? (
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
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <GitBranch className="h-4 w-4 shrink-0 text-slate-500" />
                  <div className="min-w-0">
                    <p className="truncate font-mono text-[11px] font-bold text-slate-200">
                      {integration.repositoryFullName}
                    </p>
                    {integration.repositoryId ? (
                      <p className="mt-0.5 text-[9px] font-semibold text-slate-600">
                        ID {integration.repositoryId}
                      </p>
                    ) : null}
                  </div>
                </div>

                {integration.repositoryUrl ? (
                  <a
                    href={integration.repositoryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex shrink-0 items-center gap-1 rounded-md border border-slate-800 bg-slate-900/80 px-2 py-1 text-[9px] font-bold text-slate-400 transition hover:border-slate-700 hover:text-slate-200"
                  >
                    Open
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : null}
              </div>

              {integration.webhookId ? (
                <div className="mt-3 flex items-center gap-1.5 border-t border-slate-900 pt-3 text-[9px] font-semibold text-slate-500">
                  <Webhook className="h-3 w-3 text-emerald-500/80" />
                  Webhook configured
                </div>
              ) : null}
            </div>

            <PermissionToggle
              label="Integration Active"
              description="Pause event delivery without removing the connection"
              enabled={integration.isActive}
              onToggle={() => onActiveChange(!integration.isActive)}
            />
          </div>
        ) : (
          <div className="space-y-3">
            {isConnecting ? (
              <form onSubmit={handleConnect} className="space-y-3">
                <div className="space-y-1.5">
                  <label
                    htmlFor="github-repo-select"
                    className="text-[9px] font-bold uppercase tracking-widest text-slate-500"
                  >
                    Repository
                  </label>
                  <select
                    id="github-repo-select"
                    value={selectedRepo}
                    onChange={(event) => setSelectedRepo(event.target.value)}
                    className={TEAM_FIELD_CLASS_NAME}
                  >
                    {MOCK_GITHUB_REPOS.map((repo) => (
                      <option key={repo.fullName} value={repo.fullName}>
                        {repo.fullName}
                      </option>
                    ))}
                    <option value="__custom__">Custom repository…</option>
                  </select>
                </div>

                {useCustomRepo ? (
                  <div className="space-y-1.5">
                    <label
                      htmlFor="github-custom-repo"
                      className="text-[9px] font-bold uppercase tracking-widest text-slate-500"
                    >
                      owner/repo
                    </label>
                    <input
                      id="github-custom-repo"
                      type="text"
                      value={customRepo}
                      onChange={(event) => setCustomRepo(event.target.value)}
                      placeholder="stlvex-robotics/competition-bot"
                      className={TEAM_FIELD_CLASS_NAME}
                    />
                  </div>
                ) : null}

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 cursor-pointer rounded-lg bg-orange-600 py-2 text-xs font-bold text-white transition hover:bg-orange-500"
                  >
                    Link Repository
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsConnecting(false)}
                    className="cursor-pointer rounded-lg border border-slate-800 px-3 py-2 text-xs font-bold text-slate-400 transition hover:border-slate-700 hover:text-slate-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setIsConnecting(true)}
                className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-800 bg-slate-950/80 py-2.5 text-xs font-bold text-slate-200 transition hover:border-slate-700 hover:bg-slate-900"
              >
                <Link2 className="h-3.5 w-3.5" />
                Connect Repository
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
