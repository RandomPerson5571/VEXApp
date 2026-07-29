import type { TeamMember } from "./team-management-types";
import { formatTeamMemberRole } from "./team-management-types";
import { MemberStatusBadge } from "./MemberStatusBadge";
import { RoleSelect } from "./RoleSelect";
import { MemberModerationMenu } from "@/components/moderation/MemberModerationMenu";
import { isUserBanned, isUserSuppressed } from "@/lib/auth/moderation";

type TeamMemberRowProps = {
  member: TeamMember;
  canManage: boolean;
  onRoleChange: (memberId: string, role: TeamMember["role"]) => void;
  onEdit: (member: TeamMember) => void;
  onDelete: (memberId: string) => void;
  onModerationComplete: (
    memberId: string,
    result: {
      action: string;
      suppressedUntil?: string | null;
      bannedAt?: string | null;
      removedFromTeam?: boolean;
    },
  ) => void;
};

export function TeamMemberRow({
  member,
  canManage,
  onRoleChange,
  onEdit,
  onDelete,
  onModerationComplete,
}: TeamMemberRowProps) {
  const suppressed = isUserSuppressed({
    suppressedUntil: member.suppressedUntil,
  });
  const banned = isUserBanned({ bannedAt: member.bannedAt });

  return (
    <tr className="transition hover:bg-slate-100 dark:hover:bg-slate-900/20">
      <td className="px-4 py-4 font-black text-slate-950 dark:text-slate-100">
        {member.name}
        {banned ? (
          <span className="ml-2 rounded border border-red-600/50 bg-red-600/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-red-500">
            Banned
          </span>
        ) : suppressed ? (
          <span className="ml-2 rounded border border-red-500/40 bg-red-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-red-500">
            Read-only
          </span>
        ) : null}
        {member.moderationReason ? (
          <p className="mt-0.5 text-[10px] font-semibold text-slate-500">
            {member.moderationReason}
          </p>
        ) : null}
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
            className="cursor-pointer font-bold text-orange-500 transition hover:scale-105 hover:underline motion-reduce:transform-none"
          >
            Edit
          </button>
          <MemberModerationMenu
            subject={{
              id: member.id,
              name: member.name,
              role: member.role,
              isAdmin: member.isAdmin,
              teamId: member.teamId,
              suppressedUntil: member.suppressedUntil,
              bannedAt: member.bannedAt,
            }}
            onComplete={(result) => onModerationComplete(member.id, result)}
          />
          <button
            type="button"
            onClick={() => onDelete(member.id)}
            className="cursor-pointer font-bold text-red-500/70 transition hover:scale-105 hover:underline motion-reduce:transform-none"
          >
            Delete
          </button>
        </td>
      ) : null}
    </tr>
  );
}
