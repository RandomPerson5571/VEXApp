import type { TeamMember } from "./team-management-types";
import { TeamMemberRow } from "./TeamMemberRow";

type TeamMembersPanelProps = {
  members: TeamMember[];
  canManage: boolean;
  onRoleChange: (memberId: string, role: TeamMember["role"]) => void;
  onEdit: (member: TeamMember) => void;
  onDelete: (memberId: string) => void;
};

export function TeamMembersPanel({
  members,
  canManage,
  onRoleChange,
  onEdit,
  onDelete,
}: TeamMembersPanelProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md dark:border-[#1a1a1a] dark:bg-[#0a0a0a]">
      <div className="mb-5 border-b border-slate-200 pb-3.5 dark:border-[#1a1a1a]">
        <h2 className="text-sm font-black uppercase tracking-wide text-slate-900 dark:text-slate-200">
          Team Members
        </h2>
        <p className="mt-0.5 text-[11px] font-semibold text-slate-600 dark:text-slate-500">
          {canManage
            ? "Manage roles for your team"
            : "View members assigned to your team"}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
          <thead className="border-b border-slate-200 bg-slate-100 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:border-[#1a1a1a] dark:bg-[#0c1424] dark:text-slate-400">
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
          <tbody className="divide-y divide-slate-200 dark:divide-slate-900/40">
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
