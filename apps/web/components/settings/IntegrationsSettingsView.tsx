import { Link2 } from "lucide-react";
import Image from "next/image";

import Github from "@/public/logos/github-icon.svg";
import Onshape from "@/public/logos/onshape-icon.svg";
import Notion from "@/public/logos/notion-icon.svg";
import Fusion360 from "@/public/logos/fusion360-icon.svg";

import { SettingsSection } from "./SettingsSection";

type IntegrationOption = {
  id: string;
  name: string;
  description: string;
  icon: string;
  accentClassName: string;
  borderClassName: string;
};

const integrations: IntegrationOption[] = [
  {
    id: "onshape",
    name: "Onshape",
    description:
      "Sync CAD documents, release versions, and part metadata from your team's Onshape workspace.",
    icon: Onshape.src,
    accentClassName: "bg-emerald-500/10 border-emerald-500/20",
    borderClassName: "hover:border-emerald-500/20",
  },
  {
    id: "github",
    name: "GitHub",
    description:
      "Connect repositories to surface commits, pull requests, and deployment activity in the team hub.",
    icon: Github.src,
    accentClassName: "bg-slate-500/10 border-slate-500/20",
    borderClassName: "hover:border-slate-700/60",
  },
  {
    id: "fusion360",
    name: "Fusion 360",
    description:
      "Connect Fusion 360 to your team's workspace to sync CAD documents, release versions, and part metadata.",
    icon: Fusion360.src,
    accentClassName: "bg-blue-500/10 border-blue-500/20",
    borderClassName: "hover:border-blue-500/20",
  },
  {
    id: "notion",
    name: "Notion",
    description:
      "Connect Notion to your team's workspace to sync project management, task lists, and documentation.",
    icon: Notion.src,
    accentClassName: "bg-purple-500/10 border-purple-500/20",
    borderClassName: "hover:border-purple-500/20",
  },
];

type IntegrationsSettingsViewProps = {
  linkedDiscordId: string | null;
  message?: string | null;
  error?: string | null;
};

export function IntegrationsSettingsView({
  linkedDiscordId,
  message,
  error,
}: IntegrationsSettingsViewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-slate-950 tracking-tight dark:text-slate-100">
          Integrations
        </h1>
        <p className="text-xs text-slate-600 font-semibold mt-1 dark:text-slate-400">
          Connect external tools to keep design and development workflows in sync.
        </p>
      </div>

      <SettingsSection
        title="Connected Services"
        description="OAuth connections for third-party platforms used by your team."
      >
        <div className="space-y-4">

          {integrations.map((integration) => (
            <article
              key={integration.id}
              className={`group rounded-xl border border-slate-200 bg-slate-50 p-5 transition duration-200 dark:border-slate-900 dark:bg-slate-950/40 ${integration.borderClassName}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${integration.accentClassName}`}
                >
                  <Image
                    src={integration.icon}
                    alt={integration.name}
                    width={24}
                    height={24}
                  />
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                      {integration.name}
                    </h3>
                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900/80">
                      Not connected
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed dark:text-slate-500">
                    {integration.description}
                  </p>
                </div>

                <button
                  type="button"
                  disabled
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-500 cursor-not-allowed shrink-0 sm:self-center dark:border-slate-900 dark:bg-[#0a101d] dark:text-slate-600"
                >
                  <Link2 className="h-3.5 w-3.5" />
                  Connect
                </button>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
          Integrations are coming soon.
        </p>
      </SettingsSection>
    </div>
  );
}
