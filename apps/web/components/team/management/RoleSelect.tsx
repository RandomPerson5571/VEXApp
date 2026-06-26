import type { UserRole } from "@stlvex/database/types";

import {
  TEAM_INLINE_SELECT_CLASS_NAME,
  TEAM_ROSTER_USER_ROLES,
  TEAM_FIELD_CLASS_NAME,
  formatTeamMemberRole,
} from "./team-management-types";

type RoleSelectProps = {
  value: UserRole;
  onChange: (value: UserRole) => void;
  variant?: "inline" | "field";
  id?: string;
};

export function RoleSelect({
  value,
  onChange,
  variant = "field",
  id,
}: RoleSelectProps) {
  return (
    <select
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value as UserRole)}
      className={
        variant === "inline"
          ? TEAM_INLINE_SELECT_CLASS_NAME
          : TEAM_FIELD_CLASS_NAME
      }
    >
      {TEAM_ROSTER_USER_ROLES.map((role) => (
        <option key={role} value={role}>
          {formatTeamMemberRole(role)}
        </option>
      ))}
    </select>
  );
}
