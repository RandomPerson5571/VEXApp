import { TEAM_FIELD_CLASS_NAME, TEAM_SEASON_OPTIONS } from "./team-management-types";

type TeamSettingsPanelProps = {
  season: string;
  robotName: string;
  onSeasonChange: (season: string) => void;
  onRobotNameChange: (name: string) => void;
  onSave: () => void;
};

export function TeamSettingsPanel({
  season,
  robotName,
  onSeasonChange,
  onRobotNameChange,
  onSave,
}: TeamSettingsPanelProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-900/80 bg-[#090e18]/80 p-5 shadow-md">
      <div className="border-b border-slate-900 pb-2.5">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-200">
          Team Settings
        </h2>
        <p className="mt-0.5 text-[10px] font-semibold text-slate-500">
          Configure generic season identity profiles
        </p>
      </div>

      <div className="space-y-4 text-xs font-semibold text-slate-300">
        <div className="space-y-1.5">
          <label
            className="text-[9px] uppercase tracking-widest text-[#a1a1aa]"
            htmlFor="season-select"
          >
            Season
          </label>
          <select
            id="season-select"
            value={season}
            onChange={(event) => onSeasonChange(event.target.value)}
            className={TEAM_FIELD_CLASS_NAME}
          >
            {TEAM_SEASON_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label
            className="text-[9px] uppercase tracking-widest text-[#a1a1aa]"
            htmlFor="robot-name-input"
          >
            Robot Name
          </label>
          <input
            id="robot-name-input"
            type="text"
            value={robotName}
            onChange={(event) => onRobotNameChange(event.target.value)}
            className={TEAM_FIELD_CLASS_NAME}
          />
        </div>

        <button
          type="button"
          onClick={onSave}
          className="w-full cursor-pointer rounded-lg bg-orange-600 py-2 font-bold text-white hover:bg-orange-500"
        >
          Save
        </button>
      </div>
    </div>
  );
}
