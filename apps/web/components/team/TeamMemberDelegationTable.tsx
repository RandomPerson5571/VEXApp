"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";

import type { UserRole } from "@stlvex/database/types";

export type TeamMemberRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
};

type TeamMemberDelegationTableProps = {
  teamId: string;
  members: TeamMemberRow[];
  currentUserId: string;
  canDelegate: boolean;
};

function formatRole(role: UserRole): string {
  return role
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

function isPromotableMember(role: UserRole): boolean {
  return role === "TEAM_MEMBER";
}

export function TeamMemberDelegationTable({
  teamId,
  members: initialMembers,
  currentUserId,
  canDelegate,
}: TeamMemberDelegationTableProps) {
  const [members, setMembers] = useState(initialMembers);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handlePromote(userId: string) {
    setError(null);
    setPendingUserId(userId);

    try {
      const response = await fetch("/api/team/delegate-leader", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, userId }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to promote member.");
      }

      setMembers((current) =>
        current.map((member) =>
          member.id === userId ? { ...member, role: "TEAM_LEADER" } : member,
        ),
      );
    } catch (promoteError) {
      setError(
        promoteError instanceof Error
          ? promoteError.message
          : "Failed to promote member.",
      );
    } finally {
      setPendingUserId(null);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-900 bg-[#090e18]/80 p-6 shadow-md">
      <div className="border-b border-slate-900 pb-3.5 mb-5">
        <h2 className="text-sm font-black uppercase tracking-wide text-slate-200">
          Team roster
        </h2>
        <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
          {canDelegate
            ? "Promote members to team leader to delegate local management."
            : "Members assigned to this team."}
        </p>
      </div>

      {error ? (
        <p className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-400">
          {error}
        </p>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="border-b border-slate-900 bg-[#0c1424] text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              {canDelegate ? (
                <th className="px-4 py-3 text-right">Actions</th>
              ) : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900/40">
            {members.map((member) => {
              const isSelf = member.id === currentUserId;
              const isPending = pendingUserId === member.id;
              const showPromote =
                canDelegate && isPromotableMember(member.role) && !isSelf;

              return (
                <tr key={member.id} className="transition hover:bg-slate-900/20">
                  <td className="px-4 py-4 font-black text-slate-100">
                    {member.firstName} {member.lastName}
                    {isSelf ? (
                      <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-blue-400">
                        You
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-4 text-[11px] font-semibold text-slate-400">
                    {member.email}
                  </td>
                  <td className="px-4 py-4 font-bold text-slate-300">
                    {formatRole(member.role)}
                  </td>
                  {canDelegate ? (
                    <td className="px-4 py-4 text-right">
                      {showPromote ? (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handlePromote(member.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/20 bg-blue-600/10 px-2.5 py-1 text-[10px] font-bold text-blue-400 transition hover:bg-blue-600/20 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                          aria-label={`Promote ${member.firstName} ${member.lastName} to team leader`}
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          {isPending ? "Promoting…" : "Make leader"}
                        </button>
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-600">
                          —
                        </span>
                      )}
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
