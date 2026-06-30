import type { UserRole } from "@stlvex/database/types";
import { Users2 } from "lucide-react";

import { TEAM_FIELD_CLASS_NAME } from "./team-management-types";
import { ModalFormActions, TeamManagementModal } from "./TeamManagementModal";
import { RoleSelect } from "./RoleSelect";

type InviteMemberModalProps = {
  name: string;
  email: string;
  role: UserRole;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onRoleChange: (value: UserRole) => void;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
};

export function InviteMemberModal({
  name,
  email,
  role,
  onNameChange,
  onEmailChange,
  onRoleChange,
  onClose,
  onSubmit,
}: InviteMemberModalProps) {
  return (
    <TeamManagementModal
      title={
        <>
          <Users2 className="h-5 w-5 text-orange-400" />
          <span>Invite Team Member</span>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Full Name
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Jackson Dover"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            className={TEAM_FIELD_CLASS_NAME}
          />
        </div>

        <div className="space-y-1">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Email Address
          </label>
          <input
            type="email"
            required
            placeholder="e.g. j.dover@vexrobotics.com"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            className={TEAM_FIELD_CLASS_NAME}
          />
        </div>

        <div className="space-y-1">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Target Role
          </label>
          <RoleSelect value={role} onChange={onRoleChange} />
        </div>

        <ModalFormActions onCancel={onClose} submitLabel="Send Invite" />
      </form>
    </TeamManagementModal>
  );
}
