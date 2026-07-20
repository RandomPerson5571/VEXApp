import { FusionIntegrationPanel } from "./FusionIntegrationPanel";
import { GitHubIntegrationPanel } from "./GitHubIntegrationPanel";
import type {
  TeamFusionIntegration,
  TeamGitHubIntegration,
} from "./team-integration-types";

type TeamIntegrationsSectionProps = {
  githubIntegration: TeamGitHubIntegration | null;
  fusionIntegration: TeamFusionIntegration | null;
  canManageIntegrations: boolean;
  onGitHubDisconnect: () => void;
  onGitHubActiveChange: (isActive: boolean) => void;
  onFusionDisconnect: () => void;
  onFusionActiveChange: (isActive: boolean) => void;
};

export function TeamIntegrationsSection({
  githubIntegration,
  fusionIntegration,
  canManageIntegrations,
  onGitHubDisconnect,
  onGitHubActiveChange,
  onFusionDisconnect,
  onFusionActiveChange,
}: TeamIntegrationsSectionProps) {
  return (
    <section className="rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a] p-6 shadow-md">
      <div className="mb-5 border-b border-[#1a1a1a] pb-3.5">
        <h2 className="text-sm font-black uppercase tracking-wide text-slate-200">
          Workspace Integrations
        </h2>
        <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
          Link external repositories and CAD projects to your team workspace.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <GitHubIntegrationPanel
          integration={githubIntegration}
          canManageIntegrations={canManageIntegrations}
          onDisconnect={onGitHubDisconnect}
          onActiveChange={onGitHubActiveChange}
        />
        <FusionIntegrationPanel
          integration={fusionIntegration}
          canManageIntegrations={canManageIntegrations}
          onDisconnect={onFusionDisconnect}
          onActiveChange={onFusionActiveChange}
        />
      </div>
    </section>
  );
}
