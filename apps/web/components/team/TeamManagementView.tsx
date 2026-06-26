"use client";

import { useState } from "react";
import type { UserRole } from "@stlvex/database/types";

import { EditMemberModal } from "./management/EditMemberModal";
import { GlobalPermissionsPanel } from "./management/GlobalPermissionsPanel";
import { InviteMemberModal } from "./management/InviteMemberModal";
import { TeamMembersPanel } from "./management/TeamMembersPanel";
import { TeamSettingsPanel } from "./management/TeamSettingsPanel";
import {
  type MemberStatus,
  type TeamMember,
} from "./management/team-management-types";

export type { TeamMember } from "./management/team-management-types";

type TeamManagementViewProps = {
  initialMembers: TeamMember[];
  teamLabel: string;
  canManage: boolean;
};

export function TeamManagementView({
  initialMembers,
  teamLabel,
  canManage,
}: TeamManagementViewProps) {
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

  const [manageMembers, setManageMembers] = useState(true);
  const [editBuildLog, setEditBuildLog] = useState(true);
  const [viewFinancials, setViewFinancials] = useState(true);
  const [season, setSeason] = useState("2024-2025 VEX V5 Competition");
  const [robotName, setRobotName] = useState("Chronos");

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

  function handleSaveTeamSettings() {
    if (!canManage) return;
    // UI-only placeholder — wiring comes later
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#03070e] px-8 py-6 font-sans scrollbar-thin scrollbar-thumb-slate-900 scrollbar-track-transparent">
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight text-slate-100">
          Team Management
        </h1>
        <p className="mt-1 text-xs font-semibold text-slate-400">
          {canManage
            ? `Manage roles, invites, and permissions for ${teamLabel}.`
            : `View roster for ${teamLabel}.`}
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <TeamMembersPanel
          members={members}
          canManage={canManage}
          onInvite={() => setIsInviteModalOpen(true)}
          onRoleChange={handleRoleChange}
          onEdit={handleStartEdit}
          onDelete={handleDeleteMember}
        />

        {canManage ? (
          <div className="space-y-6 lg:col-span-4">
            <GlobalPermissionsPanel
              manageMembers={manageMembers}
              editBuildLog={editBuildLog}
              viewFinancials={viewFinancials}
              onManageMembersChange={setManageMembers}
              onEditBuildLogChange={setEditBuildLog}
              onViewFinancialsChange={setViewFinancials}
            />
            <TeamSettingsPanel
              season={season}
              robotName={robotName}
              onSeasonChange={setSeason}
              onRobotNameChange={setRobotName}
              onSave={handleSaveTeamSettings}
            />
          </div>
        ) : null}
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
    </div>
  );
}
