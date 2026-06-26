import type { UserRole } from "@stlvex/database/types";
import { ShieldCheck } from "lucide-react";

import type { MemberStatus } from "./team-management-types";
import { TEAM_FIELD_CLASS_NAME } from "./team-management-types";
import { ModalFormActions, TeamManagementModal } from "./TeamManagementModal";
import { RoleSelect } from "./RoleSelect";

type EditMemberModalProps = {
  name: string;
  email: string;
  role: UserRole;
  status: MemberStatus;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onRoleChange: (value: UserRole) => void;
  onStatusChange: (value: MemberStatus) => void;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
};

export function EditMemberModal({
  name,
  email,
  role,
  status,
  onNameChange,
  onEmailChange,
  onRoleChange,
  onStatusChange,
  onClose,
  onSubmit,
}: EditMemberModalProps) {
  return (
    <TeamManagementModal
      title={
        <>
          <ShieldCheck className="h-5 w-5 text-blue-400" />
          <span>Modify Roster Profile</span>
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
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            className={TEAM_FIELD_CLASS_NAME}
          />
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Role
            </label>
            <RoleSelect value={role} onChange={onRoleChange} />
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Status
            </label>
            <select
              value={status}
              onChange={(event) =>
                onStatusChange(event.target.value as MemberStatus)
              }
              className={TEAM_FIELD_CLASS_NAME}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        <ModalFormActions onCancel={onClose} submitLabel="Save Changes" />
      </form>
    </TeamManagementModal>
  );
}
