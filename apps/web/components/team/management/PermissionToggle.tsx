import { ToggleLeft, ToggleRight } from "lucide-react";

type PermissionToggleProps = {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
};

export function PermissionToggle({
  label,
  description,
  enabled,
  onToggle,
}: PermissionToggleProps) {
  return (
    <div className="flex items-center justify-between py-1 text-xs">
      <div className="flex flex-col">
        <span className="font-extrabold text-slate-300">{label}</span>
        <span className="mt-0.5 text-[10px] text-slate-500">{description}</span>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className="cursor-pointer text-slate-400 hover:text-slate-200"
        aria-pressed={enabled}
        aria-label={`${label}: ${enabled ? "On" : "Off"}`}
      >
        {enabled ? (
          <div className="flex items-center gap-1 rounded border border-blue-500/20 bg-blue-600/10 px-2 py-0.5 text-[10px] font-bold text-blue-400">
            <span>On</span>
            <ToggleRight className="h-5 w-5" />
          </div>
        ) : (
          <div className="flex items-center gap-1 rounded border border-slate-900 bg-slate-950 px-2 py-0.5 text-[10px] font-bold text-slate-500">
            <span>Off</span>
            <ToggleLeft className="h-5 w-5" />
          </div>
        )}
      </button>
    </div>
  );
}
