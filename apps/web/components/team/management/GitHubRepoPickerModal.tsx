"use client";

import { useEffect, useState } from "react";
import { GitBranch, Loader2 } from "lucide-react";

import { TEAM_FIELD_CLASS_NAME } from "./team-management-types";
import { ModalFormActions, TeamManagementModal } from "./TeamManagementModal";

type GitHubRepo = {
  id: number;
  fullName: string;
  htmlUrl: string;
  private: boolean;
};

type GitHubRepoPickerModalProps = {
  installationId: number;
  onClose: () => void;
  onSelect: (repositoryFullName: string) => Promise<void>;
};

export function GitHubRepoPickerModal({
  installationId,
  onClose,
  onSelect,
}: GitHubRepoPickerModalProps) {
  const [repositories, setRepositories] = useState<GitHubRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadRepositories() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/team/github/repos?installationId=${installationId}`,
        );
        const data = (await response.json()) as {
          repositories?: GitHubRepo[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(data.error ?? "Failed to load repositories.");
        }

        if (cancelled) return;

        const repos = data.repositories ?? [];
        setRepositories(repos);
        setSelectedRepo(repos[0]?.fullName ?? "");
      } catch (loadError) {
        if (cancelled) return;

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load repositories.",
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadRepositories();

    return () => {
      cancelled = true;
    };
  }, [installationId]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!selectedRepo) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await onSelect(selectedRepo);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to connect repository.",
      );
      setIsSubmitting(false);
    }
  }

  return (
    <TeamManagementModal
      title={
        <>
          <GitBranch className="h-5 w-5 text-slate-400" />
          <span>Select GitHub Repository</span>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-xs font-semibold text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading repositories…
          </div>
        ) : repositories.length === 0 ? (
          <p className="rounded-lg border border-[#1a1a1a] bg-slate-950/60 px-3 py-4 text-center text-[11px] font-semibold text-slate-500">
            No repositories found for this GitHub App installation.
          </p>
        ) : (
          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Repository
            </label>
            <select
              value={selectedRepo}
              onChange={(event) => setSelectedRepo(event.target.value)}
              className={TEAM_FIELD_CLASS_NAME}
            >
              {repositories.map((repo) => (
                <option key={repo.id} value={repo.fullName}>
                  {repo.fullName}
                  {repo.private ? " (private)" : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {error ? (
          <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-[10px] font-semibold text-red-400">
            {error}
          </p>
        ) : null}

        <ModalFormActions
          onCancel={onClose}
          submitLabel={isSubmitting ? "Connecting…" : "Connect Repository"}
          submitDisabled={isLoading || isSubmitting || repositories.length === 0}
        />
      </form>
    </TeamManagementModal>
  );
}
