import { FusionIntegrationPanel } from "./FusionIntegrationPanel";
import { GitHubIntegrationPanel } from "./GitHubIntegrationPanel";
import type {
  TeamFusionIntegration,
  TeamGitHubIntegration,
} from "./team-integration-types";

type TeamIntegrationsSectionProps = {
  githubIntegration: TeamGitHubIntegration | null;
  fusionIntegration: TeamFusionIntegration | null;
  onGitHubConnect: (repositoryFullName: string) => void;
  onGitHubDisconnect: () => void;
  onGitHubActiveChange: (isActive: boolean) => void;
  onFusionConnect: (projectUrn: string, projectName: string | null) => void;
  onFusionDisconnect: () => void;
  onFusionActiveChange: (isActive: boolean) => void;
};

export function TeamIntegrationsSection({
  githubIntegration,
  fusionIntegration,
  onGitHubConnect,
  onGitHubDisconnect,
  onGitHubActiveChange,
  onFusionConnect,
  onFusionDisconnect,
  onFusionActiveChange,
}: TeamIntegrationsSectionProps) {
  return (
    <section className="rounded-2xl border border-slate-900 bg-[#090e18]/80 p-6 shadow-md">
      <div className="mb-5 border-b border-slate-900 pb-3.5">
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
          onConnect={onGitHubConnect}
          onDisconnect={onGitHubDisconnect}
          onActiveChange={onGitHubActiveChange}
        />
        <FusionIntegrationPanel
          integration={fusionIntegration}
          onConnect={onFusionConnect}
          onDisconnect={onFusionDisconnect}
          onActiveChange={onFusionActiveChange}
        />
      </div>
    </section>
  );
}
