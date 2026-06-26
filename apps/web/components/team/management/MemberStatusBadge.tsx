import type { MemberStatus } from "./team-management-types";

type MemberStatusBadgeProps = {
  status: MemberStatus;
};

export function MemberStatusBadge({ status }: MemberStatusBadgeProps) {
  const isActive = status === "Active";

  return (
    <span
      className={`rounded border px-2 py-0.5 text-[10px] font-bold ${
        isActive
          ? "border-green-500/20 bg-green-500/10 text-green-400"
          : "border-red-500/20 bg-red-500/10 text-red-500"
      }`}
    >
      {status}
    </span>
  );
}
