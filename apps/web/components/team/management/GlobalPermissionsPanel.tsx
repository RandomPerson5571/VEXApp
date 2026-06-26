import { PermissionToggle } from "./PermissionToggle";

type GlobalPermissionsPanelProps = {
  manageMembers: boolean;
  editBuildLog: boolean;
  viewFinancials: boolean;
  onManageMembersChange: (enabled: boolean) => void;
  onEditBuildLogChange: (enabled: boolean) => void;
  onViewFinancialsChange: (enabled: boolean) => void;
};

export function GlobalPermissionsPanel({
  manageMembers,
  editBuildLog,
  viewFinancials,
  onManageMembersChange,
  onEditBuildLogChange,
  onViewFinancialsChange,
}: GlobalPermissionsPanelProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-900/80 bg-[#090e18]/80 p-5 shadow-md">
      <div className="border-b border-slate-900 pb-2.5">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-200">
          Global Permissions & Settings
        </h2>
        <p className="mt-0.5 text-[10px] font-semibold text-slate-500">
          Control workspace-wide permission directives
        </p>
      </div>

      <div className="space-y-3">
        <PermissionToggle
          label="Manage Members"
          description="Allow team members to invite others"
          enabled={manageMembers}
          onToggle={() => onManageMembersChange(!manageMembers)}
        />
        <PermissionToggle
          label="Edit Build Log"
          description="Allow members to log build progresses"
          enabled={editBuildLog}
          onToggle={() => onEditBuildLogChange(!editBuildLog)}
        />
        <PermissionToggle
          label="View Financials"
          description="Allow members to audit inventory values"
          enabled={viewFinancials}
          onToggle={() => onViewFinancialsChange(!viewFinancials)}
        />
      </div>
    </div>
  );
}
