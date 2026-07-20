"use client";

import { useEffect, useState } from "react";
import { Box, Loader2 } from "lucide-react";

import { TEAM_FIELD_CLASS_NAME } from "./team-management-types";
import { ModalFormActions, TeamManagementModal } from "./TeamManagementModal";

type FusionProject = {
  id: string;
  name: string;
  folderUrn: string;
  hubId: string;
};

type FusionProjectPickerModalProps = {
  connectSession: string;
  onClose: () => void;
  onSelect: (projectUrn: string, projectName: string) => Promise<void>;
};

export function FusionProjectPickerModal({
  connectSession,
  onClose,
  onSelect,
}: FusionProjectPickerModalProps) {
  const [projects, setProjects] = useState<FusionProject[]>([]);
  const [selectedUrn, setSelectedUrn] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProjects() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/team/fusion/projects?connectSession=${encodeURIComponent(connectSession)}`,
        );
        const data = (await response.json()) as {
          projects?: FusionProject[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(data.error ?? "Failed to load Fusion projects.");
        }

        if (cancelled) return;

        const loadedProjects = data.projects ?? [];
        setProjects(loadedProjects);
        setSelectedUrn(loadedProjects[0]?.folderUrn ?? "");
      } catch (loadError) {
        if (cancelled) return;

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load Fusion projects.",
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadProjects();

    return () => {
      cancelled = true;
    };
  }, [connectSession]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const project = projects.find((entry) => entry.folderUrn === selectedUrn);

    if (!project) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await onSelect(project.folderUrn, project.name);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to connect Fusion project.",
      );
      setIsSubmitting(false);
    }
  }

  return (
    <TeamManagementModal
      title={
        <>
          <Box className="h-5 w-5 text-blue-400" />
          <span>Select Fusion Project</span>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-xs font-semibold text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading projects…
          </div>
        ) : projects.length === 0 ? (
          <p className="rounded-lg border border-[#1a1a1a] bg-slate-950/60 px-3 py-4 text-center text-[11px] font-semibold text-slate-500">
            No Fusion projects found for this Autodesk account.
          </p>
        ) : (
          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Project
            </label>
            <select
              value={selectedUrn}
              onChange={(event) => setSelectedUrn(event.target.value)}
              className={TEAM_FIELD_CLASS_NAME}
            >
              {projects.map((project) => (
                <option key={project.folderUrn} value={project.folderUrn}>
                  {project.name}
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
          submitLabel={isSubmitting ? "Connecting…" : "Link Project"}
          submitDisabled={isLoading || isSubmitting || projects.length === 0}
        />
      </form>
    </TeamManagementModal>
  );
}
