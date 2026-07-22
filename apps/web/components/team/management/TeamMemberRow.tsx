import type { TeamMember } from "./team-management-types";
import { formatTeamMemberRole } from "./team-management-types";
import { MemberStatusBadge } from "./MemberStatusBadge";
import { RoleSelect } from "./RoleSelect";

type TeamMemberRowProps = {
  member: TeamMember;
  canManage: boolean;
  onRoleChange: (memberId: string, role: TeamMember["role"]) => void;
  onEdit: (member: TeamMember) => void;
  onDelete: (memberId: string) => void;
};

export function TeamMemberRow({
  member,
  canManage,
  onRoleChange,
  onEdit,
  onDelete,
}: TeamMemberRowProps) {
  return (
    <tr className="transition hover:bg-slate-100 dark:hover:bg-slate-900/20">
      <td className="px-4 py-4 font-black text-slate-950 dark:text-slate-100">
        {member.name}
      </td>
      <td className="px-4 py-4 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
        {member.email}
      </td>
      <td className="px-4 py-4 font-bold text-slate-700 dark:text-slate-300">
        {canManage ? (
          <RoleSelect
            variant="inline"
            value={member.role}
            onChange={(role) => onRoleChange(member.id, role)}
          />
        ) : (
          <span>{formatTeamMemberRole(member.role)}</span>
        )}
      </td>
      <td className="px-4 py-4 font-semibold">
        <MemberStatusBadge status={member.status} />
      </td>
      {canManage ? (
        <td className="space-x-1.5 px-4 py-4 text-right font-semibold text-slate-500 dark:text-slate-400">
          <button
            type="button"
            onClick={() => onEdit(member)}
            className="cursor-pointer font-bold text-orange-500 hover:underline"
          >
            [Edit]
          </button>
          <button
            type="button"
            onClick={() => onDelete(member.id)}
            className="cursor-pointer font-bold text-red-500 hover:underline"
          >
            [Delete]
          </button>
        </td>
      ) : null}
    </tr>
  );
}
