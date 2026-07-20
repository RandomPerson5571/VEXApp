import { Plus } from "lucide-react";

import type { TeamMember } from "./team-management-types";
import { TeamMemberRow } from "./TeamMemberRow";

type TeamMembersPanelProps = {
  members: TeamMember[];
  canManage: boolean;
  onInvite: () => void;
  onRoleChange: (memberId: string, role: TeamMember["role"]) => void;
  onEdit: (member: TeamMember) => void;
  onDelete: (memberId: string) => void;
};

export function TeamMembersPanel({
  members,
  canManage,
  onInvite,
  onRoleChange,
  onEdit,
  onDelete,
}: TeamMembersPanelProps) {
  return (
    <div className="rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a] p-6 shadow-md">
      <div className="mb-5 flex items-center justify-between border-b border-[#1a1a1a] pb-3.5">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wide text-slate-200">
            Team Members
          </h2>
          <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
            {canManage
              ? "Manage roles and invites for your team"
              : "View members assigned to your team"}
          </p>
        </div>

        {canManage ? (
          <button
            type="button"
            onClick={onInvite}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-bold text-white shadow-lg shadow-orange-500/10 transition hover:bg-orange-500"
          >
            <Plus className="h-4 w-4" />
            <span>Invite Member</span>
          </button>
        ) : null}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="border-b border-[#1a1a1a] bg-[#0c1424] text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <tr>
              <th className="px-4 py-3 font-bold">Name</th>
              <th className="px-4 py-3 font-bold">Email</th>
              <th className="px-4 py-3 font-bold">Role</th>
              <th className="px-4 py-3 font-bold">Status</th>
              {canManage ? (
                <th className="px-4 py-3 text-right font-bold">Actions</th>
              ) : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900/40">
            {members.length === 0 ? (
              <tr>
                <td
                  colSpan={canManage ? 5 : 4}
                  className="px-4 py-8 text-center text-[11px] font-semibold text-slate-500"
                >
                  No members on this team yet.
                </td>
              </tr>
            ) : (
              members.map((member) => (
                <TeamMemberRow
                  key={member.id}
                  member={member}
                  canManage={canManage}
                  onRoleChange={onRoleChange}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
