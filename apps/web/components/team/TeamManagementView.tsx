"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { UserRole } from "@stlvex/database/types";

import { EditMemberModal } from "./management/EditMemberModal";
import { GitHubRepoPickerModal } from "./management/GitHubRepoPickerModal";
import { InviteMemberModal } from "./management/InviteMemberModal";
import { TeamIntegrationsSection } from "./management/TeamIntegrationsSection";
import { TeamMembersPanel } from "./management/TeamMembersPanel";
import {
  type TeamFusionIntegration,
  type TeamGitHubIntegration,
} from "./management/team-integration-types";
import {
  type MemberStatus,
  type TeamMember,
} from "./management/team-management-types";

export type { TeamMember } from "./management/team-management-types";

type TeamManagementViewProps = {
  initialMembers: TeamMember[];
  initialGithubIntegration: TeamGitHubIntegration | null;
  teamLabel: string;
  canManage: boolean;
  canManageIntegrations: boolean;
};

type GitHubIntegrationResponse = {
  integration?: TeamGitHubIntegration;
  error?: string;
};

function parseInstallationId(value: string | null): number | null {
  if (!value?.trim()) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export function TeamManagementView({
  initialMembers,
  initialGithubIntegration,
  teamLabel,
  canManage,
  canManageIntegrations,
}: TeamManagementViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [members, setMembers] = useState<TeamMember[]>(initialMembers);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("TEAM_MEMBER");

  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<UserRole>("TEAM_MEMBER");
  const [editStatus, setEditStatus] = useState<MemberStatus>("Active");

  const [githubIntegration, setGithubIntegration] =
    useState<TeamGitHubIntegration | null>(initialGithubIntegration);
  const [fusionIntegration, setFusionIntegration] =
    useState<TeamFusionIntegration | null>(null);
  const [repoPickerInstallationId, setRepoPickerInstallationId] = useState<
    number | null
  >(null);
  const [githubBannerError, setGithubBannerError] = useState<string | null>(
    null,
  );

  useEffect(() => {
    const errorParam = searchParams.get("githubError");

    if (errorParam) {
      setGithubBannerError(errorParam);
      router.replace("/team-management", { scroll: false });
      return;
    }

    if (!canManageIntegrations) {
      return;
    }

    const installationId = parseInstallationId(
      searchParams.get("githubInstall"),
    );

    if (installationId) {
      setRepoPickerInstallationId(installationId);
      router.replace("/team-management", { scroll: false });
    }
  }, [canManageIntegrations, router, searchParams]);

  function handleRoleChange(memberId: string, role: UserRole) {
    if (!canManage) return;

    setMembers((prev) =>
      prev.map((member) =>
        member.id === memberId ? { ...member, role } : member,
      ),
    );
  }

  function handleInviteSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canManage || !newName || !newEmail) return;

    const newMember: TeamMember = {
      id: `m-${Date.now()}`,
      name: newName,
      email: newEmail,
      role: newRole,
      status: "Active",
    };

    setMembers((prev) => [...prev, newMember]);
    setIsInviteModalOpen(false);
    setNewName("");
    setNewEmail("");
    setNewRole("TEAM_MEMBER");
  }

  function handleDeleteMember(id: string) {
    if (!canManage) return;

    setMembers((prev) => prev.filter((member) => member.id !== id));
  }

  function handleStartEdit(member: TeamMember) {
    if (!canManage) return;

    setEditingMember(member);
    setEditName(member.name);
    setEditEmail(member.email);
    setEditRole(member.role);
    setEditStatus(member.status);
    setIsEditModalOpen(true);
  }

  function handleEditSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canManage || !editingMember) return;

    setMembers((prev) =>
      prev.map((member) =>
        member.id === editingMember.id
          ? {
              ...member,
              name: editName,
              email: editEmail,
              role: editRole,
              status: editStatus,
            }
          : member,
      ),
    );
    setIsEditModalOpen(false);
    setEditingMember(null);
  }

  async function handleGitHubConnect(repositoryFullName: string) {
    if (!canManageIntegrations || !repoPickerInstallationId) return;

    const response = await fetch("/api/team/github/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        installationId: repoPickerInstallationId,
        repositoryFullName,
      }),
    });

    const data = (await response.json()) as GitHubIntegrationResponse;

    if (!response.ok || !data.integration) {
      throw new Error(data.error ?? "Failed to connect GitHub repository.");
    }

    setGithubIntegration(data.integration);
    setRepoPickerInstallationId(null);
    setGithubBannerError(null);
  }

  async function handleGitHubDisconnect() {
    if (!canManageIntegrations) return;

    const response = await fetch("/api/team/github", { method: "DELETE" });
    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setGithubBannerError(data.error ?? "Failed to disconnect GitHub.");
      return;
    }

    setGithubIntegration(null);
    setGithubBannerError(null);
  }

  async function handleGitHubActiveChange(isActive: boolean) {
    if (!canManageIntegrations) return;

    const response = await fetch("/api/team/github", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });

    const data = (await response.json()) as GitHubIntegrationResponse;

    if (!response.ok || !data.integration) {
      setGithubBannerError(
        data.error ?? "Failed to update GitHub integration.",
      );
      return;
    }

    setGithubIntegration(data.integration);
    setGithubBannerError(null);
  }

  function handleFusionConnect(projectUrn: string, projectName: string | null) {
    if (!canManage) return;

    setFusionIntegration({
      id: `fu-${Date.now()}`,
      projectUrn,
      projectName,
      hookId: `hk_${Date.now().toString(36)}`,
      isActive: true,
    });
  }

  function handleFusionDisconnect() {
    if (!canManage) return;
    setFusionIntegration(null);
  }

  function handleFusionActiveChange(isActive: boolean) {
    if (!canManage) return;

    setFusionIntegration((prev) => (prev ? { ...prev, isActive } : null));
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-[#03070e] px-8 py-6 font-sans scrollbar-thin scrollbar-thumb-slate-900 scrollbar-track-transparent">
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight text-slate-100">
          Team Management
        </h1>
        <p className="mt-1 text-xs font-semibold text-slate-400">
          {canManage
            ? `Manage roles and invites for ${teamLabel}.`
            : `View roster for ${teamLabel}.`}
        </p>
      </div>

      {githubBannerError ? (
        <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[11px] font-semibold text-red-400">
          {githubBannerError}
        </div>
      ) : null}

      <TeamMembersPanel
        members={members}
        canManage={canManage}
        onInvite={() => setIsInviteModalOpen(true)}
        onRoleChange={handleRoleChange}
        onEdit={handleStartEdit}
        onDelete={handleDeleteMember}
      />

      <div className="mt-6">
        <TeamIntegrationsSection
          githubIntegration={githubIntegration}
          fusionIntegration={fusionIntegration}
          canManage={canManage}
          canManageIntegrations={canManageIntegrations}
          onGitHubDisconnect={handleGitHubDisconnect}
          onGitHubActiveChange={handleGitHubActiveChange}
          onFusionConnect={handleFusionConnect}
          onFusionDisconnect={handleFusionDisconnect}
          onFusionActiveChange={handleFusionActiveChange}
        />
      </div>

      {canManage && isInviteModalOpen ? (
        <InviteMemberModal
          name={newName}
          email={newEmail}
          role={newRole}
          onNameChange={setNewName}
          onEmailChange={setNewEmail}
          onRoleChange={setNewRole}
          onClose={() => setIsInviteModalOpen(false)}
          onSubmit={handleInviteSubmit}
        />
      ) : null}

      {canManage && isEditModalOpen && editingMember ? (
        <EditMemberModal
          name={editName}
          email={editEmail}
          role={editRole}
          status={editStatus}
          onNameChange={setEditName}
          onEmailChange={setEditEmail}
          onRoleChange={setEditRole}
          onStatusChange={setEditStatus}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleEditSubmit}
        />
      ) : null}

      {canManageIntegrations && repoPickerInstallationId ? (
        <GitHubRepoPickerModal
          installationId={repoPickerInstallationId}
          onClose={() => setRepoPickerInstallationId(null)}
          onSelect={handleGitHubConnect}
        />
      ) : null}
    </div>
  );
}
